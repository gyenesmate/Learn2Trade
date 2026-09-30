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
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  ColorType,
  IChartApi,
  ISeriesApi,
  LineSeries,
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

/** Compact miniTicker sparkline always shows the last 24h. */
const COMPACT_VISIBLE_SECONDS = 24 * 60 * 60;

@Component({
  selector: 'app-crypto-card',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    DecimalPipe,
    CryptoChartComponent,
  ],
  providers: [DecimalPipe],
  templateUrl: './crypto-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crypto-card.component.scss'],
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

  readonly state = input<'detailed' | 'compact'>('compact');
  readonly data = input.required<CryptoCurrency>();
  readonly watchlistCryptoIds = input<Set<string>>();
  readonly livePriceChange = output<number>();

  exchangeLabel = 'Binance';
  /** Public for Trading `#card.livePrice` (invest / alerts / sell). */
  livePrice = 0;
  change24h?: number;
  lastUpdated?: number;

  watchlistSaving = false;
  isInWatchlist = false;

  readonly connectionState = this.wsTransport.state;
  readonly isLive = computed(() => this.connectionState() === 'connected');
  readonly isReconnecting = computed(() => this.connectionState() === 'reconnecting');

  readonly chartEl = viewChild<ElementRef<HTMLDivElement>>('compactChart');

  private chart: IChartApi | null = null;
  private lineSeries: ISeriesApi<'Line'> | null = null;
  private lineData: Array<{ time: number; value: number }> = [];
  private tickerSub: Subscription | null = null;
  private watchedPair: string | null = null;
  private resizeObserver?: ResizeObserver;
  private chartReady = false;
  private readonly windowResizeHandler = () => this.resizeCompact();

  constructor() {
    effect(() => {
      const watchlistCryptoIds = this.watchlistCryptoIds();
      const data = this.data();
      const user = this.auth.currentUser();

      if (watchlistCryptoIds) {
        this.isInWatchlist = !!data?.id && watchlistCryptoIds.has(data.id);
        return;
      }
      if (!user?.id || !data?.id) {
        this.isInWatchlist = false;
        return;
      }
      void this.refreshWatchlistMembership(data.id);
    });

    effect(() => {
      const mode = this.state();
      const data = this.data();
      if (mode === 'compact') {
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
    this.livePriceChange.emit(price);
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.state() !== 'compact') return;
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
      if (this.isInWatchlist) {
        await this.watchlistSubscriptions.deleteByCryptoCurrencyId(this.data().id);
        this.isInWatchlist = false;
        this.notification.info('Removed from watchlist');
        return;
      }
      await this.watchlistSubscriptions.create(this.data().id);
      this.isInWatchlist = true;
      this.notification.success('Saved to watchlist');
    } catch (err) {
      console.error('saveToWatchlist failed', err);
      this.notification.error('Failed to save to watchlist');
    } finally {
      this.watchlistSaving = false;
    }
  }

  private async refreshWatchlistMembership(cryptoId: string): Promise<void> {
    try {
      const subs = await this.watchlistSubscriptions.getMe();
      this.isInWatchlist = !!subs.find((s) => s.crypto_currency_id === cryptoId);
    } catch {
      this.isInWatchlist = false;
    }
  }

  private syncMiniTickerWatch(coin: CryptoCurrency): void {
    if (this.state() !== 'compact') {
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

    this.ngZone.run(() => {
      this.livePrice = price;
      this.exchangeLabel = 'Binance';
      this.lastUpdated = ticker.eventTime || Date.now();
      this.change24h = Number(ticker.change24hPct.toFixed(2));
      this.livePriceChange.emit(price);
    });

    try {
      if (!this.lineSeries) return;
      const point = { time, value: price };
      const cutoff = time - COMPACT_VISIBLE_SECONDS;
      this.lineData = this.lineData.filter((p) => p.time >= cutoff);

      if (this.lineData.length === 0) {
        this.lineData.push(point);
        this.lineSeries.setData([{ time: time as UTCTimestamp, value: price }]);
      } else {
        const last = this.lineData[this.lineData.length - 1];
        if (last.time === time) {
          last.value = price;
          this.lineSeries.update({ time: time as UTCTimestamp, value: price });
        } else if (time > last.time) {
          this.lineData.push(point);
          this.lineSeries.update({ time: time as UTCTimestamp, value: price });
        }
        // Re-seed if we pruned from the front so series stays in sync.
        if (this.lineData[0]?.time !== cutoff && this.lineData.length > 1) {
          this.lineSeries.setData(
            this.lineData.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
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
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    this.lineSeries = this.chart.addSeries(LineSeries, {
      color: '#2979ff',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    this.resizeObserver = new ResizeObserver(() => this.resizeCompact());
    this.resizeObserver.observe(el);
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

    // Seed last ~24h of closes (5m × 288), then lock visible range to 24h.
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
