# i18n conventions

Source of truth for Learn2Trade frontend internationalization.

**Engine:** `@ngx-translate/core` + `@ngx-translate/http-loader` (v18)  
**Project plan (historical):** [`docs/project-plans/i18n-conventions.md`](../../docs/project-plans/i18n-conventions.md)

---

## Core rule

Business logic provides semantic data and state. The presentation layer selects translation keys and parameters. Translation JSON files own the final user-facing wording.

---

## Architecture

| Piece | Location |
| --- | --- |
| Providers | `frontend/src/app/app.config.ts` — `provideTranslateService` with nested `provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' })`, `fallbackLang: 'en'`, missing-key handler |
| Bootstrap | `frontend/src/app/core/initializers/i18n.initializer.ts` via `provideAppInitializer` — `addLangs` + return `use(saved\|en)` before first paint |
| Config / types | `frontend/src/app/core/i18n/i18n.config.ts`, `i18n.types.ts` |
| Persistence / switch | `frontend/src/app/core/i18n/app-language.service.ts` (`localStorage`, `document.documentElement.lang`, number locale) |
| Catalogs | `frontend/public/i18n/{en,hu,de}.json` → served at `/i18n/{lang}.json` |
| Shell control | Navbar language selector (`mat-menu`) |

Do **not** add a project-owned translate pipe/service that duplicates ngx-translate.

### Static `public/` layout

```text
frontend/public/
├── images/{logos,backgrounds,illustrations,placeholders}/
├── icons/custom/
├── fonts/
├── i18n/{en,hu,de}.json
├── favicon.ico
├── manifest.webmanifest
└── robots.txt
```

URLs mirror paths under `public/`. Do not use `src/assets/`.

---

## Template vs TypeScript API

| Context | Use |
| --- | --- |
| Templates | `{{ 'FEATURE.KEY' \| translate }}` / `[attr.aria-label]="'…' \| translate"` / params: `translate: { name: x }` |
| Snackbars, dialogs, TS | `inject(TranslateService).instant('FEATURE.KEY', params?)` after language is loaded |
| Live updates on language change | Prefer the pipe. Pass **keys** into page-header / data-table (`title`, column `label`, action `label`) — never pre-`instant()` those; the components pipe `| translate` so language switches refresh UI |

Import `TranslatePipe` on each standalone component that uses `| translate`.

---

## Language switching

1. User picks a language in the navbar menu (native name + `EN`/`HU`/`DE`).
2. `AppLanguageService.use(code)` → `TranslateService.use`, persist to `localStorage` (`l2t.language`), set `<html lang>`, update `Intl` locale for `number.util`.
3. UI updates without full reload.

Initializer hydrates the saved language (or `en`) before first paint.

---

## JSON location and `FEATURE.KEY`

- One file per language under `public/i18n/`.
- Top-level namespaces: `COMMON`, `NAV`, `SHELL`, `SEARCH`, `TABLE`, `NOTIFY`, `AUTH`, `MARKETS`, `TRADING`, `PORTFOLIO`, `PROFILE`, `DASHBOARD`, `WATCHLIST`, `SYSTEM`, `ALERTS`, …
- Leaf keys: `UPPER_SNAKE_CASE`. Reference as `FEATURE.KEY`.
- Deeper nesting only when a feature is large enough that it clearly helps.
- Never layout-based keys (`RIGHT_PANEL_BUTTON`).

---

## Interpolation and computed text

```html
{{ 'TRADING.INVEST_DIALOG_TITLE' | translate: { name: crypto().name } }}
```

```ts
readonly statusKey = computed(() =>
  this.position().closed ? 'POSITIONS.STATUS_CLOSED' : 'POSITIONS.STATUS_OPEN'
);
```

Do **not** assemble sentences with `instant('A') + ' ' + x`. Put structure in JSON (`Buy {{symbol}}`).

---

## Pluralization

No ICU plural rules yet. Prefer labels that work for singular and plural in English catalogs where needed, e.g. `order(s)`. Revisit per language if required.

---

## Fallback / missing keys

1. Selected language catalog  
2. `fallbackLang: 'en'`  
3. Return the key string + `console.warn` in development (`AppMissingTranslationHandler`)

Never throw for a missing key in production UI.

---

## Locale-aware formatting

`number.util` (`formatMoney`, `formatDecimal`, `formatPrice`) uses the active language’s `Intl` locale via `setNumberLocale` (driven by `AppLanguageService`).

| Value | Prefer | Trading exception |
| --- | --- | --- |
| Dates / times | `DatePipe` / `Intl` with active locale | Chart library defaults may stay as-is initially |
| Numbers / % | `Intl` / pipes with active locale | Signed `%` placement may stay fixed |
| Currency | `Intl` + USD | `formatPrice` **digit tiers** for sub-dollar prices stay domain logic |
| Compact volume | — | `K`/`M` English suffixes until a later pass |

**Do not translate:** `BTC/USDT`, coin symbols, technical IDs, raw API enums shown as diagnostics.

---

## How to add a key

1. Add the English string under the right namespace in `public/i18n/en.json`.
2. Add the **same key path** to every other locale file (`hu.json`, `de.json`, …) with a real translation for that language — do not leave English leftovers or omit keys.
3. Keep **identical key sets and counts** across all locale files (same nested structure; same `{{param}}` placeholders).
4. Use the key in the template (`| translate`) or TS (`instant`).
5. Prefer keys in `*.const.ts` instead of English literals.

## How to add a language

1. Add `{ code, nativeName, intlLocale }` in `i18n.config.ts` / `APP_LANGUAGES`.
2. Add `public/i18n/{code}.json`.
3. `addLangs` already registers from `APP_LANGUAGE_CODES` in the initializer.

---

## Correct vs incorrect

**Correct**

```html
{{ 'NAV.MARKETS' | translate }}
{{ 'SEARCH.NO_RESULTS' | translate: { query: state().query } }}
```

```ts
this.notification.success(this.translate.instant('ALERTS.NOTIFY_CREATED'));
```

**Incorrect**

```ts
this.notification.success('Alert created');
this.translate.instant('BUY') + ' ' + symbol;
```

---

## Const files

After migration, `*.const.ts` files hold **keys** (or key maps), not English sentences. Shared chrome uses `COMMON` / `NAV`.
