> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Binance REST service

**Source:** `frontend/src/app/core/binance/binance-rest.service.ts`

## Role

Small public Binance Spot REST adapter. It intentionally uses `fetch`, keeping app auth interceptors and credentials away from third-party URLs, and normalizes exchange markets and historical klines for UI consumers. There is no cache.

## API surface

- `getExchangeInfoMarkets()` — active `TRADING` symbols as uppercase market options.
- `getKlines(pair, interval, limit)` — `/api/v3/klines` rows as `ChartCandle[]`.
- `getTickerPrice(pair)` — current ticker price, or `NaN` on failure.
- Exchange-info and kline failures return empty arrays.

## Connected to

- Crypto chart/history, dashboard pricing, and admin crypto-currency editor.
- [`CRYPTO_WEBSOCKETS.md`](../../CRYPTO_WEBSOCKETS.md) is the architecture pointer for REST plus live-stream responsibilities.

## Rules that apply

- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — third-party market integration belongs in `core/binance/`.
- `angular-guide.mdc` — keep transport errors explicit at consumer boundaries.
