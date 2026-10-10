# Tailwind Defaults Styles Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete utility Sass maps, keep theme colors + folded typography, migrate the app to Tailwind default spacing/radius/shadow/motion, clean component SCSS, and remove `TRADING_UI_CONTEXT.md`.

**Architecture:** `_theme-colors.scss` is the only private Sass map. `_tokens.scss` emits color and typography CSS vars only. Layout scale comes from Tailwind defaults. Component templates own layout; component SCSS is escape hatch only.

**Tech Stack:** Angular 22, Tailwind CSS v4, Sass, Material 3 overrides.

**Spec:** `frontend/docs/superpowers/specs/2026-10-10-tailwind-defaults-styles-cleanup-design.md`

## Global Constraints

- Accept small visual drift when mapping old aliases to Tailwind defaults
- Keep shell `768` and table `600` as plain numbers in `layout-breakpoints.ts` only
- No `.mat-mdc-*` or `::ng-deep` in `*.component.scss` — scoped tweaks go in `_components.scss`
- Do not invent a new SCSS utility layer
- Do not stage unrelated dirty files unless they are required for this pass (`package-lock` only if install changed)
- Commit after each task when the task says Commit
- Working directory: `c:\Users\gyene\dev\personal\Learn2Trade`

### Alias → Tailwind default map (templates)

| Old | New |
| --- | --- |
| `*-xxs` | `*-1` (4px) |
| `*-xs` | `*-2` (8px) |
| `*-sm` | `*-3` (12px) |
| `*-md` | `*-4` (16px) |
| `*-lg` | `*-6` (24px) |
| `*-xl` | `*-8` (32px) |
| `*-xxl` | `*-12` (48px) |

Applies to `p`, `m`, `mx`, `my`, `mt`, `mb`, `ml`, `mr`, `px`, `py`, `pt`, `pb`, `pl`, `pr`, `gap`.

### SCSS `var(--space-*)` → rem (when rule stays in SCSS)

| Var | Rem |
| --- | --- |
| `--space-xxs` / `--space-4` | `0.25rem` |
| `--space-xs` / `--space-8` | `0.5rem` |
| `--space-sm` | `0.75rem` |
| `--space-md` / `--space-16` | `1rem` |
| `--space-lg` / `--space-24` | `1.5rem` |
| `--space-xl` / `--space-32` | `2rem` |
| `--space-xxl` / `--space-48` | `3rem` |

Radius: `var(--radius-sm|md)` → `0.375rem`; `lg` → `0.5rem`; `xl` → `0.75rem`.  
Shadows: `var(--shadow-*)` → Tailwind-equivalent literals or `none`/border-only where already border-first.  
Transitions: `var(--transition-fast)` → `0.15s ease`; `normal` → `0.2s ease`; `slow` → `0.3s ease`.

### File map

| Path | Responsibility |
| --- | --- |
| `src/styles/_theme-colors.scss` | Renamed color map |
| `src/styles/_tokens.scss` | Color + typography CSS vars only |
| `src/styles/theme.scss` | Material theme; `@use 'theme-colors'`; typography from tokens; literal corner radii |
| `src/styles/_material-overrides.scss` | `@use 'theme-colors'`; literal shape radii |
| `src/styles/_components.scss` | No breakpoints mixin; rem/literal spacing |
| `src/styles/_base.scss` | No `--space-*`; rem/literal |
| `src/styles/tailwind.css` | `@source "../app"`; `@theme` colors + fonts only |
| `docs/TRADING_UI_CONTEXT.md` | Delete |
| `*.component.html` / `*.component.scss` | Tailwind defaults; shrink SCSS |

---

### Task 1: Styles foundation + delete stub doc

**Files:**
- Delete: `frontend/docs/TRADING_UI_CONTEXT.md`
- Delete: `frontend/src/styles/_breakpoints.scss`, `_elevation.scss`, `_radius.scss`, `_spacing.scss`, `_motion.scss`, `_typography.scss`, `_colors.scss`
- Create: `frontend/src/styles/_theme-colors.scss` (contents of old `_colors.scss`)
- Modify: `frontend/src/styles/_tokens.scss`, `theme.scss`, `_material-overrides.scss`, `_components.scss`, `_base.scss`, `tailwind.css`, `layout-breakpoints.ts`

**Interfaces:**
- Consumes: typography values from old `_typography.scss` (fold into tokens as Sass vars)
- Produces: `theme-colors` module name for `@use 'theme-colors'`; tokens export typography vars for theme.scss via `@use 'tokens' as tokens` **or** theme keeps typography maps inlined in `_tokens.scss` and theme `@use 'tokens'` only for maps that tokens forwards — simplest: put typography maps at top of `_tokens.scss` and also `@forward` them, OR duplicate: theme `@use 'tokens'` and tokens defines `$family-base` etc. as public members. **Use:** `_tokens.scss` defines `$family-base`, `$family-brand`, weights, `$type-scale` (rename from `$scale` to avoid clash) and mixins; `theme.scss` does `@use 'tokens' as tokens` and `@use 'theme-colors' as colors` (alias colors for less churn in map.get calls). Actually keep `@use 'theme-colors' as colors` so existing `colors.$primary` calls work.

