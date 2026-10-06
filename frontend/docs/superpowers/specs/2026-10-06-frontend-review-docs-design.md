# Frontend review docs — design

**Date:** 2026-10-06  
**Status:** Approved for planning  
**Location of deliverable:** `frontend/docs/review/`  
**Nature:** Dated **snapshot reviewing guide** — not a living source of truth. The author will cherry-pick content into permanent docs afterward.

---

## 1. Purpose

Produce a step-by-step written review of the Learn2Trade Angular frontend that:

- Maps **features, shared components, and core subsystems** and what connects to what
- States **which rules/docs apply** when touching that area (as pointers, not pasted rule bodies)
- Includes **Mermaid diagrams** (relationship, flow, sequence, component, state, activity, data-flow, ER) **where appropriate**
- Ends with a **suggestions** file for future docs, rules, and plugins/skills

Existing SoT docs remain authoritative:

| SoT | Role |
| --- | --- |
| `docs/FILE_STRUCTURES.md` | Folder ownership / placement |
| `docs/CRYPTO_WEBSOCKETS.md` | WS / Binance market-data |
| `docs/TRADING_UI_CONTEXT.md` | Trading UI / tokens |
| `.cursor/rules/*.mdc`, `agents.md` | Implementation standards |

Review pages **thinly pointer** to these (`Approach B`). They must stay useful enough to cherry-pick, but must not duplicate full SoT content.

---

## 2. Goals / non-goals

### Goals

- Full **component inventory** (one short page per feature/shared/layout component)
- Core **services and infra** pages (auth, api, binance, websocket, search, etc.)
- Architecture overview pages + numbered reading path in an index
- Inline Mermaid in the same `.md` as prose
- `99-suggestions.md` for optional follow-ups

### Non-goals

- Rewriting or replacing existing SoT docs in this pass
- Keeping `docs/review/` eternally synchronized with code
- Application code changes
- Backend review
- Expanding barrels, NgRx, Tailwind npm, or other deferred improvements

---

## 3. Folder layout

```text
frontend/docs/review/
├── 00-index.md
├── architecture/
│   ├── 01-app-shell.md
│   ├── 02-routing-and-guards.md
│   ├── 03-state-and-data.md
│   └── 04-styles-and-material.md
├── core/
│   ├── overview.md
│   ├── layout-base-layout.md
│   ├── layout-sidebar.md
│   ├── layout-navbar.md
│   ├── layout-global-search.md
│   ├── layout-search-result.md
│   ├── websocket-service.md
│   ├── binance-market-data.md
│   ├── binance-rest.md
│   ├── search-global-search.md
│   ├── service-auth.md
│   ├── service-api.md
│   ├── service-token-storage.md
│   ├── service-users.md
│   ├── service-crypto-currencies.md
│   ├── service-investments.md
│   ├── service-price-alerts.md
│   ├── service-watchlist-subscriptions.md
│   ├── service-notification.md
│   └── notes-guards-env.md          # short combined note if separate pages are noise
├── shared/
│   ├── overview.md
│   ├── data-table.md
│   ├── crypto-card.md
│   ├── crypto-chart.md
│   ├── page-header.md
│   ├── base-dialog.md
│   ├── confirmation-dialog.md
│   ├── app-snackbar.md
│   └── notification-stack.md
├── features/
│   ├── markets/
│   │   ├── overview.md
│   │   ├── markets.md
│   │   ├── animated-market-card-layout.md
│   │   ├── market-movers.md
│   │   ├── crypto-currency-edit.md
│   │   └── market-search-provider.md
│   ├── trading/
│   │   ├── overview.md
│   │   ├── trading.md
│   │   ├── invest-dialog.md
│   │   └── set-price-alert-dialog.md
│   ├── dashboard/
│   │   ├── overview.md
│   │   ├── dashboard.md
│   │   └── analytics-card.md
│   ├── portfolio/
│   │   ├── overview.md
│   │   ├── portfolio.md
│   │   └── edit-profile.md
│   ├── watchlist/
│   │   ├── overview.md
│   │   └── watchlist-dialog.md
│   ├── auth/
│   │   ├── overview.md
│   │   ├── login.md
│   │   ├── register.md
│   │   └── banned.md
│   └── system/
│       ├── overview.md
│       ├── not-found.md
│       └── testing-ground.md
└── 99-suggestions.md
```

Filenames may be adjusted slightly during implementation for consistency; the inventory of **units** above is normative.

---

## 4. Reading order (`00-index.md`)

