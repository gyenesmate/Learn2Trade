> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# App snackbar

**Source:** `frontend/src/app/shared/components/app-snackbar/app-snackbar.component.ts`

## Role

Presentational notification item for success, info, warning, error, and alert variants. It renders optional title/actions, exposes explicit dismissal, and does not own queueing or duration.

## API surface

- Required input: `data: AppSnackbarData` with id, message, variant, optional title, and optional actions.
- Output: `dismissed`.
- Running an action invokes its callback and then emits `dismissed`.
- Host carries `role="status"` and `data-variant`; the close icon has an accessible label.

## Connected to

- [Notification stack](notification-stack.md) supplies each item and handles dismissal.
- `NotificationService` creates pre-id requests consumed by the stack.

## Rules that apply

- [`material-guide.mdc`](../../../.cursor/rules/material-guide.mdc) — button/icon accessibility and non-blocking status feedback.
- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — required signal input, output, and OnPush.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) and [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — shared presentation and core-owned app-wide notification API.

## Notes / smells

- Action callbacks execute synchronously; an exception prevents the following dismissal emit.
