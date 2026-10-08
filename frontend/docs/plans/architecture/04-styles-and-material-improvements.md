# Styles and Material — improvements

**Review:** [`../../review/architecture/04-styles-and-material.md`](../../review/architecture/04-styles-and-material.md)  
**Current UI SoT (to be replaced):** [`../../TRADING_UI_CONTEXT.md`](../../TRADING_UI_CONTEXT.md)  
**Target SoT:** [`../../STYLING_GUIDELINES.md`](../../STYLING_GUIDELINES.md) (create during this work)  
**Modified:** 2026-10-08

Make **real Tailwind CSS** the primary application styling layer. Keep SCSS only for what Tailwind cannot own cleanly. Do not change visual behavior unnecessarily.

Today `tailwind.scss` / `_utilities.scss` are **hand-rolled SCSS helpers**, not the Tailwind npm package. This work installs Tailwind and removes that parallel utility framework.

Apply [`.cursor/rules/ponytail.mdc`](../../../../.cursor/rules/ponytail.mdc): **deletion over addition**, fewest files, no parallel utility frameworks, no token/component leftovers “for later.” If Tailwind or Material already covers it, do not keep an SCSS twin.

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
├── _base.scss
├── _fonts.scss
├── _tokens.scss
├── _material-overrides.scss
├── _components.scss
├── tailwind entry          # real Tailwind
└── theme.scss
```

Delete after migration: `_utilities.scss`, fake `tailwind.scss` helpers, and any standalone public partials (`_colors`, `_spacing`, `_radius`, `_typography`, `_elevation`, `_breakpoints`, `_motion`) that are not private `@use` internals of `_tokens` / `theme`.

---

## Per-file definitions (implement against these)

### `_fonts.scss`

**Owns:** font face / font import only (e.g. Google Fonts URL for IBM Plex Sans + Space Grotesk).

**Does not own:** type scale, weights used in UI, line-heights, or utility classes — those come from tokens + Tailwind.

### `_tokens.scss`

**Owns:** semantic CSS custom properties that the app and Tailwind `@theme` consume (`--color-*`, `--space-*`, `--radius-*`, fonts family vars, motion if still used). Primitive Sass maps may live as **private `@use` inside this file** (or one private partial only `_tokens` uses) — not as a public multi-file token API.

**Does not own:** layout utilities, component look, Material DOM hacks, duplicate aliases for the same role (audit and drop unused/duplicate vars such as redundant `--color-bg` / `--color-text-primary` twins if one name is enough).

**Ponytail:** only tokens referenced by theme, Tailwind bridge, Material overrides, or real templates survive. Unused scales → delete.

### `theme.scss`

**Owns:** `mat.theme` / system theme wiring and light/dark (or `color-scheme`) coordination that Material needs. Reads token values; does not redefine a second palette in templates.

**Does not own:** app layout, utility classes, or per-component styles.

### `_material-overrides.scss`

**Owns:** official `mat.*-overrides` (and related documented Material theming APIs) for density, buttons, form fields, etc.

**Does not own:** feature UI, Tailwind utilities, or selectors on private `.mat-mdc-*` structure outside overrides APIs.

**Ponytail:** override only what the product actually uses; drop unused component override blocks.

### `_base.scss`

**Owns:** minimal global reset / document defaults that Tailwind preflight does not already cover (or deliberate complements): e.g. scrollbar, focus-visible policy, `html`/`body` height if required.

**Does not own:** spacing helpers, flex/grid kits, or “almost utilities.” Prefer Tailwind preflight; do not reimplement a reset library.

### `_components.scss`

**Owns:** only **genuinely reusable global** primitives that cannot be expressed cleanly as Tailwind utilities or Material components (e.g. a shared trade buy/sell affordance or panel chrome that must stay one class for consistency). Each class must have multiple real call sites.

**Does not own:** page layout, one-off feature cards, anything doable with `flex`/`gap`/`text-*`/`bg-*` + tokens, or a second button system beside Material + Tailwind.

**Ponytail:** shrink aggressively. If a class is used once or only wraps utilities, delete it and inline Tailwind in the template.

### Tailwind entry (`tailwind.css` / equivalent)

**Owns:** `@import "tailwindcss"` (or project-standard v4 entry) and `@theme` (or config) that maps Tailwind tokens to `var(--…)` from `_tokens.scss`. Primary place for layout, spacing, typography utilities, responsive variants, and state variants in templates.

**Does not own:** Material internal styling, or a growing set of custom `@utility` clones of the old SCSS helpers (temporary migration aliases only, then delete).

### Component `*.component.scss` (exception, not default)

**Owns:** rare local needs — complex selectors, pseudo-elements, keyframe animations, third-party/chart host tweaks, or Material host bindings that are worse as globals.

**Default:** no component SCSS file; style in the template with Tailwind.

---

## Shrink mandate (ponytail)

During implementation, treat the styling system as something that should get **smaller**:

1. Prefer Tailwind / Material / existing tokens before adding any SCSS.
2. Delete dead CSS variables, unused `_components` classes, and unused Material override sections.
3. Do not keep “compatibility” utility layers after the big-bang conversion.
4. `STYLING_GUIDELINES.md` should document the thin end-state, not the old dual framework.
5. Visual parity ≠ keeping every old class name.

---

## Checklist

- [ ] Install real Tailwind CSS (v4) for Angular 22 / `@angular/build`; wire a Tailwind entry into the global styles pipeline
- [ ] Bridge Tailwind theme (colors, spacing, radius, fonts, breakpoints as needed) to existing semantic CSS variables from `_tokens.scss`
- [ ] Fold standalone token/primitive public entrypoints into `_tokens.scss` (private `@use` only); delete leftover public partials
- [ ] Audit tokens: remove unused/duplicate CSS variables; keep one name per semantic role where possible
- [ ] Inventory SCSS utility class names; map to Tailwind; no permanent custom `@utility` clone of `_utilities.scss`
- [ ] Big-bang: convert shell, shared, and feature templates to Tailwind; no `.component.scss` by default (escape hatches per file definitions above)
- [ ] Delete `_utilities.scss` and fake Tailwind SCSS helpers; shrink `_components.scss` and `_material-overrides.scss` to only live call sites
- [ ] Visual parity gate (dark default; light if exercised): shell, markets, trading, auth, dialogs, forms — no intentional redesign
- [ ] **Create [`docs/STYLING_GUIDELINES.md`](../../STYLING_GUIDELINES.md)** with per-file ownership, Tailwind-first rules, shrink/ponytail rules, and merged product language from [`TRADING_UI_CONTEXT.md`](../../TRADING_UI_CONTEXT.md) (density, semantic P&L colors, fonts, dark-first, form outline/error rules, anti-purple, etc.)
- [ ] Retire [`TRADING_UI_CONTEXT.md`](../../TRADING_UI_CONTEXT.md) (delete or stub redirect); update `learn2trade.mdc`, `material-guide.mdc`, `FILE_STRUCTURES.md`, `README.md`, and review pointers

## Decision log

- **Real Tailwind, not SCSS “Tailwind-style” helpers** — install the package; remove the parallel utility framework.
- **CSS-variable bridge** — `_tokens.scss` remains the runtime SoT for semantic values; Tailwind and Material both consume `var(--…)`.
- **Big-bang migration** — convert and delete SCSS utilities in one effort; visual parity is the gate.
- **No Tailwind on Material internals** — keep official `mat.*-overrides` / `mat.theme` only.
- **Per-file definitions above are the implementation contract** — if it is not listed under Owns, it does not go in that file.
- **Ponytail / shrink** — end state has fewer lines and fewer global classes than today; deletion is success.
- **`STYLING_GUIDELINES.md` replaces `TRADING_UI_CONTEXT.md`** — one SoT for mechanics + preserved trading UI language.
- **Implementation plan later** — this page is the improvement tracker; a detailed superpowers implementation plan can follow when execution starts.