1. Purpose + snapshot date + “how to cherry-pick”
2. Architecture §01 → §04
3. Core overview → layout → websocket/binance → services
4. Shared overview → shared leaves
5. Features: markets → trading → dashboard → portfolio → watchlist → auth → system
6. `99-suggestions.md`

Index also lists a complete file inventory with one-line roles.

---

## 5. Page templates

### 5.1 Snapshot banner (every file)

```markdown
> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.
```

### 5.2 Leaf component / service page

| Section | Content |
| --- | --- |
| Source | Path(s) to `.ts` / `.html` / key consts |
| Role | One short paragraph |
| API surface | Inputs/outputs/injects or public service API |
| Connected to | Parents, children, services, routes |
| Rules that apply | Bullet pointers to `.mdc` / SoT docs only |
| Diagram | Optional Mermaid (see §6) |
| Notes / smells | Optional; only observed facts useful for cherry-pick |

### 5.3 Feature `overview.md`

Purpose, routes, child component links, data sources, primary user flows, one primary Mermaid, rules + SoT links.

### 5.4 Architecture pages

System-level diagrams + thin prose + pointers to SoT. No component-level detail that belongs on leaf pages.

### 5.5 `99-suggestions.md`

Three sections:

1. **Docs** worth promoting or writing permanently  
2. **Rules / skills** gaps (new or tightened `.mdc`, agent guidance)  
3. **Plugins / tools** that could help as the frontend evolves  

Clearly labeled optional; not a commitment to implement.

---

## 6. Diagram policy

- Mermaid lives **inline** in the same `.md` as the prose.
- Prefer **one primary diagram** per page.
- Type selection:

| Type | When |
| --- | --- |
| Relationship / component | Structure, ownership, who embeds whom |
| Sequence | Login, invest/sell, alert create, WS subscribe handshake |
| Data-flow | miniTicker → `latestTickers` → Markets/cards/alerts |
| State | CryptoCard modes; auth session; WS connection |
| Activity | Multi-step invest / sell confirm |
| ER | Domain entities across services (User, Investment, Alert, CryptoCurrency) — mainly architecture or dashboard/trading overviews |

Skip diagrams for trivial presentational leaves (e.g. banned, not-found) unless a connection graph helps.

---

## 7. Coverage inventory (normative)

### Components (~31)

`app`, base-layout, sidebar, navbar, global-search, search-result, data-table, crypto-card, crypto-chart, page-header, base-dialog, confirmation-dialog, app-snackbar, notification-stack, markets, animated-market-card-layout, market-movers, crypto-currency-edit, trading, invest-dialog, set-price-alert-dialog, dashboard, analytics-card, portfolio, edit-profile, watchlist-dialog, login, register, banned, not-found, testing-ground.

### Core services / infra

auth, api, token-storage, users, crypto-currencies, investments, price-alerts, watchlist-subscriptions, notification, websocket, binance-market-data, binance-rest, global-search; plus short guards/env note; markets search provider under features/markets.

---

## 8. Relationship to existing docs

| Review content | Treatment |
| --- | --- |
| Folder placement | Pointer → `FILE_STRUCTURES.md` |
| WS / Binance | Pointer → `CRYPTO_WEBSOCKETS.md` (+ thin connection diagram on review page if useful) |
| Colors / panels / tokens | Pointer → `TRADING_UI_CONTEXT.md` |
| Angular / Material patterns | Pointer → `angular-guide.mdc`, `material-guide.mdc` |
| Project map | Pointer → `learn2trade.mdc`, `agents.md` |

Do **not** paste long excerpts from those files into review pages.

---

## 9. Quality bar

- Connections must match the codebase at snapshot time (read sources; do not invent wiring)
- Rules = pointers only
- Snapshot banner on every file
- Index has reading path + inventory
- No app/runtime code changes as part of this workstream
- Suggestions file is clearly optional backlog

---

## 10. Delivery process

1. This design → user review of written spec  
2. **writing-plans** → implementation plan under `frontend/docs/plans/` (or as specified in that skill)  
3. Execute plan: generate `frontend/docs/review/**` from live code  
4. User cherry-picks into permanent docs in a later, separate effort  

---

## 11. Open decisions (resolved)

| Decision | Choice |
| --- | --- |
| Living vs snapshot | Snapshot reviewing guide; cherry-pick later |
| Depth | Full component inventory |
| Existing SoT | Thin pointers |
| Diagrams | Mermaid inline in same `.md` |
| Structure | Layered tree (architecture / core / shared / features) |
