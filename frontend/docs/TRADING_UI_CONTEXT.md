# Trading Platform UI — Design & Implementation Context

Primary UI/UX reference for the Learn2Trade frontend.

When ambiguous, prefer: **consistency → readability → information hierarchy → compactness → decoration.**

## Project adaptations

This repo implements the design language with **Angular 22 + Angular Material + SCSS**.

| Spec concept | Learn2Trade location |
| --- | --- |
| Design tokens / CSS variables | `src/styles/_tokens.scss`, `_colors.scss`, `_spacing.scss`, `_radius.scss`, `_elevation.scss`, `_typography.scss` |
| Material theme + overrides | `src/styles/theme.scss`, `_material-overrides.scss` |
| Layout utilities (flex / grid) | `src/styles/_utilities.scss` via `tailwind.scss` |
| Semantic panels / trade buttons | `src/styles/_components.scss`, `_utilities.scss` |
| Global reset / focus / scrollbars | `src/styles/_base.scss` |
| App shell (sidebar + navbar) | `src/app/core/layout/` (`base-layout`, `sidebar`, `navbar`) |
| Shared UI primitives | `src/app/shared/components/` |
| Features | `src/app/features/` |
| Structure / placement rules | `docs/FILE_STRUCTURES.md` |
| Cursor / agent rules | `.cursor/rules/`, `agents.md` |

**Layout:** always prefer the Tailwind-style flex/grid utilities in `tailwind.scss` / `_utilities.scss` (`flex`, `grid`, `gap-*`, `items-*`, `justify-*`, `w-full`, …) over one-off layout rules in component SCSS. Keep semantic tokens for color, surfaces, and radius — do not invent arbitrary hex in utilities.

**Do not install the Tailwind CSS npm package** unless product explicitly asks; this project ships the utility *system* as SCSS helpers with Tailwind-compatible class names.

**Typography:** use **IBM Plex Sans** (UI) and **Space Grotesk** (brand accents) — already loaded. Do not switch to Inter/Roboto unless product asks.

**Primary brand:** trading-terminal blue (`#3b82f6`) with semantic green/red for P&L only. Dark theme is the default trading experience.

**Form fields:** default `mat-form-field` appearance is **outline** (border + `var(--radius-md)`). On error, only the **label** and `mat-error` text use danger color — the field border stays theme-neutral / focus-primary. Show validation after blur (`touched`) as well as after submit (`markAllAsTouched`).

Reproduce the **design language, hierarchy, spacing, density, and component relationships** — not pixel-perfect mockups.

---

## 1. Purpose

Visual system, layout rules, component behavior, responsiveness, and implementation conventions for a modern professional trading interface:

- clean, readable, modular, responsive, consistent, accessible
- suitable for dense real-time financial data
- dark-first, with a first-class light theme

---

## 2. Core design principles

### Information density without clutter

Use strong hierarchy, compact consistent spacing, thin borders, clear panels, muted secondary text, tabs, collapsible areas, and scrollable internal regions.

Critical information (price, P&L, order state, position side, movement, errors, warnings) must be immediately distinguishable.

### Semantic colors

Never hardcode financial meaning as raw hex in components.

```scss
color: var(--color-success); // profit / up / long / buy
color: var(--color-danger);  // loss / down / short / sell
```

The same tokens must work in dark and light themes.

---

## 3. Color system

### Brand & semantic

```scss
--color-primary: #3b82f6;
--color-primary-hover: #2563eb;
--color-primary-active: #1d4ed8;

--color-secondary: #8b5cf6;

--color-success: #10b981;
--color-success-soft: rgba(16, 185, 129, 0.12);

--color-danger: #ef4444;          // alias: --color-error
--color-danger-soft: rgba(239, 68, 68, 0.12);

--color-warning: #f59e0b;
--color-warning-soft: rgba(245, 158, 11, 0.12);

--color-info: #38bdf8;
```

| Token role | Usage |
| --- | --- |
| Primary blue | nav selection, primary actions, active tabs, focus |
| Success green | profit, price up, long, buy, success toasts |
| Danger red | loss, price down, short, sell, destructive confirm |

Do not use red/green decoratively.

### Dark theme (primary)

```scss
[data-theme='dark'], body.theme-dark {
  --color-background: #0b0f14;   // also --color-bg
  --color-surface: #111827;
  --color-surface-raised: #151e2e;
  --color-surface-hover: #1a2434;
  --color-border: #1f2937;
  --color-border-strong: #334155;
  --color-text-primary: #f9fafb; // also --color-text
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;   // also --color-muted
  --color-text-disabled: #64748b;
  --color-input-background: #0f172a;
  --color-overlay: rgba(0, 0, 0, 0.65);
}
```

Surface hierarchy: background → panel → raised → hover. Avoid pure black.

