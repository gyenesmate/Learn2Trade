> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Notification service

**Source:** `frontend/src/app/core/services/notification.service.ts`

## Role

Event-only facade for the custom snackbar stack. It publishes typed requests; success/info/warning auto-dismiss after 3.5 seconds, while errors and crypto alerts persist. Alerts may carry actions such as View or Stop.

## API surface

- `requests$`
- `success`, `info`, `warning`, `error`, `alert`

## Connected to

- `NotificationStackComponent` subscribes and owns queue IDs, timers, dismissals, scrolling, and rendering.
- `AppComponent` hosts one global `<app-notification-stack>` beside the router outlet.
- Auth screens, portfolio/trading/admin flows, and `PriceAlertsService` publish requests.

## Rules that apply

- [`material-guide.mdc`](../../../.cursor/rules/material-guide.mdc) — use the existing notification path, not a second toast system.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — global hosts stay minimal in `AppComponent`; reusable UI lives under `shared/`.
