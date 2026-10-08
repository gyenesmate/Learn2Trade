# Routing and guards — improvements

**Review:** [`../../review/architecture/02-routing-and-guards.md`](../../review/architecture/02-routing-and-guards.md)  
**Project plan:** [`../../../../docs/project-plans/privileges-and-preferences.md`](../../../../docs/project-plans/privileges-and-preferences.md)  
**Modified:** 2026-10-08

This FE surface is driven by the cross-cutting **privileges and preferences** project. Do not invent a parallel authz model here — implement routing/guard fallout from that plan.

## Checklist

- [ ] Replace `adminGuard` / `is_admin` route gating with a privilege-based guard (required privilege code(s) on protected admin-style routes)
- [ ] Drive sidebar / nav / search visibility from privileges instead of `UserMe.is_admin`
- [ ] Clear privilege cache on logout / session clear (via `PrivilegesService`; see project abstract)
- [ ] Add groups-management route(s) gated by `groups:manage` (exact path/code at implementation)
- [ ] Update SoT docs (`FILE_STRUCTURES.md`, `learn2trade.mdc`, review snapshot if refreshed) after privilege guards land

## Decision log

- **Defer to project plan** — data model, backend-only authz, migration off `is_admin`, guest markets-only, and preferences further-planning live in [`docs/project-plans/privileges-and-preferences.md`](../../../../docs/project-plans/privileges-and-preferences.md).
- **No client-trusted privilege lists on API requests** — FE `hasPrivilege` is UX only; backend remains authoritative.
