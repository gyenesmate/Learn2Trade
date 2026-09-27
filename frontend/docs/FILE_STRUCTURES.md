# FILE_STRUCTURES.md

Source of truth for Learn2Trade frontend folder layout, ownership, and where new files belong.

Also see: `.cursor/rules/learn2trade.mdc`, `docs/TRADING_UI_CONTEXT.md`, `agents.md`.

---

## 1. High-level tree

```text
src/
├── app/
│   ├── app.component.*
│   ├── app.config.ts
│   ├── app.routes.ts
│   │
│   ├── core/
│   │   ├── layout/
│   │   │   ├── base-layout/
│   │   │   ├── sidebar/
│   │   │   └── navbar/
│   │   │       └── global-search/   # search UI (mat-autocomplete); engine lives in core/search
│   │   ├── search/                  # app-wide search infrastructure (providers, ranking)
│   │   ├── services/
│   │   ├── utils/
│   │   ├── guards/
│   │   ├── models/
│   │   └── env/
│   │
│   ├── shared/
│   │   └── components/
│   │       ├── panel/
│   │       ├── data-table/
│   │       ├── status-chip/
│   │       ├── crypto-card/
│   │       ├── confirmation-dialog/
│   │       └── app-snackbar/   # stacked notifications (hosted by AppComponent)
│   │
│   └── features/
│       ├── dashboard/
│       ├── markets/
│       ├── trading/
│       ├── portfolio/
│       ├── auth/
│       └── system/
│
└── styles/
    ├── _tokens.scss
    ├── _material-overrides.scss
    ├── _components.scss
    ├── _utilities.scss
    ├── tailwind.scss          # SCSS semantic helpers entry (not the Tailwind framework)
    ├── theme.scss
    └── (primitives: _colors, _spacing, _radius, …)
```

Create subfolders (`services/`, `utils/`, `models/`, `components/`, `directives/`) **only when files exist**. Do not create empty directories.

Path aliases (`tsconfig.json`):

| Alias | Maps to |
| --- | --- |
| `@core/*` | `./src/app/core/*` |
| `@shared/*` | `./src/app/shared/*` |
| `@features/*` | `./src/app/features/*` |
| `@styles/*` | `./src/styles/*` |

---

## 2. Responsibility hierarchy

```text
AppComponent
  → RouterOutlet
       → BaseLayoutComponent
            ├── NavbarComponent
            ├── SidebarComponent
            └── RouterOutlet
                 → Feature components (dashboard, markets, trading, …)
```

| Layer | Owns |
| --- | --- |
| **AppComponent** | Minimal root: top-level `RouterOutlet`, app-wide bootstrap (e.g. alert polling), and global hosts (e.g. notification stack) |
| **BaseLayoutComponent** | Persistent trading shell: navbar + sidebar + content outlet |
| **Feature** | Route content and feature-specific UI/logic |
| **Shared components** | Reusable presentation primitives only |
| **Core services/utils** | Cross-cutting business/infrastructure |

Do **not** put Sidebar/Navbar into `AppComponent`.  
Do **not** introduce nested “inner layouts” unless multiple routes share another persistent inner chrome.  
Do **not** use `app-shell` naming — use `base-layout` / `BaseLayoutComponent`.

---

## 3. AppComponent rules

Keep minimal. Allowed:

- root `RouterOutlet`
- genuine global hosts (notifications widget, connection loss, command palette, overlay hosts)

Not allowed:

- sidebar / navbar
- trading workspace / dashboard chrome
- feature dialogs

Feature dialogs stay in their feature (Material Dialog/CDK overlays).

---

## 4. Layouts (`core/layout/`)

Use a layout when **multiple routes share the same persistent UI**.

Current:

- `base-layout/` — main app shell
- `sidebar/` — primary navigation, active route, collapse coordination via parent
- `navbar/` — theme, user menu, balance, mobile bottom nav controls, centered global search UI (`navbar/global-search/`)

