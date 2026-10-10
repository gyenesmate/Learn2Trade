# Task 3 report: layout + shared SCSS → Tailwind

## Status

**Complete.** Layout and shared components migrated per brief; grep gate clean for deleted token vars in `core/layout` and `shared/components`; build passes.

## Commit

`83fdf5b15f8905076e39375d762d69ae3b7c048b` — `refactor(styles): Tailwind layout for shell and shared components`

## Build

```
Application bundle generation complete. [~5.3s]
Output: frontend/dist/client
Warning: crypto-card.component.scss exceeds 4 kB budget by ~525 B (pre-existing).
```

## SCSS files deleted (8)

- `frontend/src/app/core/layout/auth-layout/auth-layout.component.scss`
- `frontend/src/app/core/layout/landing-layout/landing-layout.component.scss`
- `frontend/src/app/core/layout/lecture-layout/lecture-layout.component.scss`
- `frontend/src/app/core/layout/navbar/global-search/global-search.component.scss`
- `frontend/src/app/core/layout/navbar/global-search/components/search-result/search-result.component.scss`
- `frontend/src/app/shared/components/page-header/page-header.component.scss`
- `frontend/src/app/shared/components/base-dialog/base-dialog.component.scss`
- `frontend/src/app/shared/components/confirmation-dialog/confirmation-dialog.component.scss`

## What changed

- **Shell layouts:** auth, landing, lecture — flex/min-height/background/padding → Tailwind on `<main>`; `styleUrl` removed.
- **Navbar / global search:** toolbar and bottom nav layout → Tailwind; host sizing on `app-global-search`; `.nav-item` hover states kept in component SCSS.
- **Shared:** page-header, base-dialog, confirmation-dialog → Tailwind; data-table shell (header, loading, empty, scroll) → Tailwind; `.mat-mdc-*` table cell rules moved to `frontend/src/styles/_components.scss` under `app-data-table`.
- **Kept escape-hatch SCSS:** `base-layout` (skip link + sidebar collapse), `sidebar` (collapsed `:host` rules), `data-table` (sticky columns, filters, mobile table), `navbar` (`.nav-item`), `app-snackbar`, `notification-stack` (keyframes/mask), `crypto-card`, `crypto-chart`.

## Concerns

1. **`app-global-search .global-search__field`** still sets private `--mat-form-field-*` vars in `_components.scss` (relocated from component SCSS). STYLING_GUIDELINES prefer `mat.form-field-overrides`; a follow-up could use a density override instead.
2. **`bg-[var(--color-background)]`** used where `@theme` does not expose `--color-background` as a Tailwind color token (same pattern as existing `text-[var(--color-text-primary)]`).
3. **crypto-card** style budget warning unchanged; not in Task 3 scope.
4. **Feature SCSS** (`features/**`) still on old patterns — Task 4.
