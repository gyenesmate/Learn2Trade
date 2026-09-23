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
│   │       └── fired-alerts-widget/
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
| **AppComponent** | Minimal root: top-level `RouterOutlet` and app-wide bootstrap only (e.g. alert polling start) |
| **BaseLayoutComponent** | Persistent trading shell: navbar + sidebar + content outlet + layout-level hosts (e.g. fired alerts until Material popup) |
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
- `navbar/` — theme, user menu, balance, mobile bottom nav controls

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
| Feature-only | `features/<feature>/services/` |
| Component-only | next to that component under `services/` |

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

## 9. Models

Ownership determines placement:

- App-wide shared domain types → `core/models/`
- Feature-only → `features/<feature>/models/`
- Truly local → colocated with the component

Do not create a dumping-ground `models/` for unrelated domains.

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
3. App-wide business/infra? → `core/services/`
4. Globally reusable utility? → `core/utils/`
5. Reusable presentation? → `shared/components/`
6. One business feature? → `features/<feature>/`
7. Exists only for one component? → keep colocated

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

---

## 14. Routing pattern

Main features are **children of `BaseLayoutComponent`**. Lazy `loadComponent` is preferred. URLs must stay stable when classes/folders change.
