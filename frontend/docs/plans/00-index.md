# Plans mirror — cherry-pick tracking

This tree mirrors [`docs/review/`](../review/00-index.md). As you walk the snapshot review, capture implementation changes here so you can see where you left off.

**Related:** cross-cutting backend + frontend project plans live in [`docs/project-plans/`](../../../docs/project-plans/) (e.g. [`privileges-and-preferences.md`](../../../docs/project-plans/privileges-and-preferences.md)).

## Naming

For each review page `docs/review/<path>/<name>.md`, create:

`docs/plans/<path>/<name>-improvements.md`

## Page conventions

Each `*-improvements.md` file must include:

1. **`Modified:`** — last meaningful edit date (`YYYY-MM-DD`). Update whenever checklist items or decision log change.
2. **One checklist** — a single `## Checklist` section with every actionable item (current work and future). Use `- [ ]` / `- [x]` only; do not split into separate “Do now” / “Future” lists. Abstract-only pages may omit the checklist until implementation planning starts; index status is then `abstract`.
3. **Optional sections** — links (review, spec, project abstract), decision log, notes — below the checklist (or as the body when still abstract).

When you check items off, update `Modified:` and refresh this index **Status** column (count from that file’s checklist).

## Status

Progress = checked items ÷ total checklist items in that file. Use **abstract** when there is no checklist yet.

| Improvements page | Status |
| --- | --- |
| [`architecture/01-app-shell-improvements.md`](./architecture/01-app-shell-improvements.md) | **6/7** (86%) |
| [`architecture/02-routing-and-guards-improvements.md`](./architecture/02-routing-and-guards-improvements.md) | **0/5** (0%) |
| [`architecture/03-state-and-data-improvements.md`](./architecture/03-state-and-data-improvements.md) | abstract |
| [`architecture/04-styles-and-material-improvements.md`](./architecture/04-styles-and-material-improvements.md) | **0/10** (0%) |