### Light theme

```scss
[data-theme='light'], body.theme-light {
  --color-background: #f6f8fb;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-hover: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text-primary: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  --color-text-disabled: #94a3b8;
  --color-input-background: #ffffff;
  --color-overlay: rgba(15, 23, 42, 0.35);
}
```

Light is not a simple invert — keep contrast between page, panels, controls, and rows.

---

## 4. SCSS integration + layout utilities

```text
src/styles/
├── _tokens.scss          # CSS variables
├── _colors.scss          # Sass maps feeding tokens + Material
├── theme.scss            # mat.theme + system overrides
├── _material-overrides.scss
├── _components.scss      # buttons, cards, tags, trade actions, neu
├── _utilities.scss       # Tailwind-style flex/grid + semantic text helpers
├── tailwind.scss         # layout utilities entry (SCSS helpers)
├── _base.scss
├── _typography.scss
├── _spacing.scss         # 4px base scale
├── _radius.scss
├── _elevation.scss
├── _motion.scss          # prefer 120–200ms interactions
└── _fonts.scss
```

Prefer layout utilities for structure:

```html
<div class="flex flex-col gap-md min-0">
  <div class="flex items-center justify-between gap-sm">…</div>
  <div class="grid grid-cols-2 gap-md">…</div>
</div>
```

Prefer semantic shells for surfaces:

```html
<div class="app-panel">
  <div class="app-panel__header">…</div>
  <div class="app-panel__body">…</div>
</div>
```

Avoid arbitrary hex in templates/component SCSS when a token exists. Avoid duplicating `display: flex` / `grid` in component SCSS when a utility class already exists.

---

## 5. Spacing (4px base)

```text
4  micro | 8 related | 12 compact | 16 standard | 20 large | 24 section | 32 major | 48+ page
```

Trading UIs should mostly use **8 / 12 / 16 / 24**. Avoid marketing-site whitespace.

CSS vars: `--space-xxs` … `--space-xxl` and numeric `--space-4`, `--space-8`, …

---

## 6. Typography scale

```text
Page heading     24 / 32 / 600
Section heading  18 / 26 / 600
Panel heading    14 / 20 / 600
Body             14 / 20 / 400
Small            12 / 18 / 400
Caption          11 / 16 / 400
Market number    14 / 20 / 500
Primary price    20–24 / 28 / 600
```

Reserve 32px+ for balances, portfolio summaries, major prices, empty/onboarding.

---

## 7. Numeric data

```scss
.tabular-nums,
.numeric {
  font-variant-numeric: tabular-nums;
}
```

Apply to prices, %, volumes, balances, P&L, sizes, numeric table columns. Right-align numeric cells.

---

## 8. Radius & shadows

```text
Controls 6px | Inputs/buttons 8px | Cards 10–12px | Panels 12px | Dialogs 12–16px
```

Dark theme: prefer surface contrast + borders over heavy shadows.  
Light theme: subtle `--shadow-sm` / `--shadow-md`. Dialogs: `--shadow-lg`.

---

## 9. Buttons

| Kind | Use |
| --- | --- |
| Primary (blue) | Confirm, Save, Apply, Add, Continue |
| Secondary | Outlined / border, secondary actions |
| `trade-buy-button` | Buy — success green |
| `trade-sell-button` | Sell — danger red |
| Destructive | Prefer neutral → confirm dialog; avoid bright red everywhere |

Heights: **36–40px**. Radius 8px.

---

## 10. Application shell

```text
┌────────────┬──────────────────────────┐
│ Sidebar    │ Top navbar (52–60px)     │
│ 200–240px  ├──────────────────────────┤
│ (56–64px   │ Main workspace           │
│ collapsed) │                          │
└────────────┴──────────────────────────┘
```

Sidebar items ~40–44px tall; selected = soft primary background. Logo compact (icon + wordmark / icon-only when collapsed).

Top bar: search (future Ctrl/Cmd+K), market status, portfolio summary, notifications, theme switch, user.

Mobile (&lt;768): task-focused — bottom nav or drawer; do not miniaturize the full desktop terminal.

---

## 11. Layout (flex / grid utilities — required)

**Always** compose page and panel layout with the Tailwind-style helpers from `src/styles/_utilities.scss` (loaded via `tailwind.scss`):

| Concern | Prefer |
| --- | --- |
| Macro workspace | `grid`, `grid-cols-*`, `trading-workspace` |
| Inside panels / forms / auth shells | `flex`, `flex-col`, `items-*`, `justify-*`, `gap-*` |
| Shrink / scroll safety | `min-0`, `min-w-0`, `overflow-auto` / `overflow-hidden` |
| Width constraints | `w-full`, `max-w-sm` / `max-w-md` / `max-w-lg` |

