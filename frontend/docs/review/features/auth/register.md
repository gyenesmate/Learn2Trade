> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Register

**Source:** `frontend/src/app/features/auth/register/register.component.ts`

## Role

Presents the Learn2Trade account-creation form, validates identity and password requirements, and delegates registration plus session setup to `AuthService`.

## API surface

- Route: anonymous `/register`; `authGuard` redirects authenticated visitors to `/dashboard`.
- Required username, valid email, password, and confirmation controls.
- Password requires at least eight characters, one uppercase letter, and one digit.
- Group validation maintains a `passwordMismatch` error on confirmation.
- Success navigates to `/dashboard`; failure shows a generic notification.
- Independent accessible toggles reveal password and confirmation values.

## Connected to

- `AuthService.register` posts account data and applies the returned session.
- `NotificationService`, Angular router, and Material form/input/button/icon modules.
- Footer links to `/login`.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — branded Material forms, accessible controls, and validation timing.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — reactive validation and feature placement.
