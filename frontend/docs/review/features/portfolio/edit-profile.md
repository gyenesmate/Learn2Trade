> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Edit profile

**Source:** `frontend/src/app/features/portfolio/edit-profile/edit-profile.component.ts`

## Role

Provides the auth-guarded profile editor for username and preferred theme. Initial values come from the current auth user; successful updates return to `/profile`, while cancellation leaves without writing.

## API surface

- Route: auth-guarded `/edit-profile`.
- Reactive form: required `username` and required `theme` (`light`, `dark`, or `system`).
- `saveProfile()` marks invalid controls, calls `UsersService.updateProfile`, notifies, then navigates to `/profile`.
- `cancel()` navigates directly to `/profile`.

## Connected to

- `AuthService` supplies initial identity/theme.
- `UsersService` persists changes; `NotificationService` reports outcome.
- Shared page header and Angular Material form-field/input/select modules.

## Rules that apply

- [`STYLING_GUIDELINES.md`](../../../STYLING_GUIDELINES.md) — form fields, validation timing, and theme conventions.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — reactive forms and route-feature placement.

## Notes / smells

- Action buttons use legacy CSS classes instead of Material button directives used elsewhere.
