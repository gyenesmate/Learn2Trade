> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Styles and Material

**Sources:** `frontend/src/styles.scss`, `frontend/src/styles/*`, `frontend/angular.json` (global `styles` entry), `frontend/src/app/app.config.ts` (`MAT_FORM_FIELD_DEFAULT_OPTIONS`)

## Role

Global look-and-feel is centralized under `src/styles/`. Angular loads `tailwind.css` then `styles.scss` (tokens, Material theme, overrides, base, components, fonts). Feature and shared components should use **semantic CSS variables** and **Tailwind utilities** rather than ad hoc Material DOM overrides. Default form fields are **outline** appearance app-wide via `provide` in `app.config.ts`. Live SoT: [`STYLING_GUIDELINES.md`](../../STYLING_GUIDELINES.md).

## Style entrypoints

| File / partial | Role |
| --- | --- |
| `_tokens.scss` (+ private `_colors`, `_spacing`, …) | Design tokens → CSS custom properties |
| `theme.scss` | `mat.theme`, dark trading palette |
| `_material-overrides.scss` | Official `mat.*-overrides` mixins (density, buttons, fields) |
| `_base.scss` | Reset, focus, scrollbars |
| `_components.scss` | Shared semantic panels / trade actions / price-up |
| `tailwind.css` | Real Tailwind v4 + `@theme` bridge to token vars |
| Component `*.scss` | Escape hatch only; color from tokens |

## Connected to

- Shell layout SCSS — `base-layout`, `navbar`, `sidebar` compose structure; colors from tokens.
- Shared Material usage — dialogs, tables, form fields across `shared/components` and features.

## Rules that apply

- [`STYLING_GUIDELINES.md`](../../STYLING_GUIDELINES.md) — dark-first terminal, semantic green/red, density, form error styling, typography (IBM Plex Sans / Space Grotesk).
- [`material-guide.mdc`](../../../.cursor/rules/material-guide.mdc) — theme via `mat.theme` / overrides APIs only; no `.mat-mdc-*` hacks or private DOM styling.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) — tokens + overrides globally; layout via utilities.

## Diagram

```mermaid
flowchart TB
  SCSS[src/styles.scss]
  T[_tokens + primitives]
  TH[theme.scss]
  MO[_material-overrides.scss]
  B[_base.scss]
  C[_components.scss]
  TW[tailwind.scss]

  SCSS --> T
  SCSS --> TH
  SCSS --> MO
  SCSS --> B
  SCSS --> C
  SCSS --> TW
  TH --> App[Global CSS on document]
  MO --> App
  T --> App
```
