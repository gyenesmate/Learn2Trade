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
  untracked,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineSeries,
  MouseEventParams,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import {
  Subject,
  Subscription,
  switchMap,
  tap,
  from,
  of,
  catchError,
} from 'rxjs';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { BinanceRestService } from '@core/binance/binance-rest.service';
import { ChartCandle } from '@core/binance/binance.types';
import { WebSocketService } from '@core/websocket/websocket.service';
import {
  CHART_INDICATORS,
  DEFAULT_KLINE_INTERVAL,
  KLINE_HISTORY_LIMIT,
  KLINE_INTERVALS,
} from './crypto-chart.const';
import {
  ChartIndicatorId,
  IndicatorEnabledMap,
  KlineInterval,
  OhlcDisplay,
} from './crypto-chart.types';
import {
  computeEma20,
  computeEma50,
  computeRsi,
  computeSma,
  formatCompactVolume,
  mergeLiveCandle,
  rangeChangePct,
  toVolumePoints,
} from './crypto-chart.utils';

function defaultIndicators(): IndicatorEnabledMap {
  return Object.fromEntries(
    CHART_INDICATORS.map((i) => [i.id, i.defaultEnabled])
  ) as IndicatorEnabledMap;
}

@Component({
  selector: 'app-crypto-chart',
  imports: [
    DecimalPipe,
    MatButtonToggleModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './crypto-chart.component.html',
  styleUrl: './crypto-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CryptoChartComponent implements AfterViewInit, OnDestroy {
  private readonly marketData = inject(BinanceMarketDataService);
  private readonly binanceRest = inject(BinanceRestService);
  private readonly wsTransport = inject(WebSocketService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  /** Lowercase Binance pair, e.g. `btcusdt`. */
  readonly pair = input.required<string>();
  readonly livePriceChange = output<number>();

  readonly intervals = KLINE_INTERVALS;
  readonly indicatorDefs = CHART_INDICATORS;
  readonly formatVolume = formatCompactVolume;

  readonly interval = signal<KlineInterval>(DEFAULT_KLINE_INTERVAL);
  readonly indicators = signal<IndicatorEnabledMap>(defaultIndicators());
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly livePrice = signal(0);
  readonly rangeChange = signal<number | undefined>(undefined);
  readonly ohlc = signal<OhlcDisplay | null>(null);
  readonly connectionState = this.wsTransport.state;

  private readonly chartHost = viewChild<ElementRef<HTMLDivElement>>('chartHost');

  private chart: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private smaSeries: ISeriesApi<'Line'> | null = null;
  private ema20Series: ISeriesApi<'Line'> | null = null;
  private ema50Series: ISeriesApi<'Line'> | null = null;
  private rsiSeries: ISeriesApi<'Line'> | null = null;
  private volumePaneIndex: number | null = null;
  private rsiPaneIndex: number | null = null;
  private resizeObserver?: ResizeObserver;
  private candles: ChartCandle[] = [];
  private pendingLive: ChartCandle | null = null;
  private klineSub: Subscription | null = null;
  private historyReady = false;
  private crosshairHandler: ((param: MouseEventParams) => void) | null = null;
  private chartReady = false;

  private readonly intervalReload$ = new Subject<void>();

  readonly isLive = computed(() => this.connectionState() === 'connected');
  readonly isReconnecting = computed(() => this.connectionState() === 'reconnecting');

  constructor() {
    effect(() => {
      const p = this.pair();
      const iv = this.interval();
      void p;
      void iv;
      untracked(() => this.intervalReload$.next());
    });

    effect(() => {
      const enabled = this.indicators();
      if (!this.chartReady) return;
      untracked(() => this.applyIndicatorVisibility(enabled));
      untracked(() => this.refreshIndicatorData());
    });

    this.intervalReload$
      .pipe(
        switchMap(() => {
          const pair = this.pair();
          const iv = this.interval();
          if (!pair) return of([] as ChartCandle[]);
          this.loading.set(true);
          this.loadError.set(false);
          this.historyReady = false;
          this.pendingLive = null;
          this.releaseKline();
          return from(this.binanceRest.getKlines(pair, iv, KLINE_HISTORY_LIMIT)).pipe(
            tap((history) => {
              this.applyHistory(history);
              this.startKlineWatch(pair, iv);
            }),
            catchError(() => {
              this.loadError.set(true);
              this.loading.set(false);
              return of([] as ChartCandle[]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    void this.initChart().then(() => {
      this.chartReady = true;
      if (this.candles.length) {
        this.pushAllSeriesData();
      }
      this.applyIndicatorVisibility(this.indicators());
    });
  }

  ngOnDestroy(): void {
    this.releaseKline();
    this.teardownChart();
  }

  setInterval(value: KlineInterval | null): void {
    if (!value || this.interval() === value) return;
    this.interval.set(value);
  }

  toggleIndicator(id: ChartIndicatorId, checked: boolean): void {
    this.indicators.update((m) => ({ ...m, [id]: checked }));
  }

  retryLoad(): void {
    this.intervalReload$.next();
  }

  private async initChart(): Promise<void> {
    const host = this.chartHost()?.nativeElement;
    if (!host) return;

    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const surface = this.cssVar('--color-surface', '#111827');
    const text = this.cssVar('--color-text', '#e5e7eb');
    const border = this.cssVar('--color-border', '#374151');
    const up = this.cssVar('--color-crypto-up', '#198754');
    const down = this.cssVar('--color-crypto-down', '#dc3545');

    const rect = host.getBoundingClientRect();
    this.chart = createChart(host, {
      width: Math.max(10, Math.floor(rect.width)),
      height: Math.max(240, Math.floor(rect.height || 400)),
      layout: {
        background: { type: ColorType.Solid, color: surface },
        textColor: text,
        panes: { enableResize: true },
      },
      grid: {
        vertLines: { color: border },
        horzLines: { color: border },
      },
      rightPriceScale: { visible: true },
      timeScale: { rightOffset: 8, borderVisible: false },
    });

    this.candleSeries = this.chart.addSeries(
      CandlestickSeries,
      {
        upColor: up,
        downColor: down,
        borderUpColor: up,
        borderDownColor: down,
        wickUpColor: up,
        wickDownColor: down,
      },
      0
    );

    this.smaSeries = this.chart.addSeries(
      LineSeries,
      { color: '#2979ff', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
      0
    );
    this.ema20Series = this.chart.addSeries(
      LineSeries,
      { color: '#ff9800', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
      0
    );
    this.ema50Series = this.chart.addSeries(
      LineSeries,
      { color: '#ab47bc', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
      0
    );

    const volumePane = this.chart.addPane();
    this.volumePaneIndex = this.chart.panes().indexOf(volumePane);
    volumePane.setStretchFactor(0.22);
    this.volumeSeries = volumePane.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const rsiPane = this.chart.addPane();
    this.rsiPaneIndex = this.chart.panes().indexOf(rsiPane);
    rsiPane.setStretchFactor(0.2);
    this.rsiSeries = rsiPane.addSeries(LineSeries, {
      color: '#ffa726',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    this.rsiSeries.createPriceLine({
      price: 70,
      color: border,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '70',
    });
    this.rsiSeries.createPriceLine({
      price: 30,
      color: border,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '30',
    });

    this.crosshairHandler = (param) => this.onCrosshair(param);
    this.chart.subscribeCrosshairMove(this.crosshairHandler);

    this.resizeObserver = new ResizeObserver(() => {
      const el = this.chartHost()?.nativeElement;
      if (!el || !this.chart) return;
      const r = el.getBoundingClientRect();
      this.chart.applyOptions({
        width: Math.max(10, Math.floor(r.width)),
        height: Math.max(240, Math.floor(r.height)),
      });
    });
    this.resizeObserver.observe(host);
  }

  private teardownChart(): void {
    try {
      if (this.chart && this.crosshairHandler) {
        this.chart.unsubscribeCrosshairMove(this.crosshairHandler);
      }
    } catch {
      /* ignore */
    }
    this.crosshairHandler = null;
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
    this.candleSeries = null;
    this.volumeSeries = null;
    this.smaSeries = null;
    this.ema20Series = null;
    this.ema50Series = null;
    this.rsiSeries = null;
    this.chartReady = false;
  }

  private applyHistory(history: ChartCandle[]): void {
    const merged = mergeLiveCandle(history, this.pendingLive);
    this.candles = merged;
    this.historyReady = true;
    this.loading.set(false);
    this.loadError.set(false);

    const last = merged[merged.length - 1];
    if (last) {
      this.setLivePrice(last.close);
      this.setOhlcFromCandle(last);
    }
    this.rangeChange.set(rangeChangePct(merged));
    this.pushAllSeriesData();
  }

  private startKlineWatch(pair: string, interval: string): void {
    this.releaseKline();
    this.klineSub = this.marketData.watchKline(pair, interval).subscribe((candle) => {
      this.ngZone.run(() => this.applyLiveCandle(candle));
    });
  }

  private releaseKline(): void {
    this.klineSub?.unsubscribe();
    this.klineSub = null;
  }

  private applyLiveCandle(candle: ChartCandle): void {
    if (!this.historyReady) {
      this.pendingLive = candle;
      this.setLivePrice(candle.close);
      return;
    }

    const last = this.candles[this.candles.length - 1];
    if (last && last.time === candle.time) {
      this.candles[this.candles.length - 1] = candle;
    } else if (!last || candle.time > last.time) {
      this.candles = [...this.candles, candle];
    } else {
      return;
    }

    this.setLivePrice(candle.close);
    this.setOhlcFromCandle(candle);
    this.rangeChange.set(rangeChangePct(this.candles));
    this.updateLiveSeries(candle);
  }

  private setLivePrice(price: number): void {
    if (!Number.isFinite(price)) return;
    this.livePrice.set(price);
    this.livePriceChange.emit(price);
  }

  private setOhlcFromCandle(c: ChartCandle): void {
    this.ohlc.set({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      time: c.time,
    });
  }

  private pushAllSeriesData(): void {
    if (!this.candleSeries || !this.candles.length) return;
    const ohlc = this.candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    this.candleSeries.setData(ohlc);
    this.refreshIndicatorData();
    try {
      this.chart?.timeScale().fitContent();
    } catch {
      /* ignore */
    }
  }

  private updateLiveSeries(candle: ChartCandle): void {
    const t = candle.time as UTCTimestamp;
    try {
      this.candleSeries?.update({
        time: t,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });
    } catch {
      /* ignore */
    }

    const enabled = this.indicators();
    if (enabled.volume && this.volumeSeries) {
      const up = this.cssVar('--color-crypto-up', '#198754');
      const down = this.cssVar('--color-crypto-down', '#dc3545');
      try {
        this.volumeSeries.update({
          time: t,
          value: candle.volume,
          color: candle.close >= candle.open ? `${up}99` : `${down}99`,
        });
      } catch {
        /* ignore */
      }
    }

    // Overlays/RSI: cheap full refresh on live tick (correctness over micro-opt).
    this.refreshIndicatorData();
  }

  private refreshIndicatorData(): void {
    if (!this.candles.length) return;
    const enabled = this.indicators();
    const up = this.cssVar('--color-crypto-up', '#198754');
    const down = this.cssVar('--color-crypto-down', '#dc3545');

    if (this.volumeSeries) {
      if (enabled.volume) {
        const pts = toVolumePoints(this.candles).map((v) => ({
          time: v.time as UTCTimestamp,
          value: v.value,
          color: v.up ? `${up}99` : `${down}99`,
        }));
        this.volumeSeries.setData(pts);
      } else {
        this.volumeSeries.setData([]);
      }
    }

    if (this.smaSeries) {
      this.smaSeries.setData(
        enabled.sma20
          ? computeSma(this.candles).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          : []
      );
    }
    if (this.ema20Series) {
      this.ema20Series.setData(
        enabled.ema20
          ? computeEma20(this.candles).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          : []
      );
    }
    if (this.ema50Series) {
      this.ema50Series.setData(
        enabled.ema50
          ? computeEma50(this.candles).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          : []
      );
    }
    if (this.rsiSeries) {
      this.rsiSeries.setData(
        enabled.rsi14
          ? computeRsi(this.candles).map((p) => ({
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          : []
      );
    }
  }

  private applyIndicatorVisibility(enabled: IndicatorEnabledMap): void {
    try {
      this.smaSeries?.applyOptions({ visible: enabled.sma20 });
      this.ema20Series?.applyOptions({ visible: enabled.ema20 });
      this.ema50Series?.applyOptions({ visible: enabled.ema50 });
      this.volumeSeries?.applyOptions({ visible: enabled.volume });
      this.rsiSeries?.applyOptions({ visible: enabled.rsi14 });
    } catch {
      /* ignore */
    }

    // Hide RSI pane height when off by stretch factor.
    try {
      const panes = this.chart?.panes() ?? [];
      if (this.volumePaneIndex != null && panes[this.volumePaneIndex]) {
        panes[this.volumePaneIndex].setStretchFactor(enabled.volume ? 0.22 : 0.01);
      }
      if (this.rsiPaneIndex != null && panes[this.rsiPaneIndex]) {
        panes[this.rsiPaneIndex].setStretchFactor(enabled.rsi14 ? 0.2 : 0.01);
      }
    } catch {
      /* ignore */
    }
  }

  private onCrosshair(param: MouseEventParams): void {
    if (!this.candleSeries) return;

    if (!param.time) {
      const last = this.candles[this.candles.length - 1];
      if (last) this.setOhlcFromCandle(last);
      return;
    }

    const data = param.seriesData.get(this.candleSeries) as
      | { open: number; high: number; low: number; close: number }
      | undefined;

    if (data && typeof data.open === 'number') {
      const t =
        typeof param.time === 'number'
          ? param.time
          : this.candles.find((c) => c.time === (param.time as number))?.time;
      const vol =
        this.candles.find((c) => c.time === t)?.volume ??
        this.ohlc()?.volume ??
        0;
      const display: OhlcDisplay = {
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: vol,
        time: typeof t === 'number' ? t : undefined,
      };
      this.ngZone.run(() => {
        this.ohlc.set(display);
      });
      return;
    }

    const last = this.candles[this.candles.length - 1];
    if (last) {
      this.ngZone.run(() => this.setOhlcFromCandle(last));
    }
  }

  private cssVar(name: string, fallback: string): string {
    try {
      const host = this.chartHost()?.nativeElement;
      const fromHost = host ? getComputedStyle(host).getPropertyValue(name)?.trim() : '';
      if (fromHost) return fromHost;
      const fromBody = getComputedStyle(document.body).getPropertyValue(name)?.trim();
      if (fromBody) return fromBody;
      return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || fallback;
    } catch {
      return fallback;
    }
  }
}
