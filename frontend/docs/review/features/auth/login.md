> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Login

**Source:** `frontend/src/app/features/auth/login/login.component.ts`

## Role

Presents the Learn2Trade sign-in form and delegates session creation to `AuthService`. Successful login navigates to the dashboard; a normalized banned error goes to `/banned`; all other failures show a generic credential message.

## API surface

- Route: anonymous `/login`; `authGuard` redirects authenticated visitors to `/dashboard`.
- Reactive controls: required valid email and required password.
- Submit marks controls touched, calls `AuthService.login`, then routes by outcome.
- Password visibility is a signal-backed accessible suffix toggle.
- Footer links to `/register`.

## Connected to

- `AuthService` creates and stores the session.
- `NotificationService` reports non-banned failure.
- Angular router, CDK a11y, and Material form/input/button/icon modules.

## Rules that apply

- [`STYLING_GUIDELINES.md`](../../../STYLING_GUIDELINES.md) — Material form treatment, touched validation, focus, and Learn2Trade visual language.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — reactive forms and auth feature placement.

## Notes / smells

- Submit logs the entered email and login milestones to the browser console.
