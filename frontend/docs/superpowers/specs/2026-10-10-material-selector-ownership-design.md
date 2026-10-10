# Material selector ownership — design

**Date:** 2026-10-10  
**Status:** Pending review  
**Related:** `frontend/docs/STYLING_GUIDELINES.md`, `frontend/.cursor/rules/material-guide.mdc`, `frontend/docs/FILE_STRUCTURES.md`

---

## 1. Purpose

Say where a `.mat-mdc-*` selector may live, so a component can get a Material DOM tweak without `::ng-deep` in its own stylesheet.

Official `mat.<component>-overrides` stays the default. A `.mat-mdc-*` selector is allowed only when that mixin cannot express the style, and only in the two global style files below.

---

## 2. Goals / non-goals

### Goals

- Update the stack table and add a Material-selector rule in `frontend/docs/STYLING_GUIDELINES.md`.
- Point `frontend/.cursor/rules/material-guide.mdc` at that rule instead of banning `.mat-mdc-*` outright.
- Give `_material-overrides.scss` and `_components.scss` the same ownership in `frontend/docs/FILE_STRUCTURES.md` section 11.
- Update the Material bullet in `frontend/.cursor/commands/code-review.md` so review does not still forbid the selectors the guidelines allow.

### Non-goals

- Moving or rewriting any SCSS, including the `.table-row--filter .mat-mdc-checkbox` block in `_material-overrides.scss` and the `.mat-mdc-*` rules in `data-table.component.scss`.
- Editing `frontend/docs/review/architecture/04-styles-and-material.md` or `frontend/docs/plans/architecture/04-styles-and-material-improvements.md`. Those stay historical.
- Adding a new SCSS partial.
- Cleaning unrelated stale names in `material-guide.mdc` (`_utilities.scss`, `tailwind.scss`).

---

## 3. Ownership

| Need | File | What is allowed |
| --- | --- | --- |
| Every instance of a Material control (buttons, inputs, and the same kind of control) | `src/styles/_material-overrides.scss` | `mat.*-overrides` first. `.mat-mdc-*` when the mixin cannot express that global style. |
| One component or one app primitive (`.btn*`, `.app-panel*`, `.trade-*-button`, `.price-up/down`, or a component class) | `src/styles/_components.scss` | `.mat-mdc-*` nested under that component or primitive class. No bare `.mat-mdc-*` that hits every instance. |
| A feature or shared component stylesheet | `*.component.scss` | Complex selectors, keyframes, and chart hosts. No `.mat-mdc-*`. No `::ng-deep`. |

If a component needs a Material DOM tweak, the scoped rule goes in `_components.scss`. Tailwind classes stay off Material internal DOM. `!important` and private `--mat-*` component variables outside the overrides APIs stay forbidden everywhere.

---

## 4. Text to land

### `STYLING_GUIDELINES.md`

Replace the `_material-overrides.scss` stack cell (today: “Official `mat.*-overrides` only — never style private `.mat-mdc-*` in features”) with: global Material look; official `mat.*-overrides` first; `.mat-mdc-*` allowed when the mixin cannot express a style for every instance of a control.

Replace the `_components.scss` stack cell so it keeps the rare primitives and adds component-specific `.mat-mdc-*` tweaks scoped under the component or primitive class.

Replace the `*.component.scss` stack cell so “Material host tweaks” is removed. The cell lists complex selectors, keyframes, and chart hosts, and states that `.mat-mdc-*` and `::ng-deep` are not used there.

Add a short **Material selectors** subsection that repeats the table in section 3. Keep the existing sentence that forbids Tailwind on Material internal DOM.

### `material-guide.mdc`

- Opening line: private `.mat-mdc-*` is limited to the two global files in `STYLING_GUIDELINES.md`. Feature and component stylesheets do not style Material’s private DOM.
- File-role row for `_material-overrides.scss`: global Material look, `mat.*-overrides` plus `.mat-mdc-*` when the mixin cannot.
- File-role row for `_components.scss`: app primitives and component-scoped `.mat-mdc-*`. Leave the other files named on that same table row unchanged.
- **Don’t** bullets: do not put `.mat-mdc-*`, `::ng-deep`, or `!important` in `*.component.scss` or feature stylesheets; do not set private `--mat-*` variables outside the overrides APIs. The following bullet says feature and component stylesheets must not depend on Material internal class names, and that the two global files may use `.mat-mdc-*` only as the styling guidelines describe.

### `FILE_STRUCTURES.md` section 11

- `_material-overrides.scss`: global Material look, `mat.*-overrides`, plus `.mat-mdc-*` when the mixin cannot express a style for every instance of a control.
- `_components.scss`: global primitives (buttons, panels, chips, price-up/down) and component-scoped `.mat-mdc-*` tweaks.
- Keep “No global Material overrides inside feature SCSS.” Add that a component-specific `.mat-mdc-*` rule goes in `_components.scss`, not in the component stylesheet.

### `code-review.md`

Replace “no private `.mat-mdc-*` / `::ng-deep` hacks” with: official `mat.*-overrides` first; `.mat-mdc-*` only in `_material-overrides.scss` or `_components.scss` as `STYLING_GUIDELINES.md` describes; no `.mat-mdc-*` or `::ng-deep` in component stylesheets.

---

## 5. Verification

No SCSS diff and no test run. After the edits, the four documents name the same split: global look in `_material-overrides.scss`, component-scoped tweaks in `_components.scss`, neither selector nor `::ng-deep` in `*.component.scss`.
