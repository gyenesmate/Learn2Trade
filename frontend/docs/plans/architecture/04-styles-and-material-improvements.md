# Styles and Material — improvements

**Review:** `[../../review/architecture/04-styles-and-material.md](../../review/architecture/04-styles-and-material.md)`  
**SoT:** `[../../STYLING_GUIDELINES.md](../../STYLING_GUIDELINES.md)`  
**Modified:** 2026-10-10

Make **real Tailwind CSS** the primary application styling layer. Keep SCSS only for what Tailwind cannot own cleanly. Do not change visual behavior unnecessarily.

Today `tailwind.scss` / `_utilities.scss` were **hand-rolled SCSS helpers**; they are deleted. Real Tailwind v4 is installed.

Apply `[.cursor/rules/ponytail.mdc](../../../../.cursor/rules/ponytail.mdc)`: **deletion over addition**, fewest files, no parallel utility frameworks.

## Responsibility split

```text
Design tokens / themes / Material theme
→ SCSS (_tokens, theme, _material-overrides, _base, _fonts)

Application UI styling
→ Tailwind utilities (@theme maps to CSS vars)

Angular Material / generated DOM
→ SCSS overrides only (no Tailwind on .mat-mdc-*)

Rare global primitives that cannot be utilities
→ _components.scss (keep tiny)
```

## Target `src/styles/`

```text
styles/
├── _theme-colors.scss      # only private Sass map (was _colors)
├── _tokens.scss            # color + typography CSS vars (typography folded in)
├── theme.scss
├── _material-overrides.scss
├── _components.scss
├── _base.scss
├── _fonts.scss
└── tailwind.css            # real Tailwind; @theme → colors + fonts only
```

Deleted map partials: `_breakpoints`, `_elevation`, `_radius`, `_spacing`, `_motion`, `_typography`. Spacing, radius, shadow, and motion live in Tailwind defaults and templates.

---

## Per-file definitions

See `[STYLING_GUIDELINES.md](../../STYLING_GUIDELINES.md)` — that doc is the live ownership contract.

---

## Checklist

- [x] Install real Tailwind CSS (v4) for Angular 22 / `@angular/build`; wire a Tailwind entry into the global styles pipeline
- [x] Bridge Tailwind `@theme` (colors + fonts) to semantic CSS variables from `_tokens.scss`; spacing/radius/shadow use Tailwind defaults
- [x] Rename `_colors.scss` → `_theme-colors.scss`; fold typography into `_tokens.scss`; delete utility map partials (`_spacing`, `_radius`, …)
- [x] Inventory SCSS utility class names; map to Tailwind; no permanent custom `@utility` clone of `_utilities.scss` (form cards use `max-w-[400px]` / `max-w-[500px]` — named spacing collides with `max-w-sm/md`)
- [x] Big-bang: templates already used Tailwind-compatible classes; delete SCSS utility layer; default new UI = template Tailwind (component SCSS = escape hatch)
- [x] Delete `_utilities.scss` and fake Tailwind SCSS helpers; keep live `_components.scss` primitives (btn, panel, trade, price-*)
- [x] **Create** `[docs/STYLING_GUIDELINES.md](../../STYLING_GUIDELINES.md)` with per-file ownership, Tailwind-first rules, shrink/ponytail rules, and merged product language
- [x] Retire `TRADING_UI_CONTEXT.md` (deleted; product language lives in `[STYLING_GUIDELINES.md](../../STYLING_GUIDELINES.md)`); update `learn2trade.mdc`, `material-guide.mdc`, `FILE_STRUCTURES.md`, `README.md`, and review pointers
- [x] Component SCSS / template pass: Tailwind defaults for layout; remove deleted-map `@use` and `--space-*` bridges from the styles foundation
- [x] Align live docs + Cursor rules with final `src/styles/` tree (Task 5)

## Decision log

- **Real Tailwind, not SCSS “Tailwind-style” helpers** — install the package; remove the parallel utility framework.
- **CSS-variable bridge** — `_tokens.scss` remains the runtime SoT for semantic values; Tailwind and Material both consume `var(--…)`.
- **Skip Tailwind preflight** — Material + `_base.scss` own document defaults (`theme` + `utilities` layers only).
- `@source "../app"` — Angular templates are outside the CSS module graph; scan explicitly.
- **Form max-widths use arbitrary values** — named `--spacing-sm/md` would make `max-w-sm/md` = 12px/16px.
- **No Tailwind on Material internals** — official `mat.*-overrides` first; `.mat-mdc-`* only in `_material-overrides.scss` and `_components.scss` as `STYLING_GUIDELINES.md` describes.
- `STYLING_GUIDELINES.md` **replaces** `TRADING_UI_CONTEXT.md` — one SoT for mechanics + preserved trading UI language (stub doc deleted).
- **Tailwind defaults for layout scale** — `@theme` bridges colors/fonts only; no `--space-`* / `--radius-`* / `--shadow-*` emission from `_tokens.scss`.

