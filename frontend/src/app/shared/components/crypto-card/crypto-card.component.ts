import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  MouseEventParams,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import { Subscription } from 'rxjs';
import { CryptoCurrency } from '@core/models/models';
import { AuthService } from '@core/services/auth.service';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';
import { NotificationService } from '@core/services/notification.service';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { BinanceRestService } from '@core/binance/binance-rest.service';
import { toBinancePair } from '@core/binance/binance.utils';
import { MarketTicker } from '@core/binance/binance.types';
import { WebSocketService } from '@core/websocket/websocket.service';
import { CryptoChartComponent } from './crypto-chart/crypto-chart.component';

/** Compact / intermediate miniTicker sparkline always shows the last 24h. */
const COMPACT_VISIBLE_SECONDS = 24 * 60 * 60;
/** Align live ticks with REST 5m kline buckets. */
const COMPACT_BUCKET_SECONDS = 5 * 60;

export type CryptoCardState = 'compact' | 'intermediate' | 'detailed';

interface CompactHoverTooltip {
  price: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-crypto-card',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    DecimalPipe,
    RouterLink,
    CryptoChartComponent,
  ],
  providers: [DecimalPipe],
  templateUrl: './crypto-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crypto-card.component.scss'],
  host: {
    '[class.crypto-card-host--detailed]': 'state() === "detailed"',
    '[class.crypto-card-host--intermediate]': 'state() === "intermediate"',
  },
})
export class CryptoCardComponent implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly watchlistSubscriptions = inject(WatchlistSubscriptionsService);
  private readonly notification = inject(NotificationService);
  private readonly marketData = inject(BinanceMarketDataService);
  private readonly binanceRest = inject(BinanceRestService);
  private readonly wsTransport = inject(WebSocketService);

  readonly state = input<CryptoCardState>('compact');
  readonly data = input.required<CryptoCurrency>();
  readonly livePriceChange = output<number>();
  /** Compact → promote into intermediate slot (Markets layout owns the swap). */
  readonly expand = output<CryptoCurrency>();

  exchangeLabel = 'Binance';
  /** Public for Trading `#card.livePrice` (invest / alerts / sell). */
  livePrice = 0;
  change24h?: number;
  absoluteChange24h?: number;
  high24h?: number;
  low24h?: number;
  quoteVolume24h?: number;
  lastUpdated?: number;

  watchlistSaving = false;

  readonly connectionState = this.wsTransport.state;
  readonly isLive = computed(() => this.connectionState() === 'connected');
  readonly isReconnecting = computed(() => this.connectionState() === 'reconnecting');
  readonly isInWatchlist = computed(() => {
    const id = this.data()?.id;
    return !!id && this.watchlistSubscriptions.ids().has(id);
  });
  readonly usesSparkline = computed(() => {
    const mode = this.state();
    return mode === 'compact' || mode === 'intermediate';
  });

  readonly chartEl = viewChild<ElementRef<HTMLDivElement>>('compactChart');
  readonly hoverTooltip = signal<CompactHoverTooltip | null>(null);

  private chart: IChartApi | null = null;
  private lineSeries: ISeriesApi<'Line'> | null = null;
  private lineData: Array<{ time: number; value: number }> = [];
  private tickerSub: Subscription | null = null;
  private watchedPair: string | null = null;
  private resizeObserver?: ResizeObserver;
  private chartReady = false;
  private crosshairHandler: ((param: MouseEventParams) => void) | null = null;
  private readonly windowResizeHandler = () => this.resizeCompact();

  constructor() {
    effect(() => {
      const mode = this.state();
      const data = this.data();
      if (mode === 'compact' || mode === 'intermediate') {
        this.syncMiniTickerWatch(data);
        if (this.chartReady) {
          void this.loadCompactHistory(data);
        }
      } else {
        this.releaseMiniTickerWatch();
        this.destroyCompactChart();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.releaseMiniTickerWatch();
      this.destroyCompactChart();
    });
  }

  get binancePair(): string | null {
    return toBinancePair(this.data()?.symbol, this.data()?.exchange_currency);
  }

  onChartLivePrice(price: number): void {
    this.livePrice = price;
    this.lastUpdated = Date.now();
    this.change24h = undefined;
    this.absoluteChange24h = undefined;
    this.livePriceChange.emit(price);
  }

  onExpandClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const coin = this.data();
    if (coin) this.expand.emit(coin);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.usesSparkline()) return;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    this.initCompactChart();
    window.addEventListener('resize', this.windowResizeHandler);
    await this.loadCompactHistory(this.data());
    this.chartReady = true;
  }

  ngOnDestroy(): void {
    this.releaseMiniTickerWatch();
    this.destroyCompactChart();
    try {
      window.removeEventListener('resize', this.windowResizeHandler);
    } catch {
      /* ignore */
    }
  }

  async saveToWatchlist(): Promise<void> {
    if (!this.data()?.id || this.watchlistSaving) return;
    this.watchlistSaving = true;
    try {
      const user = this.auth.currentUser();
      if (!user?.id) {
        this.notification.warning('Please log in to save to watchlist');
        return;
      }
      const cryptoId = this.data().id;
      if (this.isInWatchlist()) {
        await this.watchlistSubscriptions.deleteByCryptoCurrencyId(cryptoId);
        this.notification.info('Removed from watchlist');
        return;
      }
      await this.watchlistSubscriptions.create(cryptoId);
      this.notification.success('Saved to watchlist');
    } catch (err) {
      console.error('saveToWatchlist failed', err);
      this.notification.error('Failed to save to watchlist');
    } finally {
      this.watchlistSaving = false;
    }
  }

  private syncMiniTickerWatch(coin: CryptoCurrency): void {
    if (!this.usesSparkline()) {
      this.releaseMiniTickerWatch();
      return;
    }
    const pair = toBinancePair(coin?.symbol, coin?.exchange_currency);
    if (pair === this.watchedPair) return;
    this.releaseMiniTickerWatch();
    if (!pair) return;

    this.watchedPair = pair;
    this.tickerSub = this.marketData.watchMiniTicker(pair).subscribe((ticker) => {
      this.applyTicker(ticker);
    });
  }

  private releaseMiniTickerWatch(): void {
    this.tickerSub?.unsubscribe();
    this.tickerSub = null;
    this.watchedPair = null;
  }

  private applyTicker(ticker: MarketTicker): void {
    const price = ticker.price;
    if (!Number.isFinite(price)) return;
    const time = Math.floor((ticker.eventTime || Date.now()) / 1000);
    const bucketTime =
      Math.floor(time / COMPACT_BUCKET_SECONDS) * COMPACT_BUCKET_SECONDS;

    this.ngZone.run(() => {
      this.livePrice = price;
      this.exchangeLabel = 'Binance';
      this.lastUpdated = ticker.eventTime || Date.now();
      this.change24h = Number(ticker.change24hPct.toFixed(2));
      this.absoluteChange24h = Number((price - ticker.open).toFixed(2));
      this.high24h = ticker.high;
      this.low24h = ticker.low;
      this.quoteVolume24h = ticker.quoteVolume;
      this.livePriceChange.emit(price);
    });

    try {
      if (!this.lineSeries) return;
      const cutoff = time - COMPACT_VISIBLE_SECONDS;
      const prevFirst = this.lineData[0]?.time;
      const prevLen = this.lineData.length;
      let data = this.lineData.filter((p) => p.time >= cutoff);
      const prunedFront = data.length < prevLen || data[0]?.time !== prevFirst;
      const last = data[data.length - 1];

      if (!last) {
        data = [{ time: bucketTime, value: price }];
        this.lineData = data;
        this.lineSeries.setData([
          { time: bucketTime as UTCTimestamp, value: price },
        ]);
      } else if (last.time === bucketTime) {
        last.value = price;
        this.lineData = data;
        if (prunedFront) {
          this.lineSeries.setData(
            data.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
          );
        } else {
          this.lineSeries.update({
            time: bucketTime as UTCTimestamp,
            value: price,
          });
        }
      } else if (bucketTime > last.time) {
        data = [...data, { time: bucketTime, value: price }];
        this.lineData = data;
        if (prunedFront) {
          this.lineSeries.setData(
            data.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
          );
        } else {
          this.lineSeries.update({
            time: bucketTime as UTCTimestamp,
            value: price,
          });
        }
      } else {
        this.lineData = data;
        if (prunedFront) {
          this.lineSeries.setData(
            data.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
          );
        }
      }

      this.applyCompact24hVisibleRange(time);
    } catch {
      /* ignore */
    }
  }

  private initCompactChart(): void {
    const el = this.chartEl()?.nativeElement;
    if (!el) return;

    this.destroyCompactChart();

    const rect = el.getBoundingClientRect();
    const width = Math.max(10, Math.floor(rect.width || el.clientWidth || 0));
    const height = Math.max(10, Math.floor(rect.height || 80));

    this.chart = createChart(el, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, borderVisible: false },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          visible: true,
          labelVisible: false,
          width: 1,
          color: 'rgba(41, 121, 255, 0.45)',
          style: LineStyle.Dashed,
        },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    this.lineSeries = this.chart.addSeries(LineSeries, {
      color: '#2979ff',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    this.crosshairHandler = (param) => this.onCompactCrosshair(param);
    this.chart.subscribeCrosshairMove(this.crosshairHandler);

    this.resizeObserver = new ResizeObserver(() => this.resizeCompact());
    this.resizeObserver.observe(el);
  }

  private onCompactCrosshair(param: MouseEventParams): void {
    if (!this.lineSeries || !param.point || param.time === undefined) {
      this.ngZone.run(() => this.hoverTooltip.set(null));
      return;
    }

    const point = param.seriesData.get(this.lineSeries) as
      | { value?: number; close?: number }
      | undefined;
    const price =
      typeof point?.value === 'number'
        ? point.value
        : typeof point?.close === 'number'
          ? point.close
          : undefined;

    if (price === undefined || !Number.isFinite(price)) {
      this.ngZone.run(() => this.hoverTooltip.set(null));
      return;
    }

    const el = this.chartEl()?.nativeElement;
    const width = el?.clientWidth ?? 0;
    const height = el?.clientHeight ?? 0;
    const x = Math.min(Math.max(param.point.x, 8), Math.max(width - 8, 8));
    const y = Math.min(Math.max(param.point.y, 8), Math.max(height - 8, 8));

    this.ngZone.run(() => {
      this.hoverTooltip.set({ price, x, y });
    });
  }

  private resizeCompact(): void {
    const el = this.chartEl()?.nativeElement;
    if (!el || !this.chart) return;
    const r = el.getBoundingClientRect();
    this.chart.applyOptions({
      width: Math.max(10, Math.floor(r.width)),
      height: Math.max(10, Math.floor(r.height)),
    });
    const last = this.lineData[this.lineData.length - 1]?.time;
    if (last) this.applyCompact24hVisibleRange(last);
  }

  private destroyCompactChart(): void {
    try {
      this.resizeObserver?.disconnect();
    } catch {
      /* ignore */
    }
    this.resizeObserver = undefined;
    try {
      if (this.chart && this.crosshairHandler) {
        this.chart.unsubscribeCrosshairMove(this.crosshairHandler);
      }
    } catch {
      /* ignore */
    }
    this.crosshairHandler = null;
    this.hoverTooltip.set(null);
    try {
      this.chart?.remove();
    } catch {
      /* ignore */
    }
    this.chart = null;
    this.lineSeries = null;
    this.lineData = [];
    this.chartReady = false;
  }

  private async loadCompactHistory(coin: CryptoCurrency): Promise<void> {
    const pair = toBinancePair(coin?.symbol, coin?.exchange_currency);
    if (!pair || !this.lineSeries) return;

    const history = await this.binanceRest.getKlines(pair, '5m', 288);
    const nowSec = Math.floor(Date.now() / 1000);
    const cutoff = nowSec - COMPACT_VISIBLE_SECONDS;
    const points = history
      .map((c) => ({ time: c.time, value: c.close }))
      .filter((p) => p.time >= cutoff);
    this.lineData = points;
    try {
      this.lineSeries.setData(
        points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
      );
      this.applyCompact24hVisibleRange(nowSec);
    } catch {
      /* ignore */
    }

    const last = points[points.length - 1];
    if (last) {
      this.ngZone.run(() => {
        this.livePrice = last.value;
        this.lastUpdated = Date.now();
        this.livePriceChange.emit(this.livePrice);
      });
    }
  }

  private applyCompact24hVisibleRange(toSec: number): void {
    if (!this.chart) return;
    try {
      this.chart.timeScale().setVisibleRange({
        from: (toSec - COMPACT_VISIBLE_SECONDS) as UTCTimestamp,
        to: toSec as UTCTimestamp,
      });
    } catch {
      /* ignore when series empty */
    }
  }
}
