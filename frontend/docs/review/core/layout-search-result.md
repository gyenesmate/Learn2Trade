> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Search result row

**Source:** `frontend/src/app/core/layout/navbar/global-search/components/search-result/search-result.component.ts`, `search-result.component.html`

## Role

Presentational row for one `SearchResult` inside a `mat-option`: optional leading icon, title, optional muted description. No service or router dependencies—the parent autocomplete owns selection and navigation.

## API surface

- **Input:** `result` — required `SearchResult`
- **Template:** flex row; `@if` for icon and description

## Connected to

- [layout-global-search](./layout-global-search.md) — passes `[result]` per option.
- `@core/search/search.types.ts` — `SearchResult` shape (title, description, icon, action).

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — `input.required`, OnPush presentational component.
- [`TRADING_UI_CONTEXT.md`](../../TRADING_UI_CONTEXT.md) — `text-muted` for secondary line.
