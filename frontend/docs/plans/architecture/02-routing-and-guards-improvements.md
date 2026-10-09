# Routing and guards — improvements

**Review:** [`../../review/architecture/02-routing-and-guards.md`](../../review/architecture/02-routing-and-guards.md)  
**Project plan:** [`../../../../docs/project-plans/privileges-and-preferences.md`](../../../../docs/project-plans/privileges-and-preferences.md)  
**Modified:** 2026-10-10  
**Spec:** [`../../superpowers/specs/2026-10-10-multi-shell-routing-auth-design.md`](../../superpowers/specs/2026-10-10-multi-shell-routing-auth-design.md)

This FE surface is driven by the cross-cutting **privileges and preferences** project for admin/capability work. Multi-shell routing + session redirector landed per the design spec.

## Checklist

- [x] Prefixed shells: Landing `/`, Auth `/auth`, App `/app`, Learn `/learn` + placeholder pages/layouts
- [x] Guest allowlist for `/app/markets`; other `/app/*` and `/learn` require login
- [x] `AuthRedirectorService` on logged-in → logged-out (logout / timeout / 401)
- [x] Compatibility redirects from old flat URLs; update SoT (`FILE_STRUCTURES.md`, `learn2trade.mdc`)
- [ ] Replace `adminGuard` / `is_admin` route gating with a privilege-based guard (required privilege code(s) on protected admin-style routes)
- [ ] Drive sidebar / nav / search visibility from privileges instead of `UserMe.is_admin`
- [ ] Clear privilege cache on logout / session clear (via `PrivilegesService`; see project abstract)
- [ ] Add groups-management route(s) gated by `groups:manage` (exact path/code at implementation)

## Decision log

- **Multi-shell + auth redirector** — see [`2026-10-10-multi-shell-routing-auth-design.md`](../../superpowers/specs/2026-10-10-multi-shell-routing-auth-design.md).
- **Defer privilege model** — data model, backend-only authz, migration off `is_admin` live in [`docs/project-plans/privileges-and-preferences.md`](../../../../docs/project-plans/privileges-and-preferences.md).
- **No client-trusted privilege lists on API requests** — FE `hasPrivilege` is UX only; backend remains authoritative.
