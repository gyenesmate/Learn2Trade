> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Price alerts service

**Source:** `frontend/src/app/core/services/price-alerts.service.ts`

## Role

Coordinates persisted user alerts with live Binance miniTicker prices. After `start()`, auth changes reload active alerts, resolve crypto IDs to Binance pairs, maintain one miniTicker subscription per pair, evaluate above/below thresholds, and emit persistent actionable notifications.

## API surface

- State: `alerts`, `firedAlerts`
- Lifecycle: `start`, `stop`, `reloadUserAlerts`
- HTTP: `getByUserId`, `create`, `updateById`, `deleteById`, `deactivate`
- A fired alert is suppressed from firing again until its fired state is removed or alerts reload.

## Connected to

- `AppComponent` starts it; `AuthService`, `CryptoCurrenciesService`, `BinanceMarketDataService`, `NotificationService`, and Router support evaluation/actions.
- [`CRYPTO_WEBSOCKETS.md`](../../CRYPTO_WEBSOCKETS.md) describes miniTicker ownership. Alert evaluation is the documented WS-01 behavior; no feature-owned physical disconnect.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — RxJS for live streams and signals for service state.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — cross-feature alert orchestration remains a core service.

## Diagram

```mermaid
flowchart LR
  Auth[auth user] --> Alerts[PriceAlertsService]
  API[/price-alerts/me] --> Alerts
  Catalog[crypto catalog] --> Pair[Binance pair]
  Pair --> Alerts
  Ticker[miniTicker] --> Alerts
  Alerts -->|threshold hit| Notify[NotificationService]
  Notify --> Host[AppComponent snackbar stack]
```
