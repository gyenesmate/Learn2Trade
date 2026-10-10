# Tailwind defaults & styles cleanup — design

**Date:** 2026-10-10  
**Status:** Implemented  
**Related:** `frontend/docs/plans/architecture/04-styles-and-material-improvements.md`, `frontend/docs/STYLING_GUIDELINES.md`

---

## 1. Purpose

Finish the styles/Material improvement pass by making **Tailwind’s built-in scales** the source of spacing, radius, shadow, motion, and breakpoints. Keep Sass only for theme colors, typography (folded into tokens), Material theming, rare global primitives, and document defaults. Delete the `TRADING_UI_CONTEXT.md` stub. Migrate components so layout lives in templates and unused component SCSS goes away.

---

## 2. Goals / non-goals

### Goals

- Delete `frontend/docs/TRADING_UI_CONTEXT.md` (replaced by `STYLING_GUIDELINES.md`).
- Delete Sass maps: `_breakpoints.scss`, `_elevation.scss`, `_radius.scss`, `_spacing.scss`, `_motion.scss`.
- Rename `_colors.scss` → `_theme-colors.scss`.
- Fold `_typography.scss` into `_tokens.scss` (no separate typography partial).
- Stop emitting `--space-*`, `--radius-*`, `--shadow-*`, `--transition-*`, `--breakpoint-*`, `--z-index-*` from tokens.
- Slim `tailwind.css` `@theme` to semantic **colors** and **fonts** only (no spacing/radius/shadow bridges to deleted vars).
- Migrate templates and remaining SCSS off semantic aliases (`p-md`, `gap-sm`, …) and deleted CSS vars to **Tailwind defaults**. Accept small visual drift.
- Keep `layout-breakpoints.ts` as plain `768` / `600` constants (no Sass/CSS token coupling).
- Refactor `*.component.scss` per `STYLING_GUIDELINES.md`: Tailwind in templates; delete empty/unused SCSS; escape hatch only for complex selectors, keyframes, chart hosts; no `.mat-mdc-*` / `::ng-deep` in component SCSS (scoped Material tweaks → `_components.scss`).
- Update live docs and the architecture plan checklist/target tree to match.

### Non-goals

- Intentional visual redesign or light-theme polish beyond “builds and looks roughly right.”
- Full unused-color token audit (may remain an open checklist item).
- New SCSS utility framework or custom `@utility` clones of deleted maps.
- Changing Material override APIs or product color/brand language.

---

## 3. Target `src/styles/`

```text
styles/
├── _theme-colors.scss      # only private Sass map (was _colors)
├── _tokens.scss            # color + typography CSS vars (typography folded in)
├── theme.scss              # mat.theme
├── _material-overrides.scss
├── _components.scss        # rare primitives + scoped .mat-mdc-*
├── _base.scss              # document defaults (no preflight)
├── _fonts.scss             # font face / import only
└── tailwind.css            # real Tailwind; @theme → colors + fonts
```

`styles.scss` continues to `@use` / `@include` the public partials and import `tailwind.css`. All `@use` paths updated for the rename and deleted maps. `_components.scss` must not `@use 'breakpoints'`.

---

## 4. Migration rules

| Today | After |
| --- | --- |
| `p-md` / `gap-sm` / `mt-lg` (bridged) | Nearest Tailwind default spacing (`p-4`, `gap-2`, …) |
| `var(--space-*)` | Template utilities preferred; if SCSS remains, literal `rem`/`px` or Tailwind theme() — not deleted vars |
| `rounded-*` / `var(--radius-*)` | Tailwind default radius |
| `shadow-*` / `var(--shadow-*)` | Tailwind default shadows |
| `var(--transition-*)` | `transition-*` / `duration-*` or literal times in leftover SCSS |
| `@include breakpoints.up/down` | Tailwind `md:` / `lg:` etc., or exact `768`/`600` media queries only where shell/table JS thresholds require it |

**Keep as CSS vars:** `--color-*`, `--font-*` (and related type sizes/weights still needed by `_base` / Material / components).

**Material selectors:** unchanged from the Material selector ownership contract in `STYLING_GUIDELINES.md`.

---

## 5. Execution order (one session)

1. Docs stub deletion + styles foundation (rename colors, fold typography, delete five maps, slim tokens/`@theme`/`_base`/`_components`, update imports).
2. Template alias rewrite across the app.
3. Component SCSS pass (~34 files): move layout to Tailwind, delete dead rules/files, relocate any `.mat-mdc-*` into `_components.scss`.
4. Align `STYLING_GUIDELINES.md`, `FILE_STRUCTURES.md`, Cursor rules, and `04-styles-and-material-improvements.md`.

Build must pass after step 1 and after step 3.

---

## 6. Verification

- `npm run build` succeeds.
- Grep: no `@use` of deleted map names; no emissions or consumers of `--space-*` / `--radius-*` / `--shadow-*` / `--transition-*` / `--breakpoint-*` / `--z-index-*`; no `p-md` / `gap-sm` / `mt-lg` style aliases in templates.
- Spot-check dark: shell, markets, trading, auth, dialog, form — drift OK, no intentional redesign.

---

## 7. Docs

| Doc | Change |
| --- | --- |
| `TRADING_UI_CONTEXT.md` | Delete |
| `STYLING_GUIDELINES.md` | New stack ownership; Tailwind defaults for layout scale |
| `FILE_STRUCTURES.md`, `material-guide.mdc`, `learn2trade.mdc` | Tree + pointers |
| `04-styles-and-material-improvements.md` | Target tree + checklist for this pass |