Future layouts (`auth-layout`, `fullscreen-layout`) only when routes truly need a different shell. Do not create them speculatively.

---

## 5. Features (`features/`)

| Feature | Role | Primary routes (URLs unchanged) |
| --- | --- | --- |
| `dashboard/` | Portfolio overview widgets | `/dashboard` |
| `markets/` | Market list / admin crypto edit | `/home`, `/admin/crypto-currencies/...` |
| `trading/` | Asset detail, invest/alerts UI | `/crypto/:id` |
| `portfolio/` | Profile / edit profile | `/profile`, `/edit-profile` |
| `auth/` | Login, register, banned | `/login`, `/register`, `/banned` |
| `system/` | Not found, testing ground | `**`, `/testing-ground` |

`orders/` may be added when an orders product surface exists — do not create empty placeholders.

Feature-local pieces go under the feature:

```text
features/trading/
├── trading.component.*
└── components/
    ├── active-investment/
    ├── invest-dialog/
    └── set-price-alert-dialog/
```

---

## 6. Naming

- Routed feature components: **no `-page` suffix**  
  `MarketsComponent`, `TradingComponent`, `PortfolioComponent`, …
- Selectors: `app-markets`, `app-trading`, `app-portfolio`, …
- Layout: `BaseLayoutComponent` / `app-base-layout`
- Never `*PageComponent`, `*-page/`, or `app-shell`

---

## 7. Services

| Kind | Location |
| --- | --- |
| App-wide / business API | `core/services/` |
| Cross-cutting app subsystem (search, …) | `core/<subsystem>/` |
| Feature-only | `features/<feature>/services/` |
| Component-only | next to that component under `services/` |

Complex cross-application subsystems may receive their own directory under `core/` instead of placing all related files into generic `services/` or `utils/` directories.

Example: `core/search/` owns provider contracts, ranking, and `GlobalSearchService`. The navbar-owned presentation lives in `core/layout/navbar/global-search/` and must not contain feature-specific search logic.

Feature-owned search contributions (e.g. market provider) live under `features/<feature>/search/` and register via `GLOBAL_SEARCH_PROVIDERS` at the application root so the always-visible navbar can use them before lazy routes load.

Examples in `core/services/`: `auth`, `users`, `crypto-currencies`, `investments`, `price-alerts`, `watchlist-subscriptions`, `notification`, `api`, `token-storage.services`, `auth.interceptor`.

Do not move a service into `core` only because one other feature might use it later.

---

## 8. Utilities

| Kind | Location |
| --- | --- |
| Cross-cutting pure helpers | `core/utils/` |
| Feature-only | `features/<feature>/utils/` |
| Component-only | next to component |

Examples: `number.util.ts`, `investment.util.ts` → `core/utils/`.

---

## 9. Types & models

### Domain models (`models/`)

App-wide shared **domain / API** shapes (entities the backend owns):

- App-wide → `core/models/`
- Feature-only domain → `features/<feature>/models/`

Do not create a dumping-ground `models/` for unrelated domains.

### Component / subsystem types (`*.types.ts`)

UI contracts, dialog payloads, table column configs, search result shapes, and other **component- or subsystem-specific** interfaces/types live in a colocated `*.types.ts` file — not inside the `.component.ts` / `.service.ts` / `*-utilities.ts`.

Canonical example: `core/search/`:

```text
core/search/
├── search.types.ts          # SearchResult, SearchResultGroup, tokens, …
├── search.utils.ts          # pure helpers (rank, normalize, …)
├── global-search.service.ts
└── providers/
```

| Kind | File naming | Location |
| --- | --- | --- |
| Component / subsystem interfaces & types | `<name>.types.ts` | Next to the component or under the subsystem folder |
| Pure helpers (no types-only dumps) | `<name>.utils.ts` | Same folder as the types they support |
| Exported constants / static configs | `<name>.const.ts` | Same folder (labels, icons, route lists, action defs without callbacks) |
| Shared domain entities | `models.ts` / `models/` | `core/models/` or `features/<feature>/models/` |

