import { Injectable, effect, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebSocketService } from '@core/websocket/websocket.service';
import { BINANCE_WS_STREAM_URL } from './binance.const';
import {
  BinanceSubscriptionRequest,
  BinanceSubscriptionResponse,
  ChartCandle,
  MarketTicker,
} from './binance.types';
import {
  isBinanceKlineMessage,
  isBinanceMiniTickerMessage,
  toKlineStream,
  toMarketTicker,
  toMiniTickerStream,
  unwrapCombinedStream,
  wsKlineToCandle,
} from './binance.utils';

interface StreamEntry<T> {
  refCount: number;
  subject: Subject<T>;
}

/**
 * Ref-counted Binance public streams over one physical WebSocket.
 * Does not idle-disconnect when desired set is empty (route-transition safe).
 */
@Injectable({ providedIn: 'root' })
export class BinanceMarketDataService {
  private readonly ws = inject(WebSocketService);

  private readonly tickerStreams = new Map<string, StreamEntry<MarketTicker>>();
  private readonly klineStreams = new Map<string, StreamEntry<ChartCandle>>();
  /** Explicit page-level miniTicker targets (e.g. markets first-N). */
  private readonly targetStreams = new Set<string>();
  /** Streams currently subscribed on the open socket. */
  private readonly wiredStreams = new Set<string>();
  private nextRequestId = 1;
  private lastConnectionState = this.ws.state();

  constructor() {
    this.ws.messages$.subscribe((raw) => this.onMessage(raw));

    effect(() => {
      const state = this.ws.state();
      const prev = this.lastConnectionState;
      this.lastConnectionState = state;

      if (state === 'connected' && prev !== 'connected') {
        this.wiredStreams.clear();
        this.syncWire();
      }
    });
  }

  /**
   * Watch a Binance pair (e.g. `btcusdt`) miniTicker.
   * First consumer → SUBSCRIBE; last release → UNSUBSCRIBE (unless still a target).
   */
  watchMiniTicker(pair: string): Observable<MarketTicker> {
    const normalized = pair.trim().toLowerCase();
    if (!normalized) {
      return new Observable<MarketTicker>((sub) => sub.complete());
    }

    const stream = toMiniTickerStream(normalized);

    return new Observable<MarketTicker>((subscriber) => {
      const entry = this.ensureTickerEntry(stream);
      entry.refCount += 1;
      this.ensureConnected();
      this.syncWire();

      const inner = entry.subject.subscribe(subscriber);

      return () => {
        inner.unsubscribe();
        this.releaseTicker(stream);
      };
    });
  }

  /**
   * Watch a Binance kline stream (e.g. `btcusdt` + `15m`).
   * Interval changes are a different stream name → caller must unsubscribe old.
   */
  watchKline(pair: string, interval: string): Observable<ChartCandle> {
    const normalized = pair.trim().toLowerCase();
    const iv = interval.trim();
    if (!normalized || !iv) {
      return new Observable<ChartCandle>((sub) => sub.complete());
    }

    const stream = toKlineStream(normalized, iv);

    return new Observable<ChartCandle>((subscriber) => {
      const entry = this.ensureKlineEntry(stream);
      entry.refCount += 1;
      this.ensureConnected();
      this.syncWire();

      const inner = entry.subject.subscribe(subscriber);

      return () => {
        inner.unsubscribe();
        this.releaseKline(stream);
      };
    });
  }

  /**
   * Diff-based miniTicker target set for pages that own a symbol list.
   * Does not tear the socket; only SUBSCRIBE/UNSUBSCRIBE deltas.
   */
  setMiniTickerTargets(pairs: readonly string[]): void {
    this.targetStreams.clear();
    for (const p of pairs) {
      const normalized = p.trim().toLowerCase();
      if (!normalized) continue;
      const stream = toMiniTickerStream(normalized);
      this.targetStreams.add(stream);
      this.ensureTickerEntry(stream);
    }
    this.ensureConnected();
    this.syncWire();
  }

  private desiredStreams(): Set<string> {
    const desired = new Set(this.targetStreams);
    for (const [stream, entry] of this.tickerStreams) {
      if (entry.refCount > 0) desired.add(stream);
    }
    for (const [stream, entry] of this.klineStreams) {
      if (entry.refCount > 0) desired.add(stream);
    }
    return desired;
  }

