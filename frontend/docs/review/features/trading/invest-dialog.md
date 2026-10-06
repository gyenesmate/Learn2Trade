> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Invest dialog

**Source:** `frontend/src/app/features/trading/components/invest-dialog/invest-dialog.component.ts`

## Role

Collects a dollar amount and optional description for an investment. The dialog displays the selected crypto, current price, and available balance, but leaves authoritative auth, balance, and live-price validation to the Trading component after close.

## API surface

- Input data: `crypto`, `currentPrice`, and `availableBalance`.
- Reactive form: required `amount` with minimum `0.01`; optional `description`.
- `confirm()` marks controls touched, rejects invalid/non-positive values, and closes with normalized `{ amount, description }`.
- `cancel()` closes with `null`.

## Connected to

- Trading opens the dialog and handles its result.
- Shared `BaseDialogComponent` supplies title/content/action slots.
- Angular Material dialog, form-field, input, and button modules provide interaction and focus behavior.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — investment amount, balance context, and action semantics.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc) — reactive forms and injected dialog data.
- [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — shared dialog shell and feature-local dialog placement.

## Notes / smells

- Available balance is informational only in the dialog; entering a larger amount remains possible and is rejected later by Trading.
