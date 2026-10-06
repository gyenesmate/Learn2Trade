> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Crypto currencies service

**Source:** `frontend/src/app/core/services/crypto-currencies.service.ts`

## Role

CRUD adapter for the application crypto-currency catalog. It uses the app API, not Binance directly; `getById` converts only HTTP 404 into `null` and propagates other failures.

## API surface

- `getAll`, `getById`
- `create`, `update`, `delete`

## Connected to

- `ApiService`; Markets, Trading, Dashboard, portfolio/watchlist, admin editor, and `PriceAlertsService`.
- `BinanceRestService` separately supplies admin exchange-symbol suggestions.

## Rules that apply

- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — domain HTTP adapters live in core services.
- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — preserve explicit error/empty distinctions.
