> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Page header

**Source:** `frontend/src/app/shared/components/page-header/page-header.component.ts`

## Role

Consistent feature-page heading with a required title, optional primary/secondary actions, and an automatic back button for URLs not reachable directly from the sidebar.

## API surface

- Required input: `title`.
- Input: `actions: PageHeaderAction[]`; each action has a label, optional icon/variant/disabled state, and feature-owned callback.
- `showBack` derives from router navigation events and `SIDEBAR_REACHABLE_ROUTES`.
- `goBack` delegates to Angular `Location.back()`.

## Connected to

- Dashboard, Portfolio, Trading, profile editing, market editing, and Testing Ground.
- `page-header.const.ts`, `.types.ts`, and `.utils.ts` hold route policy, action contracts, and path matching.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — `toSignal`, computed state, standalone OnPush components, and signal inputs.
- [`material-guide.mdc`](../../../.cursor/rules/material-guide.mdc) — icon button labeling and flat/stroked action hierarchy.
- [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) and [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) — shared page chrome and feature-owned callbacks.

## Notes / smells

- Actions are tracked by label, so labels should be unique within one header.
