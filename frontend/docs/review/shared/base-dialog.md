> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Base dialog

**Source:** `frontend/src/app/shared/components/base-dialog/base-dialog.component.ts`

## Role

Projection-only Material dialog frame that standardizes title, content, and end-aligned action regions without owning dialog data or close behavior.

## API surface

- `[dialogTitle]` projected content is placed in `mat-dialog-title`.
- Unselected content is placed in `mat-dialog-content`.
- `[dialogActions]` projected content is placed in end-aligned `mat-dialog-actions`.
- Host class: `base-dialog`.

## Connected to

- [Confirmation dialog](confirmation-dialog.md), watchlist dialog, investment dialog, and set-price-alert dialog.
- Callers continue to own `MatDialogRef`, injected data, validation, and result values.

## Rules that apply

- [`material-guide.mdc`](../../../.cursor/rules/material-guide.mdc) — Material dialog structure, action placement, focus, and accessibility.
- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — standalone OnPush composition.
- [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) and [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) — reusable framing stays shared; domain dialogs stay in features.
