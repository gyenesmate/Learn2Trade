
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges, ViewChild, NgZone, DestroyRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CryptoCurrency } from '../../../const/models';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { WatchlistSubscriptionsService } from '../../../services/watchlist-subscriptions.service';
import { NotificationService } from '../../../services/notification.service';

// Note: this implementation uses `lightweight-charts` at runtime. Install with:
// npm install lightweight-charts
import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts';
import { ColorType } from 'lightweight-charts';

@Component({
  selector: 'app-crypto-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  providers: [DecimalPipe],
  templateUrl: './crypto-card.component.html',
  styleUrls: ['./crypto-card.component.scss']
})
export class CryptoCardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  /**
   * State of the card: 'detailed' (with chart) or 'compact' (basic info)
   */
  @Input() state: 'detailed' | 'compact' = 'compact';
  /**
   * Crypto data to display
   */
  @Input() data!: CryptoCurrency;
  /**
   * Ids of cryptos the current user is watching. When provided by the parent,
   * avoids each card needing to independently fetch the watchlist.
   */
  @Input() watchlistCryptoIds?: Set<string>;

  // Live fields (derived from Binance klines + websocket)
  exchangeLabel = 'Binance';
  livePrice = 0;
  change24h?: number;
  lastUpdated?: number;

  @ViewChild('chart', { static: false }) chartEl?: ElementRef<HTMLDivElement>;

  private chart: any = null;
  private lineSeries: any = null;
  private candleSeries: any = null;
  currentType: 'line' | 'candlestick' = 'line';
  selectedDays = 7;
  isDrawing = false;
  private annotations: any[] = [];
  private overlayCanvas!: HTMLCanvasElement;
  private liveIntervalId: any = null;
  private ws?: WebSocket | null = null;
  private wsPair: string | null = null;
  private wsInterval: string | null = null;
  private resizeObserver?: ResizeObserver;
  private candleDataCache: Array<{time:number, open:number, high:number, low:number, close:number}> = [];
  private lineDataCache: Array<{time:number, value:number}> = [];
  private readonly windowResizeHandler = () => this.resizeOverlay();

  private getCssVar(name: string, fallback: string): string {
    try {
      // Theme variables are applied on body (e.g. body.theme-dark), not just :root
      const fromHost = this.chartEl?.nativeElement ? getComputedStyle(this.chartEl.nativeElement).getPropertyValue(name)?.trim() : '';
      if (fromHost) return fromHost;

      const fromBody = getComputedStyle(document.body).getPropertyValue(name)?.trim();
      if (fromBody) return fromBody;

      const fromRoot = getComputedStyle(document.documentElement).getPropertyValue(name)?.trim();
      return fromRoot || fallback;
    } catch {
      return fallback;
    }
  }

  // Tooltip state (always show focused candle info)
  @ViewChild('chartTooltip', { static: false }) tooltipEl?: ElementRef<HTMLDivElement>;
  tooltipVisible = false;
  tooltipHtml = '';
  tooltipX = 0;
  tooltipY = 0;

  watchlistSaving = false;
  isInWatchlist = false;
  private userSub: any = null;

  constructor(
    private renderer: Renderer2,
    private ngZone: NgZone,
    private decimalPipe: DecimalPipe,
    private destroyRef: DestroyRef,
    private auth: AuthService,
    private watchlistSubscriptions: WatchlistSubscriptionsService,
    private notification: NotificationService
  ) {
    // Ensure websockets / intervals are cleaned up when Angular destroys this view
    try {
      this.destroyRef.onDestroy(() => {
        try { this.stopBinance(); } catch {}
        try { this.stopLiveUpdates(); } catch {}
      });
    } catch {
      console.warn('CryptoCardComponent: DestroyRef not available, live updates may not be cleaned up properly on destroy.');
    }
  }

  async saveToWatchlist(): Promise<void> {
    if (!this.data?.id) return;
    if (this.watchlistSaving) return;
    this.watchlistSaving = true;

    try {
      const user = await firstValueFrom(this.auth.currentUserData$);
      if (!user?.id) {
        this.notification.warning('Please log in to save to watchlist');
        return;
      }

      if (this.isInWatchlist) {
        await this.watchlistSubscriptions.deleteByCryptoCurrencyId(this.data.id);
        this.isInWatchlist = false;
        this.notification.info('Removed from watchlist');
        return;
      }

      await this.watchlistSubscriptions.create(this.data.id);
      this.isInWatchlist = true;
      this.notification.success('Saved to watchlist');
    } catch (err) {
      console.error('saveToWatchlist failed', err);
      this.notification.error('Failed to save to watchlist');
    } finally {
      this.watchlistSaving = false;
    }
  }

  ngOnInit(): void {
    // Set defaults early (ngAfterViewInit is too late and can trigger NG0100)
    this.currentType = this.state === 'detailed' ? 'candlestick' : 'line';
    this.selectedDays = this.state === 'compact' ? 1 : 7;
    if (this.state === 'compact') this.isDrawing = false;

        // watch for current user changes to determine if this crypto is in their watchlist
    try {
      this.userSub = this.auth.currentUserData$.subscribe(async user => {
        if (this.watchlistCryptoIds) {
          this.isInWatchlist = !!this.data?.id && this.watchlistCryptoIds.has(this.data.id);
          return;
        }
        if (!user?.id || !this.data?.id) {
          this.isInWatchlist = false;
          return;
        }
        try {
          const subs = await this.watchlistSubscriptions.getMe();
          this.isInWatchlist = !!subs.find(s => s.crypto_currency_id === this.data?.id);
        } catch {
          this.isInWatchlist = false;
        }
      });
    } catch {}
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If inputs change after init, reconnect and rerender.
    const stateChanged = !!changes['state'];
    const dataChanged = !!changes['data'];

    if (changes['watchlistCryptoIds'] && this.watchlistCryptoIds) {
      this.isInWatchlist = !!this.data?.id && this.watchlistCryptoIds.has(this.data.id);
    }

    if (stateChanged) {
      this.currentType = this.state === 'detailed' ? 'candlestick' : 'line';
      this.selectedDays = this.state === 'compact' ? 1 : this.selectedDays;
      if (this.state === 'compact') {
        this.isDrawing = false;
        this.tooltipVisible = false;
      }
    }

    if ((stateChanged || dataChanged) && this.chartEl) {
      try { this.stopBinance(); } catch {}
      try { this.initChart(); } catch {}
      try { this.ensureOverlayForState(); } catch {}
      // fire and forget
      void this.loadAndRender(this.selectedDays);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.chartEl) return;
    // Wait a tick so layout has settled (prevents 0x0 container -> no canvases rendered)
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    this.initChart();

    this.ensureOverlayForState();

    window.addEventListener('resize', this.windowResizeHandler);

    // tooltip: only for detailed candlestick view
    if (this.state === 'detailed' && this.chart && typeof this.chart.subscribeCrosshairMove === 'function') {
      this.chart.subscribeCrosshairMove((param: any) => {
        try {
          const priceEl = this.chartEl?.nativeElement.querySelector('.price-detail');
          // determine OHLC to show: prefer crosshair seriesPrices, fallback to data cache (latest)
          let ohlc: any = null;
          if (param && param.time) {
            const seriesPrices = param.seriesPrices;
            const candidate = seriesPrices?.get(this.candleSeries);
            if (candidate && typeof candidate === 'object') {
              ohlc = candidate;
            } else if (this.candleDataCache && this.candleDataCache.length) {
              // try to find matching time in cache
              const t = typeof param.time === 'number' ? param.time : (param.time as any);
              const found = this.candleDataCache.find((c: any) => c.time === t);
              if (found) ohlc = found;
            }
          }
          // if nothing from crosshair, show most recent candle if available
          if (!ohlc && this.candleDataCache && this.candleDataCache.length) {
            ohlc = this.candleDataCache[this.candleDataCache.length - 1];
          }

          // update price detail small inline element
          if (priceEl) {
            if (ohlc) {
              (priceEl as HTMLElement).textContent = `O:${ohlc.open} H:${ohlc.high} L:${ohlc.low} C:${ohlc.close}`;
            } else {
              (priceEl as HTMLElement).textContent = '';
            }
          }

          // update tooltip DOM with formatted values
          if (ohlc) {
            const fmt = (v: number) => this.decimalPipe.transform(v, '1.2-6') ?? String(v);
            // color close value based on up/down
            const openV = Number(ohlc.open);
            const closeV = Number(ohlc.close);
            const closeClass = closeV >= openV ? 'tt-val green' : 'tt-val red';
            const html = `<div class="tt-row"><strong>O:</strong> <span class="tt-val gray">${fmt(openV)}</span></div>` +
                         `<div class="tt-row"><strong>H:</strong> <span class="tt-val green">${fmt(Number(ohlc.high))}</span></div>` +
                         `<div class="tt-row"><strong>L:</strong> <span class="tt-val red">${fmt(Number(ohlc.low))}</span></div>` +
                         `<div class="tt-row"><strong>C:</strong> <span class="${closeClass}">${fmt(closeV)}</span></div>`;
            // position tooltip at fixed top-left inside the chart
            this.ngZone.run(() => {
              this.tooltipHtml = html;
              this.tooltipVisible = true;
              this.tooltipX = 8;
              this.tooltipY = 8;
            });
          } else {
            this.ngZone.run(() => { this.tooltipVisible = false; });
          }
        } catch (err) {
          try { this.ngZone.run(() => { this.tooltipVisible = false; }); } catch {}
        }
      });
    }

    await this.loadAndRender(this.selectedDays);
  }

  ngOnDestroy(): void {
    try { this.userSub?.unsubscribe?.(); } catch {}
    try { this.chart?.remove(); } catch {}
    this.stopLiveUpdates();
    this.stopBinance();
    try { this.resizeObserver?.disconnect(); } catch {}
    try { window.removeEventListener('resize', this.windowResizeHandler); } catch {}
  }

  private initChart(): void {
    if (!this.chartEl) return;
    const host = this.chartEl.nativeElement;

    const rect = host.getBoundingClientRect();
    const width = Math.max(10, Math.floor(rect.width || host.clientWidth || 0));
    const heightFromCss = Math.floor(rect.height || host.clientHeight || 0);
    const height = Math.max(10, heightFromCss || (this.state === 'compact' ? 80 : 140));

    try {
      this.chart?.remove?.();
    } catch {}

    const isCompact = this.state === 'compact';

    // Theme colors from existing design tokens (no new hard-coded palette)
    const surface = this.getCssVar('--color-surface', '#111827');
    const text = this.getCssVar('--color-text', '#e5e7eb');
    const border = this.getCssVar('--color-border', '#374151');

    // Extra safety: ensure the chart container itself isn't white
    try {
      host.style.backgroundColor = isCompact ? 'transparent' : surface;
    } catch {}

    this.chart = createChart(host, {
      width,
      height,
      layout: {
        background: isCompact
          ? { type: ColorType.Solid, color: 'transparent' }
          : { type: ColorType.Solid, color: surface },
        textColor: isCompact ? 'transparent' : text
      },
      grid: isCompact
        ? { vertLines: { visible: false }, horzLines: { visible: false } }
        : {
            vertLines: { color: border },
            horzLines: { color: border }
          },
      rightPriceScale: { visible: !isCompact },
      leftPriceScale: { visible: false },
      timeScale: {
        rightOffset: isCompact ? 0 : 10,
        borderVisible: false,
        visible: !isCompact
      },
      crosshair: isCompact ? { vertLine: { visible: false }, horzLine: { visible: false } } : undefined,
      handleScroll: isCompact ? false : true,
      handleScale: isCompact ? false : true
    });

    // create series only if chart supports them
    this.lineSeries = null;
    this.candleSeries = null;
    // lightweight-charts v5 uses `addSeries(SeriesDefinition, options)`
    if (this.chart) {
      try {
        const isCompact = this.state === 'compact';
        this.lineSeries = this.chart.addSeries(LineSeries, {
          color: '#2979ff',
          lineWidth: 2,
          priceLineVisible: !isCompact,
          lastValueVisible: !isCompact
        });
      } catch {}
      try {
        this.candleSeries = this.chart.addSeries(CandlestickSeries, {});
      } catch {}
    }

    this.refreshSeriesVisibility();

    // Observe resizes to keep chart canvases in sync
    try {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.chartEl) return;
        const r = this.chartEl.nativeElement.getBoundingClientRect();
        const w = Math.max(10, Math.floor(r.width));
        const h = Math.max(10, Math.floor(r.height));
        try { this.chart?.applyOptions?.({ width: w, height: h }); } catch {}
        this.resizeOverlay();
      });
      this.resizeObserver.observe(host);
    } catch {
      // ResizeObserver not available
    }
  }

  private ensureOverlayForState(): void {
    if (!this.chartEl) return;
    if (this.state !== 'detailed') {
      // compact view: no drawing overlay
      try {
        if (this.overlayCanvas && this.overlayCanvas.parentElement) {
          this.overlayCanvas.parentElement.removeChild(this.overlayCanvas);
        }
      } catch {}
      // keep overlayCanvas as-is, but don't rely on it
      return;
    }

    // detailed view: add overlay for optional drawing
    if (!this.overlayCanvas || !this.overlayCanvas.parentElement) {
      this.overlayCanvas = this.renderer.createElement('canvas');
      this.overlayCanvas.style.position = 'absolute';
      this.overlayCanvas.style.top = '0';
      this.overlayCanvas.style.left = '0';
      this.overlayCanvas.style.width = '100%';
      this.overlayCanvas.style.height = '100%';
      this.overlayCanvas.style.pointerEvents = 'none';
      this.chartEl.nativeElement.style.position = 'relative';
      this.chartEl.nativeElement.appendChild(this.overlayCanvas);
    }
    this.resizeOverlay();
  }

  private resizeOverlay(): void {
    if (!this.overlayCanvas || !this.chartEl) return;
    if (this.state !== 'detailed') return;
    const rect = this.chartEl.nativeElement.getBoundingClientRect();
    this.overlayCanvas.width = Math.round(rect.width * devicePixelRatio);
    this.overlayCanvas.height = Math.round(rect.height * devicePixelRatio);
    this.overlayCanvas.style.width = rect.width + 'px';
    this.overlayCanvas.style.height = rect.height + 'px';
    const ctx = this.overlayCanvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    this.redrawAnnotations();
  }

  private redrawAnnotations(): void {
    if (!this.overlayCanvas) return;
    const ctx = this.overlayCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.overlayCanvas.width / devicePixelRatio;
    const h = this.overlayCanvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,80,80,0.9)';
    ctx.lineWidth = 1.5;
    for (const a of this.annotations) {
      ctx.strokeRect(a.x, a.y, a.w, a.h);
    }
  }

  toggleType(): void {
    // In compact view, we always keep line visible
    if (this.state === 'compact') {
      this.currentType = 'line';
      this.refreshSeriesVisibility();
      return;
    }

    this.currentType = this.currentType === 'line' ? 'candlestick' : 'line';
    this.refreshSeriesVisibility();
  }

  private refreshSeriesVisibility(): void {
    if (!this.chart) return;
    if (this.currentType === 'line') {
      if (this.lineSeries && typeof this.lineSeries.applyOptions === 'function') {
        this.lineSeries.applyOptions({ visible: true });
      }
      if (this.candleSeries && typeof this.candleSeries.applyOptions === 'function') {
        this.candleSeries.applyOptions({ visible: false });
      }
    } else {
      if (this.lineSeries && typeof this.lineSeries.applyOptions === 'function') {
        this.lineSeries.applyOptions({ visible: false });
      }
      if (this.candleSeries && typeof this.candleSeries.applyOptions === 'function') {
        this.candleSeries.applyOptions({ visible: true });
      }
    }
  }

  async setRange(days: number): Promise<void> {
    this.selectedDays = days;
    await this.loadAndRender(days);
  }

  private async loadAndRender(days: number): Promise<void> {
    // If caller provided historical data, use it. Otherwise fetch Binance klines for the current range.
    const pair = this.mapSymbolToBinancePair(this.data);
    let raw: number[][] | null = null;

    if (pair) {
      const interval = this.getBinanceIntervalForDays(days);
      const limit = this.getBinanceLimitForDays(days, interval);
      raw = await this.fetchBinanceKlines(pair, interval, limit);
    } else {
      raw = null;
    }

    if (raw && raw.length) {
      const lineData = raw.map(r => ({ time: Math.floor(r[0] / 1000), value: r[4] }));
      const candleData = raw.map(r => ({ time: Math.floor(r[0] / 1000), open: r[1], high: r[2], low: r[3], close: r[4] }));
      this.lineDataCache = lineData;
      this.candleDataCache = candleData;

      // seed live values from the latest candle
      try {
        const last = candleData[candleData.length - 1];
        if (last && typeof last.close === 'number') {
          this.ngZone.run(() => {
            this.livePrice = Number(last.close);
            this.lastUpdated = Date.now();
          });
        }
      } catch {}

      if (this.lineSeries && typeof this.lineSeries.setData === 'function') {
        try { this.lineSeries.setData(lineData); } catch {}
      }
      if (this.candleSeries && typeof this.candleSeries.setData === 'function') {
        try { this.candleSeries.setData(candleData); } catch {}
      }
      try { this.chart?.timeScale()?.fitContent?.(); } catch {}
    } else {
      // Clear chart if no historical data is available
      this.lineDataCache = [];
      this.candleDataCache = [];
      if (this.lineSeries && typeof this.lineSeries.setData === 'function') {
        try { this.lineSeries.setData([]); } catch {}
      }
      if (this.candleSeries && typeof this.candleSeries.setData === 'function') {
        try { this.candleSeries.setData([]); } catch {}
      }
    }

    // Always keep visibility consistent
    this.refreshSeriesVisibility();

    // Start/restart live updates using the interval for this range
    this.startLiveUpdates();
  }

  private getBinanceIntervalForDays(days: number): string {
    if (days <= 1) return '5m';
    if (days <= 7) return '1h';
    return '4h';
  }

  private getBinanceLimitForDays(days: number, interval: string): number {
    // Keep comfortably under Binance 1000 limit.
    if (interval === '5m') return Math.min(1000, days * 24 * 12); // 288 for 1 day
    if (interval === '1h') return Math.min(1000, days * 24); // 168 for 7 days
    if (interval === '4h') return Math.min(1000, days * 6); // 180 for 30 days
    return 500;
  }

  private async fetchBinanceKlines(pair: string, interval: string, limit: number): Promise<number[][]> {
    try {
      const u = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair.toUpperCase())}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
      const data = await fetch(u).then(r => r.json());
      if (!Array.isArray(data)) return [];
      // Convert Binance kline format to [timestamp_ms, o, h, l, c]
      return data.map((k: any) => [k[0], Number(k[1]), Number(k[2]), Number(k[3]), Number(k[4])]);
    } catch {
      return [];
    }
  }

  private startLiveUpdates(): void {
    // Only support Binance WebSocket live updates now
    if (this.liveIntervalId) { clearInterval(this.liveIntervalId); this.liveIntervalId = null; }
    const pair = this.mapSymbolToBinancePair(this.data);
    if (pair) {
      const interval = this.getBinanceIntervalForDays(this.selectedDays);
      this.startBinanceKline(pair, interval);
    } else {
      // no live updates for unmapped symbols
      this.stopBinance();
    }
  }

  private mapSymbolToBinancePair(coin?: CryptoCurrency): string | null {
    if (!coin?.symbol) return null;
    const base = String(coin.symbol).trim().toLowerCase();
    if (!base) return null;

    // Binance spot generally uses USDT rather than USD.
    const quoteRaw = String(coin.exchange_currency ?? '').trim().toLowerCase();
    const quote = quoteRaw === 'usd' ? 'usdt' : (quoteRaw || 'usdt');

    // Basic sanity: allow only letters/numbers to avoid malformed URLs.
    const safeBase = base.replace(/[^a-z0-9]/g, '');
    const safeQuote = quote.replace(/[^a-z0-9]/g, '');
    if (!safeBase || !safeQuote) return null;

    return `${safeBase}${safeQuote}`;
  }

  private startBinanceKline(pair: string, interval = '1m') {
    // Reconnect if pair/interval changed
    if (this.ws && this.wsPair === pair && this.wsInterval === interval) return;
    this.stopBinance();

    const stream = `${pair}@kline_${interval}`;
    const url = `wss://stream.binance.com:9443/ws/${stream}`;
    this.ws = new WebSocket(url);
    this.wsPair = pair;
    this.wsInterval = interval;
    this.ws.onopen = () => { console.log('Binance WS open', pair); };
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg || !msg.k) return;
        const k = msg.k; // kline payload
        const time = Math.floor(k.t / 1000);
        const candle = { time, open: Number(k.o), high: Number(k.h), low: Number(k.l), close: Number(k.c) };
        const price = Number(k.c);
        const volume = k.v ? Number(k.v) : undefined;
        const nowSec = time;

        // compute approximate 24h change using cached candles (fallback to first candle)
        let change24h: number | undefined = undefined;
        try {
          const cutoff = nowSec - 24 * 3600;
          let ref = this.candleDataCache.find((c: any) => c.time <= cutoff);
          if (!ref && this.candleDataCache.length) ref = this.candleDataCache[0];
          if (ref && typeof ref.close === 'number' && ref.close > 0) {
            change24h = ((price - ref.close) / ref.close) * 100;
          }
        } catch (err) { /* ignore */ }

        // update displayed fields inside Angular zone so bindings update
        try {
          this.ngZone.run(() => {
            this.livePrice = price;
            this.exchangeLabel = 'Binance';
            this.lastUpdated = nowSec * 1000;
            if (typeof change24h === 'number') this.change24h = Number(change24h.toFixed(2));
          });
        } catch (err) { /* ignore */ }

        // Line series: if no historical data was set, call setData once, otherwise update
        try {
          const point = { time, value: price };
          if (this.lineSeries) {
            if (this.lineDataCache.length === 0 && typeof this.lineSeries.setData === 'function') {
              this.lineSeries.setData([point]);
              this.lineDataCache.push(point as any);
              // fit once after initial data
              try { this.chart.timeScale().fitContent(); } catch {}
            } else if (typeof this.lineSeries.update === 'function') {
              this.lineSeries.update(point);
              // keep cache
              const lastL = this.lineDataCache[this.lineDataCache.length - 1];
              if (!lastL || lastL.time !== time) this.lineDataCache.push(point as any);
              else lastL.value = price;
            }
          }
        } catch (err) { /* ignore series errors */ }

        // Candle series
        try {
          if (this.candleSeries) {
            if (this.candleDataCache.length === 0 && typeof this.candleSeries.setData === 'function') {
              this.candleSeries.setData([candle]);
              this.candleDataCache.push(candle as any);
              try { this.chart.timeScale().fitContent(); } catch {}
            } else if (typeof this.candleSeries.update === 'function') {
              this.candleSeries.update(candle);
              const last = this.candleDataCache[this.candleDataCache.length - 1];
              if (!last || last.time !== time) this.candleDataCache.push(candle as any);
              else { last.open = candle.open; last.high = candle.high; last.low = candle.low; last.close = candle.close; }
            }
          }
        } catch (err) { /* ignore series errors */ }
      } catch (e) { /* ignore parse errors */ }
    };
    this.ws.onerror = (ev) => { console.error('Binance WS error', ev); };
    this.ws.onclose = () => { this.ws = null; };
  }

  private stopBinance() {
    if (!this.ws) return;
    try { this.ws.close(); } catch {}
    this.ws = null;
    this.wsPair = null;
    this.wsInterval = null;
  }

  private stopLiveUpdates(): void {
    if (!this.liveIntervalId) return;
    clearInterval(this.liveIntervalId);
    this.liveIntervalId = null;
  }

  toggleDrawing(): void {
    // no drawing in compact mode
    if (this.state !== 'detailed') return;
    this.isDrawing = !this.isDrawing;
    if (this.isDrawing) {
      if (this.overlayCanvas) this.overlayCanvas.style.pointerEvents = 'auto';
      this.enableDrawingListeners();
    } else {
      if (this.overlayCanvas) this.overlayCanvas.style.pointerEvents = 'none';
      this.disableDrawingListeners();
    }
  }

  private startX = 0; private startY = 0; private drawing = false;
  private mouseDownListener: any; private mouseMoveListener: any; private mouseUpListener: any;

  private enableDrawingListeners(): void {
    if (!this.overlayCanvas) return;
    if (this.state !== 'detailed') return;
    const el = this.overlayCanvas;
    this.mouseDownListener = (e: MouseEvent) => {
      this.drawing = true;
      const rect = el.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
    };
    this.mouseMoveListener = (e: MouseEvent) => {
      if (!this.drawing) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const ctx = el.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0,0,rect.width,rect.height);
      this.redrawAnnotations();
      ctx.strokeStyle = 'rgba(0,128,255,0.9)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    };
    this.mouseUpListener = (e: MouseEvent) => {
      if (!this.drawing) return; this.drawing = false;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      this.annotations.push({ x: this.startX, y: this.startY, w: x - this.startX, h: y - this.startY });
      this.redrawAnnotations();
    };
    el.addEventListener('mousedown', this.mouseDownListener);
    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseup', this.mouseUpListener);
  }

  private disableDrawingListeners(): void {
    if (!this.overlayCanvas) return;
    const el = this.overlayCanvas;
    el.removeEventListener('mousedown', this.mouseDownListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
  }
}
