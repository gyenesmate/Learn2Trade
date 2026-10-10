# Styling guidelines

Primary UI/UX and styling reference for the Learn2Trade frontend.

When ambiguous, prefer: **consistency → readability → information hierarchy → compactness → decoration.**

## Stack

| Layer | Owns |
| --- | --- |
| `src/styles/_theme-colors.scss` | Private Sass color map (`@use` from `_tokens` / `theme` only) |
| `src/styles/_tokens.scss` | Semantic CSS variables for **color** and **typography** (`--color-*`, `--font-*`, type scale) |
| `src/styles/theme.scss` | `mat.theme` / light–dark coordination |
| `src/styles/_material-overrides.scss` | Global Material look. Official `mat.*-overrides` first. `.mat-mdc-*` when the mixin cannot express a style for every instance of a control (buttons, inputs, and the same kind of control). |
| `src/styles/_base.scss` | Document defaults Tailwind preflight does not own (scrollbars, focus, headings) |
| `src/styles/_fonts.scss` | Font face / import only |
| `src/styles/_components.scss` | Rare global primitives (`.btn*`, `.app-panel*`, `.trade-*-button`, `.price-up/down`) and component-specific `.mat-mdc-*` tweaks nested under that component or primitive class. No bare `.mat-mdc-*` that hits every instance. |
| `src/styles/tailwind.css` | Real Tailwind v4; `@theme inline` bridges **colors + fonts** to token CSS vars; spacing, radius, and shadow use Tailwind defaults |
| `*.component.scss` | Exception only: complex selectors, keyframes, chart hosts. No `.mat-mdc-*`. No `::ng-deep`. |

**Default for new UI:** Tailwind utilities in the template. Do not add a component SCSS file unless Tailwind cannot express it cleanly.

**Do not** put Tailwind classes on Material internal DOM. **Do not** grow a second utility framework in SCSS.

## Material selectors

Prefer `mat.<component>-overrides`. Use `.mat-mdc-*` only when that mixin cannot express the style.

| Need | File | What is allowed |
| --- | --- | --- |
| Every instance of a Material control (buttons, inputs, and the same kind of control) | `_material-overrides.scss` | `mat.*-overrides` first. `.mat-mdc-*` when the mixin cannot express that global style. |
| One component or one app primitive (`.btn*`, `.app-panel*`, `.trade-*-button`, `.price-up/down`, or a component class) | `_components.scss` | `.mat-mdc-*` nested under that component or primitive class. No bare `.mat-mdc-*` that hits every instance. |
| A feature or shared component stylesheet | `*.component.scss` | Complex selectors, keyframes, and chart hosts. No `.mat-mdc-*`. No `::ng-deep`. |

A component that needs a Material DOM tweak gets a scoped rule in `_components.scss`. `!important` and private `--mat-*` component variables outside the overrides APIs are forbidden everywhere.

## Product language

- **Fonts:** IBM Plex Sans (UI), Space Grotesk (brand accents).
- **Brand:** trading-terminal blue (`--color-primary` / `#3b82f6`). No purple accents in UI.
- **Semantic P&L:** green = up/profit/buy (`--color-success` / `.price-up`); red = down/loss/sell (`--color-danger` / `.price-down`). Never decorative red/green.
- **Theme:** dark-first; light is first-class (not a naive invert). Surface hierarchy: background → panel → raised → hover.
- **Density:** trading workstation — prefer Tailwind spacing steps that map to ~8 / 12 / 16 / 24px (`gap-2`, `gap-3`, `p-4`, `p-6`). Avoid marketing whitespace.
- **Numbers:** `tabular-nums` on prices, %, balances, P&L, table numeric columns; right-align numeric cells.
- **Forms:** `mat-form-field` appearance `outline`; on error, label + `mat-error` only (border stays theme-neutral / focus-primary). Validate after blur (`touched`) and submit.
- **Buttons:** `.btn` / `.btn-primary` / `.btn-secondary` for app chrome; `.trade-buy-button` / `.trade-sell-button` for buy/sell. Heights ~36px.
- **Panels:** reuse `.app-panel` / `__header` / `__body` — do not reinvent card chrome per feature.
- **Page headers:** `<app-page-header>` when a title + actions row is needed; Markets may omit it for density.
- **Feel:** professional trading terminal + Material interaction quality — not admin template, marketing site, or meme crypto UI.

## Tailwind bridge

**Layout scale:** use Tailwind’s built-in spacing, radius, shadow, and motion utilities (`p-4`, `gap-2`, `rounded-lg`, `shadow-sm`, …). Do not reintroduce semantic alias utilities (`p-md`, `gap-sm`, …) or `--space-*` / `--radius-*` / `--shadow-*` token bridges.

`@theme inline` in `tailwind.css` maps **semantic colors and fonts** to token vars, e.g.:

| Utility examples | Source |
| --- | --- |
| `text-primary`, `bg-primary` | `--color-primary` |
| `text-muted` | `--color-text-muted` |
| `bg-surface`, `border` | `--color-surface`, `--color-border` |
| `font-sans`, `font-display` | `--font-family-base`, `--font-family-accent` |
| Form card widths | Prefer `max-w-[400px]` / `max-w-[500px]` over `max-w-sm/md` when pixel widths matter |

Use `min-w-0 min-h-0` (not a custom `min-0`) for nested flex/grid shrink safety.

Preflight is **off** (theme + utilities only) so Material and `_base.scss` keep document defaults.

## Layout rules

- Compose page/panel structure with Tailwind flex/grid (`flex`, `flex-col`, `grid`, `gap-*`, `items-*`, `justify-*`, `w-full`, `overflow-*`).
- Grid for macro workspaces; flex inside panels.
- Prefer tokens over arbitrary hex in templates or component SCSS.
- Do not communicate P&L by color alone — use signs, arrows, or labels (`↑ +2.31%`).

## Shrink mandate

1. Prefer Tailwind / Material / existing tokens before new SCSS.
2. Delete dead CSS variables, unused `_components` classes, and unused Material override blocks.
3. No parallel SCSS utility kit.
4. Visual parity ≠ keeping every old class name.

## Related docs

- Placement: [`FILE_STRUCTURES.md`](./FILE_STRUCTURES.md)
- Material mechanics: [`.cursor/rules/material-guide.mdc`](../.cursor/rules/material-guide.mdc)
- Live streams: [`CRYPTO_WEBSOCKETS.md`](./CRYPTO_WEBSOCKETS.md)