Rules:

- Prefer `*.types.ts` over `*.model.ts` or `*-utilities.ts` when the file is primarily interfaces/types.
- Prefer `*.const.ts` over ad-hoc `*.links.ts` or inline magic strings for reused static values (see `sidebar.const.ts`, feature `*.const.ts`).
- Do **not** export large type surfaces from `.component.ts` — put them in `.types.ts` and import from there.
- Keep InjectionTokens next to the types they bind when they are subsystem contracts (see `GLOBAL_SEARCH_PROVIDERS` in `search.types.ts`).
- Truly one-off private types used only inside a single file may stay local (not exported).
- Wire live callbacks in the component; keep label/icon/variant descriptors in `*.const.ts`.

Canonical colocated trio example:

```text
core/layout/sidebar/
├── sidebar.const.ts         # SIDEBAR_LINKS
├── sidebar-link.types.ts
├── sidebar-link.utils.ts
└── sidebar.component.*

shared/components/page-header/
├── page-header.types.ts
├── page-header.const.ts
├── page-header.utils.ts
└── page-header.component.*
```

---

## 10. Shared components

`shared/components/` is for **genuinely reusable presentation**.

Put feature-specific UI under the feature (`features/trading/components/...`), not in shared.

---

## 11. Styles

| File | Responsibility |
| --- | --- |
| `_tokens.scss` | CSS variables from design tokens |
| `theme.scss` | `mat.theme` + system overrides, dark/light |
| `_material-overrides.scss` | Centralized `mat.*-overrides` |
| `_components.scss` | Global non-Material primitives (buttons, panels, chips) |
| `_utilities.scss` / `tailwind.scss` | Semantic layout/text helpers (SCSS; not Tailwind CSS) |
| primitives | `_colors`, `_spacing`, `_radius`, `_typography`, … |

No global Material overrides inside feature SCSS. Prefer tokens over arbitrary hex.

---

## 12. Placement decision tree

1. App root / global host? → `app/` or appropriate `core/`
2. Persistent shell shared by routes? → `core/layout/`
3. App-wide business/infra HTTP API? → `core/services/`
4. Cross-cutting subsystem (search engine, …)? → `core/<subsystem>/`
5. Globally reusable utility? → `core/utils/`
6. Component/subsystem-specific types? → colocated `*.types.ts`
7. Static labels / configs / route lists? → colocated `*.const.ts`
8. Reusable presentation? → `shared/components/`
9. One business feature? → `features/<feature>/`
10. Exists only for one component? → keep colocated (`*.types.ts` / `*.const.ts` as needed)

Search split: engine → `core/search/`; autocomplete UI → `core/layout/navbar/global-search/`; feature providers/definitions → `features/<feature>/search/`.

---

## 13. Rules for future developers & AI agents

- Inspect nearby architecture before creating files.
- Place by **ownership, persistence, and reuse** — not by file extension alone.
- Keep `AppComponent` minimal; shell lives in `BaseLayoutComponent`.
- Sidebar nav → `SidebarComponent`; top bar → `NavbarComponent`.
- Changing content → routed feature components (no unnecessary nested layouts).
- Additional layouts only when multiple routes share another shell.
- No generic dumping-ground folders; no empty `services`/`utils`/`models` folders.
- Avoid `*-page` and `app-shell` naming.
- Prefer existing aliases `@core`, `@shared`, `@features`.
- Preserve route URLs when renaming components.
- Reuse existing implementations; do not leave obsolete duplicates.
- Exported component/subsystem types → `*.types.ts` (see §9); do not grow type dumps inside components or `*-utilities.ts`.
- Exported static configs / labels / action descriptors → `*.const.ts` (see §9); wire callbacks in the component.

---

## 14. Routing pattern

Main features are **children of `BaseLayoutComponent`**. Lazy `loadComponent` is preferred. URLs must stay stable when classes/folders change.
