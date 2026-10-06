> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Market movers

**Source:** `frontend/src/app/features/markets/components/market-movers/market-movers.component.ts`

## Role

Ranks ticker-enriched markets in three local modes and renders at most eight links to trading details. Gainers sort descending by 24-hour change, losers ascending, and active markets descending by quote volume.

## API surface

- Required `rows: MarketMoverRow[]` input.
- `emptyMessage` input defaults to `Waiting for live market data…`.
- `mode` is `gainers`, `losers`, or `active`.
- `visibleRows` sorts a copy and applies the eight-row limit.
- Each row links to `/crypto/:cryptoId`.

## Connected to

- Markets supplies all rows with a positive live price and chooses empty-catalog versus waiting-for-tickers copy.
- Angular Router opens the auth-guarded Trading route.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — gain/loss semantics and dense rankings.
- [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc) — Material toggle behavior and accessible controls.
- [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — colocated feature component and stable detail route.

## Notes / smells

- “Gainers” and “losers” sort all priced rows; they do not filter by positive/negative sign, so an all-negative market can still populate the gainers list.
