> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Portfolio component

**Source:** `frontend/src/app/features/portfolio/portfolio.component.ts`

## Role

Orchestrates the profile workspace. Reactive effects load tables after auth bootstrap and bind the live price-alert signal; service calls populate watchlist and investment rows with crypto metadata. Admin users also receive catalog editing/deletion and user ban/unban actions.

## API surface

- Route: auth-guarded `/profile`; header action navigates to `/edit-profile`.
- `fundsForm` uses an outlined Material field with required/minimum-1 validation and calls `UsersService.addCurrencyToBalance`.
- User tables: watchlist removal, investment-detail navigation, and alert deletion.
- Admin tables: add/edit/delete crypto currencies and ban/unban users, with confirmation dialogs.
- Signals hold normalized table rows, crypto cache, and admin loading state.

## Connected to

- `AuthService`, `UsersService`, crypto, watchlist, investment, and price-alert services.
- Shared data table, page header, confirmation dialog, and notification service.
- `/crypto/:id`, `/edit-profile`, and admin crypto routes.

## Rules that apply

- [`STYLING_GUIDELINES.md`](../../../STYLING_GUIDELINES.md) — outlined Material fields, validation, financial formatting, and dense tables.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — reactive forms, signals/effects, dialogs, and service boundaries.

## Notes / smells

- Several tables use `any`, weakening the otherwise explicit table contracts.
- Investment `amount` is configured as currency even though it represents asset quantity.