- [ ] **Step 1: Rename colors and fold typography**

Copy `_colors.scss` → `_theme-colors.scss` (same content). Delete `_colors.scss`.

In `_tokens.scss`:
- Replace `@use 'colors'` with `@use 'theme-colors' as colors`
- Remove `@use` of spacing, radius, elevation, motion, breakpoints, typography
- Paste typography maps from `_typography.scss` into `_tokens.scss` (as `$family-base`, `$family-brand`, weights, `$type-scale`)
- In `_static-tokens`, replace `typography.$…` with local vars; replace `typography.$scale` with `$type-scale`
- Remove the `@each` loops that emit `--space-*`, `--radius-*`, `--shadow-*`, `--z-index-*`, `--transition-*`, `--breakpoint-*`
- Keep color + font CSS var emissions and neu vars

- [ ] **Step 2: Update theme + material-overrides**

`theme.scss`:
- `@use 'theme-colors' as colors;`
- `@use 'tokens' as tokens;` (for typography)
- Remove `@use 'typography'` and `@use 'radius'`
- Replace `typography.$…` with `tokens.$…` / `tokens.$type-scale`
- Replace corner radii with literals: `6px`, `8px`, `12px`, `14px`, `16px` (former xs/md/lg/xl/2xl)

`_material-overrides.scss`:
- `@use 'theme-colors' as colors;`
- Remove `@use 'radius'`
- Replace every `map.get(radius.$scale, md)` with `8px`, `sm`→`6px`, `lg`→`12px`

- [ ] **Step 3: Fix `_components.scss` and `_base.scss`**

- Remove `@use 'breakpoints'` from `_components.scss`
- Replace `@include breakpoints.up(sm) { … }` with `@media (min-width: 600px) { … }` (table compact threshold — keep exact 600)
- Replace all `var(--space-*)`, `var(--radius-*)`, `var(--transition-*)`, `var(--shadow-*)` per mapping tables above

Same var replacements in `_base.scss` (headings margins etc.)

- [ ] **Step 4: Slim `tailwind.css`**

```css
/* Real Tailwind v4 — theme bridges semantic colors/fonts from _tokens.scss.
   Skip preflight: Material + _base.scss own document defaults. */
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);

@source "../app";

@theme inline {
  --color-primary: var(--color-primary);
  --color-muted: var(--color-text-muted);
  --color-surface: var(--color-surface);
  --color-accent: var(--color-accent);
  --color-success: var(--color-success);
  --color-danger: var(--color-danger);
  --color-error: var(--color-danger);
  --color-warning: var(--color-warning);
  --color-border: var(--color-border);

  --default-border-color: var(--color-border);

  --font-sans: var(--font-family-base);
  --font-display: var(--font-family-accent);
}
```

- [ ] **Step 5: Delete obsolete files + stub doc**

Delete: `_breakpoints.scss`, `_elevation.scss`, `_radius.scss`, `_spacing.scss`, `_motion.scss`, `_typography.scss`, `docs/TRADING_UI_CONTEXT.md`

Update `layout-breakpoints.ts` comments to say values are intentional shell/table thresholds, not CSS tokens.

- [ ] **Step 6: Build**

Run: `cd frontend && npm run build`  
Expected: success (templates may still use `p-md` — those utilities will disappear after `@theme` slim, so **either** complete Task 2 before build **or** temporarily leave spacing bridges until Task 2).  

**Order fix:** Do Task 1 Steps 1–5, then immediately Task 2 template rewrite, then build once. If splitting commits: Task 1 commit may leave broken `p-md` — **combine Task 1+2 in one commit** OR keep spacing `@theme` bridges until Task 2 finishes then remove in Task 1 follow-up.

**Revised:** In Task 1, leave the spacing/radius/shadow `@theme` bridge lines until Task 2 completes; Task 2 ends by removing those bridges and verifying build. Task 1 still deletes Sass maps and stops **emitting** the CSS vars — so bridges would break. Therefore Task 1+2 must be one atomic commit, or Task 1 keeps emitting vars until Task 2 migrates.

**Atomic approach (required):** Complete Task 1 file deletes + Task 2 migrations in one working tree, then one build, then one commit for foundation+templates. Split component SCSS to later tasks.

- [ ] **Step 7: Commit foundation + templates**

After Task 2 steps also done:

```bash
git add frontend/docs/TRADING_UI_CONTEXT.md frontend/src/styles frontend/src/app frontend/src/styles.scss
git commit -m "refactor(styles): Tailwind defaults for layout; theme-colors only"
```

