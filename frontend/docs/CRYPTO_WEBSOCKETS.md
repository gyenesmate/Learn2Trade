# CRYPTO_WEBSOCKETS.md

Binance public market-data WebSocket architecture for Learn2Trade.

**Doc check date:** 2026-03-30  
**Binance refs:** Spot WebSocket streams (`SUBSCRIBE` / `UNSUBSCRIBE` on combined `/stream`), Individual Symbol Mini Ticker (`<symbol>@miniTicker`), Individual Symbol Kline (`<symbol>@kline_<interval>`), REST `GET /api/v3/exchangeInfo`, `GET /api/v3/klines`.

---

## Purpose

Provide live market data for Learn2Trade over **one** app-wide physical Binance Spot public WebSocket. No order/user streams, no API keys, no real trading.

---

## Architecture

```text
Binance Spot public WS  →  WebSocketService (core/websocket)
                              ↓
                         BinanceMarketDataService (core/binance)
                              ├── watchMiniTicker  → compact CryptoCard
                              └── watchKline       → crypto-chart (detailed)

Binance REST            →  BinanceRestService
                              ├── getKlines → compact seed / detailed history
                              └── getExchangeInfoMarkets → admin autocomplete
```

| Piece | Role |
| --- | --- |
| `core/websocket/WebSocketService` | Single socket, connect/send/`messages$`/state, reconnect with backoff. No crypto knowledge. |
| `core/binance/BinanceMarketDataService` | Ref-counted streams; SUBSCRIBE/UNSUBSCRIBE diffs; reconnect → resubscribe desired set. |
| `core/binance/BinanceRestService` | `getExchangeInfoMarkets()`, `getKlines()` → `ChartCandle[]`. **No cache.** |
| `shared/.../crypto-card` | Public card API (compact / detailed). Never opens `new WebSocket`. |
| `shared/.../crypto-card/crypto-chart/` | Detailed candlestick UI (colocated under crypto-card). |

URL (combined stream): `wss://stream.binance.com:9443/stream` — only in `binance.const.ts`.

---

## Root cause of previous Markets → Detail → Markets reconnect

When leaving Markets, targets and miniTicker consumers dropped to zero. `BinanceMarketDataService` then called **`ws.disconnect()`**, tearing down the physical socket before Trading mounted. Trading’s new subscription forced a reconnect.

**Fix:** keep correct SUBSCRIBE/UNSUBSCRIBE, but **do not** idle-disconnect when the desired stream set is temporarily empty (route-transition safe). Idle timeout can be added later. Features never own physical disconnect.

---

## Lifecycle

1. First consumer (`watchMiniTicker` / `watchKline`) or `setMiniTickerTargets` → open socket if needed → `SUBSCRIBE`.
2. Additional consumers for the same stream increment ref-count; no duplicate SUBSCRIBE.
3. Last release (and stream not in page targets) → `UNSUBSCRIBE`.
4. Desired set empty → **socket stays open** (this phase).
5. Unexpected close → transport reconnects with backoff; market-data clears wire set and re-SUBSCRIBEs the desired set once connected.

Markets calls `setMiniTickerTargets` for the **full catalog** so movers/sort stay accurate, reads prices from `BinanceMarketDataService.latestTickers`, and passes tickers into cards as `externalTicker` (cards do **not** open a second miniTicker watch on Markets). Clears targets on destroy (logical cleanup only).

---

## Compact vs detailed

### Compact (`CryptoCardComponent` `state='compact'`)

```text
miniTicker
  → livePrice + 24h change (from miniTicker o/c)
  → line sparkline (price points over time; optional REST close seed)
```

Does **not** interpret miniTicker OHLC as candles. No kline WS.

### Detailed (`state='detailed'` → colocated `app-crypto-chart`)

```text
REST historical Klines  →  series.setData
+
WebSocket live Kline    →  series.update
  → CandlestickSeries + indicators
  → live price = current kline close
```

Detailed mode **does not** maintain its own miniTicker subscription. The live kline close supplies current price.

---

## Streams

| Stream | Use |
| --- | --- |
| `{symbol}@miniTicker` | Compact live summary |
| `{symbol}@kline_{interval}` | Detailed live candle |

### Intervals

Defined in `crypto-card/crypto-chart/crypto-chart.const.ts`:

- `KLINE_INTERVALS`: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`
- `DEFAULT_KLINE_INTERVAL`: `15m`
- `KLINE_HISTORY_LIMIT`: `500`

Interval change: UNSUBSCRIBE old kline → REST history (`switchMap` cancels stale) → SUBSCRIBE new kline. Same physical socket.

### Chart lifecycle

- REST history → `CandlestickSeries.setData`
- WS candle → `update` (same timestamp replaces; new timestamp appends)
- Pending live candle merged if WS arrives before REST completes

### OHLC

Controls row `.price-detail` + crosshair via Lightweight Charts v5 `param.seriesData` (not v4 `seriesPrices`). Leaving hover restores the latest candle.

### Indicators (local math from klines — no extra WS)

Config: `CHART_INDICATORS` in `crypto-chart.const.ts`. Utils: `crypto-chart.utils.ts`.

| Indicator | Default |
| --- | --- |
| Volume (histogram pane) | on |
| SMA 20 | off |
| EMA 20 | off |
| EMA 50 | off |
| RSI 14 (separate pane, 30/70 guides) | off |

---

## Navigation

```text
/markets          → SUBSCRIBE miniTickers
/crypto/:id       → UNSUBSCRIBE markets miniTickers; SUBSCRIBE kline
back to /markets  → UNSUBSCRIBE kline; SUBSCRIBE miniTickers
```

Logical subscription transitions only — one Binance WebSocket entry in DevTools.

---

## Admin crypto edit

Unchanged: `getExchangeInfoMarkets()` via `fetch`; autocomplete writes `symbol` + `exchange_currency`.

---

## Caching

None for prices, preferences, or `exchangeInfo`.

---

## Routing

Canonical markets URL: `/markets` (empty path redirects there).

---

## Markets display

`MARKETS_PAGE_SIZE` (default 5) controls card slots. Markets owns full-catalog `setMiniTickerTargets` so movers stay accurate; cards receive `externalTicker` and do not open their own watches. Loading spinner / empty / error+Retry when catalog load fails.

---

## Out of scope / future work

- Idle socket disconnect timeout — **deferred (WS-02):** keep no-idle while Markets/Trading subscribe sets settle; only add a 60–120s empty-desired disconnect after profiling confirms route gaps no longer thrash reconnects.
- Real Binance trading / user streams
- MACD, Bollinger, drawing tools
- Persistent chart preferences
- Dashboard / price-alerts REST ticker → WS migration (alerts already on miniTicker)

---

## Related files

- `src/app/core/websocket/`
- `src/app/core/binance/`
- `src/app/shared/components/crypto-card/`
- `src/app/shared/components/crypto-card/crypto-chart/`
- `src/app/features/markets/`
- `src/app/features/trading/`
