> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Not found

**Source:** `frontend/src/app/features/system/not-found/not-found.component.ts`

## Role

Minimal fallback for every unmatched child route. It explains that the requested page is absent or removed and provides a router link back to the public Markets page.

## API surface

- Route: final `**` catch-all inside `BaseLayoutComponent`.
- No component state or services.
- `/markets` is the sole recovery action.

## Connected to

- `app.routes.ts` must keep the wildcard after every explicit route.
- Angular `RouterLink` handles recovery without a full-page reload.

## Rules that apply

- [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — fallback pages belong in the system feature.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`agents.md`](../../../../agents.md) — standalone route and repository conventions.