  private ensureTickerEntry(stream: string): StreamEntry<MarketTicker> {
    let entry = this.tickerStreams.get(stream);
    if (!entry) {
      entry = { refCount: 0, subject: new Subject<MarketTicker>() };
      this.tickerStreams.set(stream, entry);
    }
    return entry;
  }

  private ensureKlineEntry(stream: string): StreamEntry<ChartCandle> {
    let entry = this.klineStreams.get(stream);
    if (!entry) {
      entry = { refCount: 0, subject: new Subject<ChartCandle>() };
      this.klineStreams.set(stream, entry);
    }
    return entry;
  }

  private releaseTicker(stream: string): void {
    const entry = this.tickerStreams.get(stream);
    if (!entry) return;
    entry.refCount = Math.max(0, entry.refCount - 1);

    if (entry.refCount === 0 && !this.targetStreams.has(stream)) {
      this.tickerStreams.delete(stream);
      if (!entry.subject.closed) entry.subject.complete();
    }

    this.syncWire();
    // ponytail: no idle disconnect — route gaps would thrash the physical socket.
  }

  private releaseKline(stream: string): void {
    const entry = this.klineStreams.get(stream);
    if (!entry) return;
    entry.refCount = Math.max(0, entry.refCount - 1);

    if (entry.refCount === 0) {
      this.klineStreams.delete(stream);
      if (!entry.subject.closed) entry.subject.complete();
    }

    this.syncWire();
  }

  private ensureConnected(): void {
    if (this.desiredStreams().size === 0) return;
    this.ws.connect(BINANCE_WS_STREAM_URL);
  }

  private syncWire(): void {
    if (this.ws.state() !== 'connected') return;

    const desired = this.desiredStreams();
    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const stream of desired) {
      if (!this.wiredStreams.has(stream)) toAdd.push(stream);
    }
    for (const stream of this.wiredStreams) {
      if (!desired.has(stream)) toRemove.push(stream);
    }

    if (toAdd.length) {
      this.sendSubscribe(toAdd);
      for (const s of toAdd) this.wiredStreams.add(s);
    }
    if (toRemove.length) {
      this.sendUnsubscribe(toRemove);
      for (const s of toRemove) this.wiredStreams.delete(s);
    }
  }

  private sendSubscribe(streams: string[]): void {
    if (!streams.length) return;
    const req: BinanceSubscriptionRequest = {
      method: 'SUBSCRIBE',
      params: streams,
      id: this.nextRequestId++,
    };
    this.ws.send(req);
  }

  private sendUnsubscribe(streams: string[]): void {
    if (!streams.length) return;
    const req: BinanceSubscriptionRequest = {
      method: 'UNSUBSCRIBE',
      params: streams,
      id: this.nextRequestId++,
    };
    this.ws.send(req);
  }

  private onMessage(raw: unknown): void {
    if (this.isSubscriptionAck(raw)) {
      if (typeof raw.result === 'string') {
        console.warn('[Binance] subscription error', raw);
      }
      return;
    }

    const wrapped = unwrapCombinedStream(raw);
    if (!wrapped) return;
    const { stream, data } = wrapped;

    if (isBinanceKlineMessage(data)) {
      const candle = wsKlineToCandle(data);
      const key =
        stream?.includes('@kline_')
          ? stream
          : toKlineStream(String(data.s).toLowerCase(), data.k.i);
      const entry = this.klineStreams.get(key);
      if (entry && !entry.subject.closed) {
        entry.subject.next(candle);
      }
      return;
    }

    if (isBinanceMiniTickerMessage(data)) {
      const ticker = toMarketTicker(data);
      const key = stream?.includes('@miniTicker')
        ? stream
        : toMiniTickerStream(ticker.pair);
      const entry = this.tickerStreams.get(key);
      if (entry && !entry.subject.closed) {
        entry.subject.next(ticker);
      }
    }
  }

  private isSubscriptionAck(raw: unknown): raw is BinanceSubscriptionResponse {
    if (!raw || typeof raw !== 'object') return false;
    return 'id' in raw && 'result' in raw && !('e' in raw) && !('stream' in raw);
  }
}
