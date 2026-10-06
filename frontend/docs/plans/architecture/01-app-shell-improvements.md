# App shell — improvements

**Review:** [`../../review/architecture/01-app-shell.md`](../../review/architecture/01-app-shell.md)  
**Status:** done  
**Spec:** [`../../superpowers/specs/2026-10-07-app-shell-auth-layout-design.md`](../../superpowers/specs/2026-10-07-app-shell-auth-layout-design.md)

## Do now

- [x] Remove unused `AppComponent.title = 'cryptowatcher-app'` and the matching unit test
- [x] Add minimal `AuthLayoutComponent` (centered host + `<router-outlet />` only)
- [x] Move `/login`, `/register`, `/banned` under AuthLayout (no sidebar/navbar)
- [x] Keep feature routes under `BaseLayoutComponent`
- [x] Stop calling `PriceAlertsService.start()` from `AppComponent`; arm after `AuthService.bootstrap()` in `app.config.ts`
- [x] Update `FILE_STRUCTURES.md` + `learn2trade.mdc` for dual layout

## Decision log

- **Keep nested layout routes** — root `RouterOutlet` selects shell (`BaseLayout` vs `AuthLayout`); shell outlet selects features. Hard-coding BaseLayout in `AppComponent` would force UI branching for chrome-free auth.
- **AuthLayout is intentionally minimal** this pass — no brand chrome; page components keep their own UI.
- **Alerts stay out of layout hosts** — domain lifecycle follows auth bootstrap, not BaseLayout/AuthLayout.
- **AuthLayout routes listed before BaseLayout** — so BaseLayout’s `**` catch-all does not swallow `/login`|/register|/banned.

## Future

- [ ] **Guest markets-only:** allow entering as guest (mechanism TBD) with capability limited to **viewing markets** (and related read-only market UI). No invest/sell, alerts CRUD, watchlist mutations, portfolio funds, or admin. Guests still use **BaseLayout** for markets; AuthLayout remains for full login/register. Likely needs a capability/guard matrix beyond today’s `authGuard` public-route list.
