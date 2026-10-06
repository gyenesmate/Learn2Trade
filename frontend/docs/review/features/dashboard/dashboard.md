> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Dashboard component

**Source:** `frontend/src/app/features/dashboard/dashboard.component.ts`

## Role

Loads the current user's investments and crypto catalog, excludes sold investments from holdings, aggregates open positions by crypto, fetches one Binance REST price per held asset, and derives portfolio totals. It renders loading/empty states, an overview, a holdings table, and analytics for the complete investment history.

## API surface

- Route: auth-guarded `/dashboard`; header action navigates to `/markets`.
- Signals: `portfolio`, `holdings`, `investments`, and `isLoading`.
- Holding math: quantity and cost are grouped per crypto; average price, current value, P&L, and percentage change are derived.
- Price fallback: missing/invalid Binance price becomes average buy price, producing zero apparent change for that asset.
- Errors are logged and surfaced through `NotificationService`.

## Connected to

- `AuthService`, `InvestmentsService`, `CryptoCurrenciesService`, and `BinanceRestService`.
- Shared `PageHeaderComponent` and `DataTableComponent`.
- Feature-local `AnalyticsCardComponent`.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — tabular numbers and gain/loss semantics.
- [`CRYPTO_WEBSOCKETS.md`](../../../CRYPTO_WEBSOCKETS.md) — REST snapshot usage must remain distinct from live stream ownership.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — standalone components, signals, Material, and feature placement.

## Notes / smells

- The UI does not label stale/fallback prices, so total value and P&L can look authoritative when Binance lookup failed.
