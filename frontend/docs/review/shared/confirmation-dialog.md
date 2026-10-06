> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Confirmation dialog

**Source:** `frontend/src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts`

## Role

Reusable destructive-action confirmation opened through `MatDialog`. It composes the base dialog, renders injected copy, and closes with a boolean result.

## API surface

- Injected `ConfirmationDialogData`: required `message`; optional `title`, `confirmText`, and `cancelText`.
- Defaults: “Are you sure?”, “Confirm”, and “Cancel”.
- Confirm closes with `true`; cancel closes with `false`.

## Connected to

- Portfolio confirms several delete operations.
- Trading confirms deletion through the same component.
- [Base dialog](base-dialog.md) supplies title/content/action structure.

## Rules that apply

- [`material-guide.mdc`](../../../.cursor/rules/material-guide.mdc) — `MAT_DIALOG_DATA`, `MatDialogRef`, warn action treatment, and dialog accessibility.
- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — standalone OnPush component and dependency injection.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) and [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — shared generic confirmation, feature-owned decision and follow-up.
