> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Markets component

**Source:** `frontend/src/app/features/markets/markets.component.ts`

## Role

Loads the crypto catalog for `/markets`, derives ticker-enriched rows, and controls search, gain/loss filters, sorting, and five-item pagination. It owns miniTicker targets for the full catalog—not only the visible page—so volume/change ordering and movers remain accurate.

## API surface

- State: `loading`, `loadError`, `cryptocurrencies`, `search`, `filter`, `sort`, `pageIndex`.
- Derived: `marketRows`, `filteredRows`, `pageCount`, `pageNumbers`, `pageAssets`, `moverRows`.
- Actions: `retryLoad`, `onSearchInput`, `setFilter`, `setSort`, `goToPage`, `prevPage`, `nextPage`.
- `MARKETS_PAGE_SIZE` is `5`; search/filter/sort reset the page to zero.
- On catalog changes, `syncTickerTargets()` calls `setMiniTickerTargets()`; `ngOnDestroy()` clears those targets.

## Connected to

- `CryptoCurrenciesService`, `BinanceMarketDataService`, and `toBinancePair`.
- `AnimatedMarketCardLayoutComponent` receives current-page assets plus `latestTickers`.
- `MarketMoversComponent` receives all priced rows and distinct empty copy: `No markets available.` for an empty catalog, otherwise `Waiting for live market data…`.

## Rules that apply

- [`CRYPTO_WEBSOCKETS.md`](../../../CRYPTO_WEBSOCKETS.md) — one page-owned aggregate ticker target set.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc) — signal-derived view state and explicit teardown.
- [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — feature ownership and stable `/markets` route.

## Notes / smells

- Catalog load failures are surfaced, but individual missing ticker values are represented as zero until live data arrives.
