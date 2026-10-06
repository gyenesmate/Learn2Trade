> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Crypto currency edit

**Source:** `frontend/src/app/features/markets/components/crypto-currency-edit/crypto-currency-edit.component.ts`

## Role

Admin create/edit form for `/admin/crypto-currencies/new` and `/admin/crypto-currencies/:id/edit`. It loads Binance trading markets, existing catalog entries, and an optional edited entry in parallel, then requires selection of an unused valid Binance market.

## API surface

- Reactive form: required `name`, hidden `symbol` and `exchange_currency`, plus validated object-valued `market`.
- `filteredMarkets` excludes used pairs, preserves the current edit pair, filters by symbol/base/quote/label, and caps results at 80.
- `onMarketSelected` derives payload symbol and quote from the Binance option.
- `save` creates or updates through `CryptoCurrenciesService`, notifies, and returns to `/profile`; `cancel` also returns there.
- Existing USD/USDT quote variants are accepted when matching a Binance market.

## Connected to

- `BinanceRestService.getExchangeInfoMarkets`, `CryptoCurrenciesService`, `NotificationService`, Router, and `PageHeaderComponent`.
- Both routes require `authGuard` and `adminGuard`.

## Rules that apply

- [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — admin UI remains feature-owned; reusable API access stays in core.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc) — reactive forms and signal-derived filtering.
- [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`agents.md`](../../../../agents.md) — autocomplete, accessibility, route, and repository conventions.

## Notes / smells

- `ngOnInit` catches catalog/market/record loading as one operation, so one rejection prevents otherwise available form data from being applied.