CSS **Grid** for macro layout; **Flexbox** inside panels. Chart gets remaining space (`minmax(0, 1fr)` via workspace helpers). Avoid absolute positioning for primary content. Nested flex/grid hosts need `min-0`.

Do **not** reintroduce one-off `display: flex` / `display: grid` blocks in feature SCSS when an equivalent utility exists (see login/register as the reference pattern).

Recommended large desktop columns:

```css
grid-template-columns: minmax(0, 1fr) 280px 280px;
```

Breakpoints guidance:

| Width | Behavior |
| --- | --- |
| ≥1440 | Full workstation |
| 1024–1439 | Collapse secondary into tabs |
| 768–1023 | Icon sidebar / drawer |
| &lt;768 | Market header, chart, buy/sell, positions/orders |

---

## 12. Panels

Reuse `app-panel` / `<app-panel>`:

- shared surface, border, radius, header (~44–48px), title ~13–14px/600
- header: title | actions/tabs
- body scrolls independently when needed

Do not reinvent card styling per feature.

---

## 13. Tables

- Row 36–44px, header 36–40px, sticky muted headers
- Text left; numbers/actions right
- Prefer one contextual action + overflow menu — not button farms
- Scroll only the table body; paginator outside scroll region
- Real-time streams (trades, order book): bounded scroll, not pagination

---

## 14. Status chips & order book

Soft backgrounds:

```scss
.status-long { color: var(--color-success); background: var(--color-success-soft); }
.status-short { color: var(--color-danger); background: var(--color-danger-soft); }
```

Order book: Price / Size / Total; asks = danger, bids = success; depth as low-opacity row backgrounds.

---

## 15. Forms, tabs, mode selectors

- Controls 36–40px; compact labels; muted helpers (`Available: …`)
- Tabs: primary text + 2px indicator; muted inactive
- Modes (`Spot|Futures`, `Market|Limit`): segmented controls, not nav tabs

---

## 16. Angular Material

Material provides behavior/a11y/overlays. App theme provides look.

Centralize overrides in `_material-overrides.scss` via `mat.*-overrides`. Prefer density for compact trading controls. Avoid `::ng-deep` sprawl.

Override buttons, form fields, select, menu (~36–40px items), tabs, table, paginator, dialog, snackbar (bottom-right).

---

## 17. Interaction, motion, a11y

- States: default / hover / active / focus-visible / disabled
- Motion: ~120–200ms; subtle only
- Do not communicate profit/loss/buy/sell by color alone — use signs, arrows, labels (`↑ +2.31%`)

---

## 18. Loading / empty / error

- Per-panel skeletons; never block the whole workspace for one failure
- Compact empty copy inside panels
- Panel-level errors with Retry

---

## 19. Architecture (target)

```text
Design tokens → Global theme → Reusable UI primitives → Feature components → Pages
```

Layout and shared primitives live under `core/layout/` and `shared/components/`; features under `features/`. See `docs/FILE_STRUCTURES.md`.

Shared UI: appearance & interaction. Feature code: domain, API, trading logic.

UI-local state only: tabs, sidebar collapsed, timeframe, visibility, sort/filter/page.

---

## 20. Cursor implementation rules

1. Reuse shared components before creating new ones.  
2. No arbitrary colors when a semantic token exists.  
3. No theme-specific hardcoding in feature SCSS.  
4. Support dark and light.  
5. Layout via `_utilities.scss` / `tailwind.scss` flex+grid helpers; theme files for Material overrides.  
6. No inline styles except dynamic values.  
7. Avoid `::ng-deep`. Keep page SCSS small (surface/brand only; layout in utilities).  
8. Grid for workspaces; Flex for panel internals — using utility classes.  
9. Fixed table headers/paginators; scroll bodies.  
10. Do not clone desktop layout onto mobile.  
11. Prefer Angular Material behavior before custom widgets.  
12. Keep business logic out of generic UI primitives.
13. Form fields: outline + radius tokens; errors after blur; error color on label/message only.

---

## 21. Visual target

**Should feel like:** professional trading terminal + modern fintech + Material interaction quality.

**Should not feel like:** generic admin template, marketing site, oversized SaaS dashboard, gaming/meme crypto UI.

Key traits: dark-first, excellent light theme, compact density, modular workspace, chart priority, precise tables, semantic colors, thin borders, restrained shadows, consistent spacing.

---

## 22. Definition of done

- Matches trading design language; dark + light work  
- No unnecessary arbitrary colors; Material matches app style  
- Major breakpoints OK; tables overflow correctly  
- Numbers tabular; P&L semantic; focus visible  
- Loading/empty states; shared primitives reused  
- Dense professional workstation look without visual noise  

This document is the primary UI reference. Update it when the product language evolves.