(Delete shows as deletion of TRADING_UI_CONTEXT and maps.)

---

### Task 2: Template alias migration (same commit as Task 1)

**Files:**
- Modify: all `frontend/src/app/**/*.html` (and any inline `host` class strings) using `p-md`, `gap-sm`, etc.

**Interfaces:**
- Consumes: alias map from Global Constraints
- Produces: no semantic spacing utilities in templates

- [ ] **Step 1: Rewrite aliases**

Run ripgrep for `(p|m|gap|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my)-(xxs|xs|sm|md|lg|xl|xxl)` under `frontend/src/app` and replace per table. Also `space-y-md` / `space-x-*` if present.

Known files include login, register, landing HTML; scan all.

- [ ] **Step 2: Verify**

Run: `rg -n "(p|m|gap|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my)-(xxs|xs|sm|md|lg|xl|xxl)\\b" frontend/src/app`  
Expected: no matches.

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`  
Expected: success.

(Commit with Task 1.)

---

### Task 3: Global SCSS consumers + shell/shared component SCSS

**Files:**
- Modify: `_base.scss`, `_components.scss` (if any vars remain), all `core/layout/**/*.scss`, `shared/components/**/*.scss`, and their templates if layout moves to class utilities
- Move any `.mat-mdc-*` from component SCSS into `_components.scss` scoped under host class

**Interfaces:**
- Consumes: rem/literal mapping from Global Constraints
- Produces: no `var(--space|radius|shadow|transition|breakpoint|z-index-*)` in these files

- [ ] **Step 1: Replace deleted vars in layout + shared SCSS**

For each file under `frontend/src/app/core/layout` and `frontend/src/app/shared/components` with those vars: prefer moving spacing/flex to the template with Tailwind; otherwise replace with rem/literals. Delete SCSS files that become empty and remove `styleUrl` from the component.

Special: `data-table.component.scss` `.mat-mdc-*` rules → move into `_components.scss` under `.data-table` or existing host class.

- [ ] **Step 2: Grep gate**

Run: `rg -n "var\\(--(space|radius|shadow|transition|breakpoint|z-index)-" frontend/src/app/core frontend/src/app/shared frontend/src/styles/_base.scss frontend/src/styles/_components.scss`  
Expected: no matches.

- [ ] **Step 3: Build + commit**

```bash
cd frontend && npm run build
git add frontend/src
git commit -m "refactor(styles): clear layout/shared SCSS off deleted token vars"
```

---

### Task 4: Feature component SCSS + templates

**Files:**
- Modify: all `frontend/src/app/features/**/*.{scss,html,ts}` that reference deleted vars or are pure layout SCSS

**Interfaces:**
- Same mapping rules as Task 3

- [ ] **Step 1: Migrate features**

Same approach as Task 3 for `features/` (dashboard, markets, trading, portfolio, auth, system, watchlist, landing).

- [ ] **Step 2: Grep gate whole src**

Run: `rg -n "var\\(--(space|radius|shadow|transition|breakpoint|z-index)-" frontend/src`  
Expected: no matches.

Run: `rg -n "@use '(spacing|radius|elevation|motion|breakpoints|typography|colors)'" frontend/src/styles`  
Expected: no matches (only `theme-colors` / `tokens`).

- [ ] **Step 3: Build + commit**

```bash
cd frontend && npm run build
git add frontend/src
git commit -m "refactor(styles): migrate feature SCSS to Tailwind defaults"
```

---

### Task 5: Docs alignment

**Files:**
- Modify: `frontend/docs/STYLING_GUIDELINES.md`, `FILE_STRUCTURES.md`, `plans/architecture/04-styles-and-material-improvements.md`, `review/architecture/04-styles-and-material.md`, `.cursor/rules/material-guide.mdc`, `.cursor/rules/learn2trade.mdc`
- Modify: `frontend/docs/superpowers/specs/2026-10-10-tailwind-defaults-styles-cleanup-design.md` status → Approved / Implemented

**Interfaces:**
- Consumes: final tree from Task 1
- Produces: docs match disk

- [ ] **Step 1: Update stack tables**

STYLING_GUIDELINES stack must list `_theme-colors.scss`, tokens = color + typography, Tailwind defaults for spacing/radius/shadow/breakpoints. Remove claims that private maps include spacing/radius. Keep Material selectors section.

FILE_STRUCTURES tree + section 11 match. Architecture plan target tree + checklist checkboxes for this pass. material-guide file table rows match (no `_utilities.scss` cleanup required beyond accuracy if touching the row).

- [ ] **Step 2: Commit**

```bash
git add frontend/docs frontend/.cursor
git commit -m "docs(frontend): align style docs with Tailwind-defaults tree"
```
