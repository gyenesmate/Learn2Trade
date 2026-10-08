# App shell — improvements

**Review:** [`../../review/architecture/01-app-shell.md`](../../review/architecture/01-app-shell.md)  
**Spec:** [`../../superpowers/specs/2026-10-07-app-shell-auth-layout-design.md`](../../superpowers/specs/2026-10-07-app-shell-auth-layout-design.md)  
**Modified:** 2026-10-08

## Checklist

- [x] Remove unused `AppComponent.title = 'cryptowatcher-app'` and the matching unit test
- [x] Add minimal `AuthLayoutComponent` (centered host + `<router-outlet />` only)
- [x] Move `/login`, `/register`, `/banned` under AuthLayout (no sidebar/navbar)
- [x] Keep feature routes under `BaseLayoutComponent`
- [x] Stop calling `PriceAlertsService.start()` from `AppComponent`; arm after `AuthService.bootstrap()` in `app.config.ts` (`inject()` before any `await` in the initializer)
- [x] Update `FILE_STRUCTURES.md` + `learn2trade.mdc` for dual layout
- [ ] **App init in AppConfig:** `provideAppInitializer` should move into dedicated initializer module(s) (e.g. `auth.initializer.ts`) for anything the app must finish before first navigation.

Guest markets-only lives under [`docs/project-plans/privileges-and-preferences.md`](../../../../docs/project-plans/privileges-and-preferences.md) (privilege/capability work), not the app shell.

## Decision log

- **Keep nested layout routes** — root `RouterOutlet` selects shell (`BaseLayout` vs `AuthLayout`); shell outlet selects features. Hard-coding BaseLayout in `AppComponent` would force UI branching for chrome-free auth.
- **AuthLayout is intentionally minimal** this pass — no brand chrome; page components keep their own UI.
- **Alerts stay out of layout hosts** — domain lifecycle follows auth bootstrap, not BaseLayout/AuthLayout.
- **AuthLayout routes listed before BaseLayout** — so BaseLayout’s `**` catch-all does not swallow `/login`, `/register`, `/banned`.
