> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Set price alert dialog

**Source:** `frontend/src/app/features/trading/components/set-price-alert-dialog/set-price-alert-dialog.component.ts`

## Role

Collects a positive target price and optional description for the selected crypto. It shows the current live price for context; Trading determines `below` versus `above` after the dialog closes and persists the alert.

## API surface

- Input data: `crypto` and `currentPrice`.
- Reactive form: required `alertPrice` with minimum `0.000001`; optional `description`.
- `confirm()` marks controls touched, rejects invalid/non-positive values, and closes with normalized `{ alertPrice, description }`.
- `cancel()` closes with `null`.

## Connected to

- Trading opens the dialog, classifies the alert direction, and calls `PriceAlertsService.create`.
- Shared `BaseDialogComponent` supplies dialog structure.
- Angular Material dialog, form-field, input, and button modules provide controls.

## Rules that apply

- [`STYLING_GUIDELINES.md`](../../../STYLING_GUIDELINES.md) — price precision and alert action context.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc) — reactive forms and typed dialog data.
- [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — Material dialog reuse and feature ownership.

## Notes / smells

- The template's native `min="0"` is looser than the form validator's `0.000001`; Angular validation still enforces the stricter rule.
