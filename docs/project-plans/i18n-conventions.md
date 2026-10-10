# i18n conventions

**Status:** implemented (checklists below)  
**Modified:** 2026-10-10  
**SoT after implementation:** [`frontend/docs/I18N_CONVENTIONS.md`](../../frontend/docs/I18N_CONVENTIONS.md)  

Cross-cutting frontend project: introduce application-wide i18n with **`@ngx-translate/core` (v18, Angular 18–22)** + HTTP loader, one JSON catalog per language, project conventions (`FEATURE.KEY`), navbar language control, relocate static assets into `public/`, and SoT docs in [`frontend/docs/I18N_CONVENTIONS.md`](../../frontend/docs/I18N_CONVENTIONS.md).

**Related FE review:** [`frontend/docs/review/architecture/03-state-and-data.md`](../../frontend/docs/review/architecture/03-state-and-data.md) (signals / presentation state)  
**Related project plan:** [`privileges-and-preferences.md`](./privileges-and-preferences.md) (future preferences can store locale; do not block i18n on that design)  
**Related shell:** language control lands in [`navbar`](../../frontend/src/app/core/layout/navbar/) (right-side actions).  
**Related static assets:** today `src/assets/` (e.g. favicon SVG); modern Angular serves static files from `public/` — relocate into the [public folder structure](#public-folder-structure) as part of this plan.

---

## Goals

- Depend on **`@ngx-translate/core`** and **`@ngx-translate/http-loader`** (v18.x for Angular 22). Configure via standalone `provideTranslateService` / `provideTranslateHttpLoader` — **not** legacy `TranslateModule.forRoot`.
- Bootstrap language with **`provideAppInitializer`** as ngx-translate documents (`addLangs` + return `use(...)`), colocated under `core/initializers/`.
- Keep a thin project layer under `src/app/core/i18n/` for config, language persistence, and missing-key handling — **do not** reimplement a custom translate pipe/service.
- One JSON file per language under `public/i18n/` (`en.json`, `hu.json`, `de.json`); **not** split by feature file. Served at `/i18n/{lang}.json` (Angular `public` asset root).
- Relocate remaining static files from `src/assets/` into `public/` using the [public folder structure](#public-folder-structure) (create category folders as needed; do not keep a parallel `src/assets/`).
- Navbar language selector: globe + code + chevron → Material `mat-menu` with native names and acronyms (see UI design section).
- Keys follow `FEATURE.KEY` with `UPPER_SNAKE_CASE` leaf keys; avoid deep nesting and layout-based names.
- Templates use ngx-translate’s `| translate` as the primary API; language changes update UI **without** full reload.
- Business/domain services return **semantic state**, not translated sentences; presentation maps state → keys (+ interpolation params).
- Locale-aware dates/numbers/percentages/currencies via `Intl` / Angular locale tools, with explicit exceptions for trading display consistency.
- After implementation, **`frontend/docs/I18N_CONVENTIONS.md`** is the descriptive SoT for agents and humans.

## Non-goals (yet)

- Translating market symbols, ticker names, API identifiers, or pairs such as `BTC/USDT`.
- A full ICU / CLDR pluralization engine (use the intentional `order(s)` convention for now).
- Backend-stored locale preference (can later plug into privileges/preferences); start with client persistence.
- Translating Material internal chrome beyond what we own (paginator intl can be phased).
- A second custom translation API beside ngx-translate (no home-grown pipe that wraps the same thing).

---

## Checklist — Frontend

### Prerequisite — static assets → `public/`

Modern Angular apps put static files under `public/` (already wired in `angular.json`). Relocate before or with i18n catalogs so everything shares one root. Follow the [public folder structure](#public-folder-structure) — create category folders when content appears; empty placeholders are optional.

- [x] Move existing `frontend/src/assets/**` into the matching `public/` category (e.g. `learn2trade.svg` → `public/icons/` or `public/icons/custom/`)
- [x] Establish `public/` layout per the structure below (`images/…`, `icons/…`, `fonts/`, `i18n/`, root `favicon.ico` / optional `manifest.webmanifest` / `robots.txt`)
- [x] Remove the separate `src/assets` asset entry from `frontend/angular.json` (keep the existing `public` glob; files under `public/` are copied to the app root as-is)
- [x] Update references that pointed at `src/assets` or `/assets/...` (e.g. `index.html` favicon → `/icons/...` or root `/favicon.ico`; docs/`FILE_STRUCTURES.md` / `learn2trade.mdc`)
- [x] Confirm build serves relocated files at their new public URLs and that `public/i18n/{lang}.json` is available at `/i18n/{lang}.json` with no extra `angular.json` output remapping

### Core subsystem

- [x] Add deps: `@ngx-translate/core@^18` and `@ngx-translate/http-loader@^18` (compatible with Angular 22)
- [x] Wire `provideTranslateService({ lang, fallbackLang: 'en', loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }) })` in `app.config.ts` (nest loader **inside** the config object per ngx-translate v18 rules)
- [x] Add `src/app/core/i18n/` with only what the project needs beyond the library:
  - `i18n.config.ts` — available languages, default/fallback (`en`), storage key, loader path constants
  - `i18n.types.ts` — `LanguageCode` union, etc.
  - `language.persistence.ts` or small `app-language.service.ts` — read/write `localStorage`, call `TranslateService.use()`, set `document.documentElement.lang`
  - optional `missing-translation.handler.ts` — selected → fallback already handled by ngx-translate; warn in `ngDevMode` when key still missing
- [x] Seed `public/i18n/en.json`, `hu.json`, `de.json` (`en` complete baseline; others may be partial)
- [x] **Language initializer (required — follow ngx-translate docs):** register a dedicated `provideAppInitializer(...)` that injects `TranslateService` (and the thin persistence helper if needed), calls `addLangs([...])`, then `use(savedOrDefault)` and **returns** that Observable/Promise so Angular waits before first paint. Prefer a factory under `src/app/core/initializers/` (same pattern as `app.initializer.ts`), not constructor/`ngOnInit` hydration in a component. Do **not** `location.reload()` on later language switches
- [x] Import `TranslatePipe` (and directive only if needed) in standalone components that translate; prefer pipe as primary template API

### Shell UX

- [x] Add the **Language Selector** on the **navbar right** (near theme / user menu) per [Language Selector UI Design](#language-selector-ui-design); switching language uses ngx-translate `TranslateService.use(lang)` (+ persistence helper) and updates UI immediately
- [x] Translate sidebar labels (`sidebar.const.ts`) and navbar duplicates (bottom nav / menu) from the same keys under e.g. `NAV.*` / `COMMON.*`
- [x] Translate global-search placeholder, empty/loading states, and search group labels (`search.utils.ts`)

### Migration (by area — convert literals to keys + JSON)

- [x] Shared: `confirmation-dialog` defaults, `data-table` empty/loading/filter/Yes|No, snackbar defaults / dismiss, crypto-card aria/tooltips that are app copy
- [x] `NotificationService` default titles (`Success`, `Error`, …) + migrate call-site message strings to keys (or key + params) via `TranslateService.instant` / `get` at presentation sites
- [x] Auth: login / register / banned templates + validation messages
- [x] Markets: `markets.const.ts`, toolbar, movers empty copy, crypto admin form labels
- [x] Trading: `trading.const.ts`, invest / alert dialogs, confirm-sell dialog data, trading notifications
- [x] Portfolio / edit-profile: const labels, table column titles, form/theme labels, notifications
- [x] Dashboard / analytics-card / watchlist dialog / system not-found
- [x] Price-alerts snackbar action labels (`View`, `Stop`); keep symbol/price as params, not translated words glued incorrectly

### Locale-aware formatting

- [x] Thread active language (or `Intl` locale tag) into `number.util.ts` formatters; stop hardcoding `'en-US'` for general money/decimal display **or** document intentional fixed trading locale
- [x] Prefer `DatePipe` / `DecimalPipe` / `Intl` with the active locale for dates, times, numbers, percentages, currencies where language-sensitive
- [x] Document and keep **trading-consistent** rules where required: `formatPrice` digit tiers for sub-dollar prices; pair symbols unchanged; compact volume `K`/`M` policy called out in `I18N_CONVENTIONS.md`

### Cleanup / SoT pointers

- [x] Prefer returning translation keys from component `computed()` for dynamic status text; ban `instant('A') + ' ' + x` sentence assembly
- [x] Update `learn2trade.mdc` / `FILE_STRUCTURES.md` to point at `core/i18n`, ngx-translate usage, `public/` static assets (no `src/assets`), and `frontend/docs/I18N_CONVENTIONS.md`
- [x] Link FE plans index “Related” to this project plan if useful

## Checklist — Documentation

- [x] Create [`frontend/docs/I18N_CONVENTIONS.md`](../../frontend/docs/I18N_CONVENTIONS.md) after the system works — SoT covering ngx-translate setup, `provideAppInitializer` language bootstrap, project `core/i18n` helpers, pipe usage, navbar language selector, JSON location under `public/i18n/`, `FEATURE.KEY` rules, nesting exceptions, interpolation (`{{param}}`), computed-text rules, pluralization convention, fallbacks, locale formatting, add-key / add-language how-tos, translate vs do-not-translate, correct/incorrect examples
- [x] Core rule in that doc: *Business logic provides semantic data and state. The presentation layer selects translation keys and parameters. Translation JSON files own the final user-facing wording.*

---

## Target architecture

```text
frontend/package.json
  @ngx-translate/core ^18
  @ngx-translate/http-loader ^18

frontend/src/app/core/i18n/
├── i18n.config.ts              # langs, fallback, storage key, /i18n/ prefix
├── i18n.types.ts               # LanguageCode, …
├── app-language.service.ts     # persist + use() + document.lang (thin wrapper)
└── missing-translation.handler.ts  # optional; dev warning only

frontend/src/app/core/initializers/
├── app.initializer.ts          # existing auth/alerts bootstrap
└── i18n.initializer.ts         # provideAppInitializer: addLangs + use(saved|default)

frontend/src/app/app.config.ts
  provideTranslateService({ … provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }) … })
  provideAppInitializer(initializeI18n)   # per ngx-translate docs; await use()
```

### Public folder structure

Canonical layout for static files (URLs mirror paths under `public/`). Follow this when adding assets; subfolders may start empty until needed.

```text
frontend/
├── public/
│   ├── images/
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   ├── illustrations/
│   │   └── placeholders/
│   │
│   ├── icons/
│   │   └── custom/
│   │
│   ├── fonts/
│   │
│   ├── i18n/
│   │   ├── en.json
│   │   ├── hu.json
│   │   └── de.json
│   │
│   ├── favicon.ico
│   ├── manifest.webmanifest
│   └── robots.txt
```

| Path | Use |
| --- | --- |
| `images/` | Raster/vector imagery by role (logos, backgrounds, illustrations, placeholders) |
| `icons/` | App / custom icons (e.g. brand SVG); Material icons stay via Material, not here |
| `fonts/` | Self-hosted font files if/when needed |
| `i18n/` | One JSON catalog per language |
| Root files | `favicon.ico`, optional PWA `manifest.webmanifest`, `robots.txt` |

Do **not** add a project-owned `translate.pipe.ts` / `translate.service.ts` that duplicates ngx-translate. Use library `TranslateService` + `TranslatePipe`.

```mermaid
flowchart LR
  Init[provideAppInitializer i18n]
  UI[Templates and computed keys]
  Pipe[TranslatePipe ngx-translate]
  Lib[TranslateService ngx-translate]
  AppLang[AppLanguageService]
  JSON[public/i18n/*.json]
  LS[localStorage language]

  Init -->|addLangs + use| Lib
  Init --> LS
  UI --> Pipe --> Lib
  AppLang -->|use lang| Lib
  AppLang --> LS
  Lib -->|HttpLoader| JSON
```

---

## Language Selector UI Design

Place the control in the existing navbar right-side actions (beside the theme toggle), using **Angular Material + Tailwind + project theme tokens** only — no extra UI libraries.

### Desktop trigger (navbar)

- Clickable control (not a bare icon-only mystery button): **globe** Material icon + current language code in uppercase (`EN` / `HU` / `DE`) + dropdown chevron (`arrow_drop_down` or equivalent).
- Sit in `navbar-right` next to the theme toggle; reuse toolbar density / gap already used by theme and user menu.
- Styling: semantic tokens must resemble other elements tokens and style (button no border and background color, same color, icon same size). Must look correct in both `theme-dark` and `theme-light`.
- Accessibility: explicit `aria-label` (e.g. “Select language” / translated key once i18n lands), `aria-haspopup="menu"`, `aria-expanded` via `MatMenuTrigger`, focus-visible styles from Material; tooltip optional and must not replace the label.

### Menu interaction

- Trigger opens an Angular Material **`mat-menu`** listing available languages from `i18n.config.ts`.
- Selecting an item: call `AppLanguageService` / `TranslateService.use(lang)`, persist, update `document.documentElement.lang`, close the menu, update the trigger code immediately — **no** full page reload.
- Do not invent a custom overlay; reuse `MatMenu` / `MatMenuItem` like the existing user menu.

### Dropdown content & layout

- Panel width about **200–240px** (`panelClass` + small Tailwind/token styles in the allowed global override files if needed; avoid `::ng-deep` in the component stylesheet).
- Each item shows **native language name** left-aligned and **uppercase acronym** right-aligned (`EN`, `HU`, `DE`), laid out with `justify-content: space-between` (e.g. flex row on the menu item content).
- Native names: English, Magyar, Deutsch (not English translations of the language names).

### Responsive & a11y

- Desktop: full globe + code + chevron as above.
- Narrow / mobile toolbar: keep the control usable; prefer compact form (globe + code, or globe alone with a clear `aria-label`) rather than a second custom mobile-only picker. Still open the same `mat-menu`.
- Keyboard: open/close and arrow navigation via Material menu defaults; selection applies on activate.
- Contrast and hit targets must meet the shell’s existing standards in light and dark themes.

### Illustrative structure (not final markup)

```html
<button mat-button type="button" [matMenuTriggerFor]="langMenu" [attr.aria-label]="…">
  <mat-icon>language</mat-icon>
  <span>{{ currentCode() }}</span>
  <mat-icon>arrow_drop_down</mat-icon>
</button>
<mat-menu #langMenu="matMenu" class="language-menu"><!-- ~200–240px -->
  @for (lang of languages; track lang.code) {
    <button mat-menu-item type="button" (click)="select(lang.code)">
      <span class="flex w-full items-center justify-between gap-3">
        <span>{{ lang.nativeName }}</span>
        <span class="flex items-center gap-1">
          <span>{{ lang.code | uppercase }}</span>
          @if (lang.code === currentCode()) { <mat-icon>check</mat-icon> }
        </span>
      </span>
    </button>
  }
</mat-menu>
```

---

## ngx-translate integration notes (implementers)

- Angular 22 → **ngx-translate v18**; standalone providers only (`TranslateModule` removed).
- Always nest `loader: provideTranslateHttpLoader(...)` **inside** `provideTranslateService({...})`.
- **Initializer:** follow the ngx-translate documentation pattern — `provideAppInitializer` that `inject(TranslateService)`, `addLangs([...])`, and `return translate.use(initialLang)` (Observable/Promise) so catalogs load before first render. Wire it like the existing `provideAppInitializer(initializeApp)` in `app.config.ts`; keep i18n init in `core/initializers/` rather than inside a layout component. Resolve `initialLang` from persistence → fallback `en`.
- Import `TranslatePipe` on each standalone component that needs it (or a small shared imports pattern if the repo already has one — do not invent a barrel module).
- Interpolation uses ngx-translate params: `'TRADING.ORDER_BUY_ASSET' | translate: { symbol: pair() }` with JSON `Buy {{symbol}}`.
- Instant vs stream: templates → pipe; snackbars/dialogs in TS → `instant()` after lang is loaded, or `get().subscribe` when async is required.
- Fallback language: configure `fallbackLang: 'en'`. Missing-key handler only for discovery noise in dev.

---

## Translation JSON convention

- Top-level object = feature/domain (`TRADING`, `PORTFOLIO`, `COMMON`, `NAV`, `AUTH`, …).
- Inside each feature: flat semantic keys in `UPPER_SNAKE_CASE`.
- Reference as `FEATURE.KEY` (e.g. `TRADING.ORDER_BUY`) — ngx-translate nested object lookup with `.` separator.
- Deeper nesting (`TRADING.ORDER.BUY`) only when a feature is large enough that it clearly helps; never layout-based keys (`RIGHT_PANEL_BUTTON`, `GREEN_BUTTON_LABEL`).
- Shared chrome → `COMMON` / `NAV` rather than duplicating Cancel/Save per feature.

Example shape (illustrative):

```json
{
  "COMMON": {
    "CANCEL": "Cancel",
    "SAVE": "Save",
    "CLOSE": "Close"
  },
  "NAV": {
    "DASHBOARD": "Dashboard",
    "MARKETS": "Markets",
    "PORTFOLIO": "Portfolio"
  },
  "TRADING": {
    "PAGE_TITLE": "Trading",
    "ORDER_BUY": "Buy",
    "ORDER_BUY_ASSET": "Buy {{symbol}}"
  }
}
```

---

## Translation behavior

| Concern | Approach |
| --- | --- |
| Current language | ngx-translate `TranslateService` (+ thin `AppLanguageService` for app concerns) |
| Available languages | `i18n.config.ts` + `addLangs(['en','hu','de'])` in **i18n `provideAppInitializer`** (ngx-translate docs) |
| Default / fallback | `en` via `lang` / `fallbackLang` |
| Bootstrap | `provideAppInitializer` returns `translate.use(saved or en)` before first paint |
| Loading | `@ngx-translate/http-loader` → `/i18n/{lang}.json` from `public/i18n/` |
| Resolve | ngx-translate nested JSON + `.` keys |
| Interpolation | ngx-translate `{{param}}` / params object |
| Persist | `localStorage` via `AppLanguageService` |
| Shell control | Navbar language selector (`mat-menu`); see [Language Selector UI Design](#language-selector-ui-design) |
| Reactivity | ngx-translate pipe/directive OnPush-safe language updates; no full reload |

---

## Translation usage

**Primary:**

```html
{{ 'TRADING.PAGE_TITLE' | translate }}
[placeholder]="'SEARCH.PLACEHOLDER' | translate"
```

With params:

```html
{{ 'TRADING.ORDER_BUY_ASSET' | translate: { symbol: pair() } }}
```

**Directive:** use only if the pipe cannot cover a real case; do not invent a third API.

**TS:**

```ts
private readonly translate = inject(TranslateService);
this.translate.instant('COMMON.SAVE');
```

---

## Computed and dynamic text

- Domain services return enums / semantic codes (`OrderStatus.Filled`), never user-facing English.
- Components map to keys:

```ts
readonly statusKey = computed(() =>
  this.position().closed ? 'POSITIONS.STATUS_CLOSED' : 'POSITIONS.STATUS_OPEN'
);
```

```html
{{ statusKey() | translate }}
```

- Dynamic sentences use interpolation in JSON (`Buy {{symbol}}`), never `instant('BUY') + ' ' + symbol`.

---

## Pluralization convention

No ICU plural rules for now. Prefer labels that work for singular and plural in English catalogs, e.g. `order(s)`, `position(s)`, `asset(s)`, and document this as an intentional project convention in `I18N_CONVENTIONS.md`. Revisit only if a language cannot express this cleanly.

---

## Locale-aware values

| Value | Prefer | Trading exception |
| --- | --- | --- |
| Dates / times | `DatePipe` / `Intl.DateTimeFormat` with active locale | Chart library defaults may stay as-is initially |
| Numbers / % | `DecimalPipe` / `Intl.NumberFormat` with active locale | Signed `%` display may keep fixed sign placement if product requires |
| Currency | `Intl` with locale + currency code | App still largely USD; `formatPrice` **digit tiers** for tiny prices stay domain logic — only separators/symbol follow locale when enabled |
| Compact volume | Decide in conventions doc | `K`/`M` suffixes may remain English convention until a later pass |

Do **not** translate: `BTC/USDT`, coin symbols, technical IDs, raw API enum strings shown as diagnostics.

---

## Missing keys

Resolution order (ngx-translate + project handler):

1. Selected language catalog  
2. Fallback language (`en` via `fallbackLang`)  
3. Return the key string itself + `console.warn` in non-production (`MissingTranslationHandler` or equivalent)

Never throw for a missing key in production UI.

---

## Existing application analysis

**Today:** no i18n library; `index.html` has `lang="en"`; copy is hardcoded English. Many labels already sit in `*.const.ts` (good extraction points). Nav labels live in `sidebar.const.ts` but are **duplicated** in navbar bottom nav HTML. Static files still live under `src/assets/` while `angular.json` already includes a `public/` root (only `favicon.ico` there today).

| Hotspot | Path / pattern | Migration note |
| --- | --- | --- |
| Static assets | `src/assets/` → `public/{images,icons,fonts,i18n}/…`; `angular.json` dual asset entries; `index.html` favicon | Follow [public folder structure](#public-folder-structure); drop `src/assets` input; update hrefs |
| Sidebar / nav | `sidebar.const.ts`, `navbar.component.html` | Keys under `NAV.*`; single source for desktop + mobile |
| Language selector | `navbar` right actions (near theme toggle) | Globe + code + chevron → `mat-menu` per UI design section |
| App init | `core/initializers/`, `app.config.ts` `provideAppInitializer` | Add i18n initializer beside existing `initializeApp` |
| Global search | `global-search.component.html`, `search.utils.ts` `GROUP_LABELS` | `SEARCH.*` |
| Notifications | `notification.service.ts` defaults + ~50 call-site strings | Keys; `instant` / params for dynamic bits |
| Price alerts UI chrome | `price-alerts.service.ts` `View` / `Stop` | Keys; prices/symbols as params |
| Data table | empty/loading/filter, Yes/No | `COMMON` / `TABLE.*` |
| Confirmation dialog | defaults + open() data | Resolve via `TranslateService` at open time |
| Auth / markets / trading / portfolio / dashboard / watchlist / system | feature templates + `*.const.ts` | Feature top-level JSON namespaces |
| Number formatting | `number.util.ts` hardcoded `en-US` / USD | Locale threading + conventions doc |
| Theme persistence | profile + navbar | Precedent for persisting language in `localStorage` first |

**Preferences:** [`privileges-and-preferences.md`](./privileges-and-preferences.md) defers a preferences service. i18n must work with **localStorage language** now; later optionally sync `locale` as a preference without redesigning ngx-translate wiring.

---

## Documentation after implementation

Create [`frontend/docs/I18N_CONVENTIONS.md`](../../frontend/docs/I18N_CONVENTIONS.md) as the SoT. It must include:

- Architecture (ngx-translate v18 providers, `core/i18n` helpers, `provideAppInitializer` language bootstrap, `public/` layout including `i18n/`)
- When to use `TranslatePipe` vs `TranslateService.instant` / `get`
- Language switching + navbar language selector (`mat-menu`) + persistence
- JSON location and `FEATURE.KEY` naming (when deeper nesting is OK)
- Interpolation, computed-text rules, pluralization convention
- Fallback / missing-key behavior
- Locale-aware formatting + trading exceptions
- How to add a key / how to add a language
- What to translate vs not
- Correct vs incorrect examples
- The core rule: business logic → semantic state; presentation → keys + params; JSON → wording

---

## Best-practice notes

- **Use ngx-translate** as the translation engine; project code only owns conventions, persistence, and catalogs.
- **Initialize language via `provideAppInitializer`** exactly as ngx-translate documents (`addLangs` + return `use(...)`); do not rely on a late component constructor.
- Keep catalogs **one file per language** under `public/i18n/` so agents and humans grep one place per locale; keep other static files under the `public/` category folders (not `src/assets/`).
- Language selector: Material `mat-menu` + theme tokens; no extra UI kit.
- Const files should hold **keys** (or key maps), not English sentences, after migration.
- Material: phase `MatPaginatorIntl` (and similar) when tables are migrated; do not block core pipe on full Material i18n.
- Ponytail: no custom duplicate pipe/service, no per-feature JSON, no second formatting framework beyond `Intl` + existing `number.util` improvements.
