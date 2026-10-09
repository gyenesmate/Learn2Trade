> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Watchlist dialog

**Source:** `frontend/src/app/features/watchlist/watchlist-dialog/watchlist-dialog.component.ts`

## Role

Loads the current subscription IDs and crypto catalog, derives watched rows, and opens one ref-counted miniTicker consumer per valid Binance pair. It presents loading, empty, and ready states with view/remove actions.

## API surface

- Opened/toggled by `SidebarComponent` at `26rem` width; it has no route.
- `rows` combines watched crypto metadata with the latest ticker map.
- `remove(id)` deletes the subscription, notifies, and rewires ticker consumers.
- `view(id)` closes the dialog and navigates to `/crypto/:id`.
- `ngOnDestroy()` unsubscribes every ticker consumer.

## Connected to

- `WatchlistSubscriptionsService`, `CryptoCurrenciesService`, and `BinanceMarketDataService`.
- `NotificationService`, Angular router, and shared `BaseDialogComponent`.
- Sidebar owns the single open dialog reference and closes it on shell destruction.

## Rules that apply

- [`CRYPTO_WEBSOCKETS.md`](../../../CRYPTO_WEBSOCKETS.md) — use ref-counted market-data consumers and release them; never own the physical socket.
- [`STYLING_GUIDELINES.md`](../../../STYLING_GUIDELINES.md) — compact prices, 24-hour movement, and accessible actions.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — dialog lifecycle and feature placement.

## Notes / smells

- Catalog-load failure is rendered as an empty watchlist, so users cannot distinguish failure from no subscriptions.
