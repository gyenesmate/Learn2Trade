> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Binance market data service

**Source:** `frontend/src/app/core/binance/binance-market-data.service.ts`

## Role

Domain layer over the single WebSocket transport. It ref-counts miniTicker and kline consumers, diffs desired streams against wire subscriptions, re-subscribes after reconnect, and exposes a readonly `latestTickers` map. `setMiniTickerTargets()` adds page-owned catalog targets without creating duplicate card watches.

## API surface

- `watchMiniTicker(pair)` / `watchKline(pair, interval)` return teardown-aware Observables.
- `setMiniTickerTargets(pairs)` replaces explicit page targets and sends only subscription deltas.
- `latestTickers` stores the latest miniTicker by lowercase pair.
- Empty desired sets unsubscribe logical streams but deliberately do **not** idle-disconnect the physical socket.

## Connected to

- `WebSocketService`; Markets, crypto cards/charts, watchlist dialog, and `PriceAlertsService`.
- [`CRYPTO_WEBSOCKETS.md`](../../CRYPTO_WEBSOCKETS.md) documents the full lifecycle and deferred idle timeout.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — RxJS for streams, readonly signals for current state.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — Binance coordination remains in `core/binance/`.

## Primary data flow

```mermaid
sequenceDiagram
  participant Feature
  participant Market as BinanceMarketDataService
  participant WS as WebSocketService
  participant Binance

  Feature->>Market: watchMiniTicker(pair) / watchKline(pair, interval)
  Market->>Market: increment refCount; compute desired streams
  Market->>WS: connect(shared URL)
  WS->>Binance: open one physical socket
  WS-->>Market: state = connected
  Market->>WS: SUBSCRIBE only missing streams
  Binance-->>WS: combined stream message
  WS-->>Market: messages$
  Market-->>Feature: normalized ticker/candle
  Feature->>Market: unsubscribe
  Market->>WS: UNSUBSCRIBE if no refs/targets
  Note over Market,WS: Socket stays open when desired set is empty
```

## Notes / smells

- `latestTickers` clones its `Map` per tick; the live comment defers optimization until profiling (`PERF-01`).
