> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Watchlist subscriptions service

**Source:** `frontend/src/app/core/services/watchlist-subscriptions.service.ts`

## Role

Watchlist HTTP adapter plus reactive membership cache. An auth effect clears IDs on sign-out and refreshes on a signed-in user; create/delete update cloned `Set` values for signal consumers. Dialog open state deliberately remains feature-owned.

## API surface

- Read state: `ids`, `idCount`, `isInWatchlist`
- HTTP/cache: `getMe`, `refresh`, `create`, `deleteByCryptoCurrencyId`

## Connected to

- `ApiService`, `AuthService`; portfolio, watchlist dialog, and crypto cards.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — expose readonly signals and keep mutations inside the service.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — shared membership state in core; feature UI state in the feature.
