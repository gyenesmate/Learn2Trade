> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Banned

**Source:** `frontend/src/app/features/auth/banned/banned.component.ts`

## Role

Public suspension notice reached when `AuthService.login` normalizes a banned API response. It provides a mail link for an unban request and a button back to Markets.

## API surface

- Route: public `/banned`.
- `supportEmail` supplies the displayed and `mailto:` support address.
- `goHome()` navigates to `/markets`.

## Connected to

- Login routes here for `{ code: 'auth/banned' }`.
- Angular router returns users to the public Markets page.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — readable status messaging and accessible actions.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — feature component and route placement.

## Notes / smells

- The support address is the placeholder `support@example.com`.
- The return button is plain HTML rather than an Angular Material button.
