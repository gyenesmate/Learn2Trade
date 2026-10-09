# Frontend Review Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a dated snapshot reviewing guide under `frontend/docs/review/` that maps every major component/service, connections, applicable rules (as pointers), and Mermaid diagrams where useful — plus `99-suggestions.md` for later cherry-picking.

**Architecture:** Layered markdown tree (`architecture/`, `core/`, `shared/`, `features/*`) driven by the approved spec. Each page is written from the live codebase (read TS/HTML; do not invent wiring). Existing SoT docs stay authoritative; review pages only thin-pointer to them. No application code changes.

**Tech Stack:** Markdown + Mermaid; Angular 22 frontend sources under `frontend/src/app/`; SoT docs under `frontend/docs/` and `.cursor/rules/`.

**Spec:** `frontend/docs/superpowers/specs/2026-10-06-frontend-review-docs-design.md`

## Global Constraints

- Snapshot only — banner on every file; not a living SoT
- Thin pointers to `FILE_STRUCTURES.md`, `CRYPTO_WEBSOCKETS.md`, `STYLING_GUIDELINES.md`, `angular-guide.mdc`, `material-guide.mdc`, `learn2trade.mdc`, `agents.md`
- Mermaid inline in the same `.md`; prefer one primary diagram per page; skip trivial leaves
- One short page per component/service listed in the spec inventory
- No changes to app runtime code, routes, or styles except docs under `frontend/docs/review/`
- Snapshot date: **2026-10-06**
- Commit only when the user explicitly asks (do not auto-commit between tasks unless requested)

### Shared page banner (copy exactly)

```markdown
> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.
```

### Shared leaf template (fill from code)

```markdown
> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# <Name>

**Source:** `frontend/src/app/...`

## Role

<one paragraph>

## API surface

- …

## Connected to

- …

## Rules that apply

- `angular-guide.mdc` — …
- `learn2trade.mdc` / `FILE_STRUCTURES.md` — …

## Diagram

\`\`\`mermaid
…
\`\`\`

_(Omit Diagram section if trivial.)_

## Notes / smells

_(Omit if none.)_
```

---

### Task 1: Scaffold review tree + index skeleton

**Files:**
- Create: `frontend/docs/review/00-index.md`
- Create: empty directories via first files in Tasks 2–8 (no empty dirs for their own sake)
- Create: `frontend/docs/review/_templates/leaf.md` (optional local copy of template for agents; delete in Task 9 if undesired — prefer inlining template from this plan instead and **skip** creating `_templates/` to avoid extra noise)

**Interfaces:**
- Consumes: Spec §3–§5
- Produces: `00-index.md` with reading order and full planned inventory (links may 404 until later tasks)

- [ ] **Step 1: Create `00-index.md`**

Write `frontend/docs/review/00-index.md` containing:

1. Snapshot banner
2. Purpose (2–3 sentences from spec §1)
3. How to cherry-pick
4. Numbered reading path (spec §4)
5. Full inventory table of every planned path from spec §3 with one-line role placeholders filled from filenames
6. Links to SoT docs

- [ ] **Step 2: Verify index exists**

Run (PowerShell from repo root):

```powershell
Test-Path frontend/docs/review/00-index.md
Select-String -Path frontend/docs/review/00-index.md -Pattern "Snapshot review"
```

Expected: `True`; at least one match for the banner.

- [ ] **Step 3: Stop for review** (no commit unless user asked)

---

### Task 2: Architecture pages

**Files:**
- Create: `frontend/docs/review/architecture/01-app-shell.md`
- Create: `frontend/docs/review/architecture/02-routing-and-guards.md`
- Create: `frontend/docs/review/architecture/03-state-and-data.md`
- Create: `frontend/docs/review/architecture/04-styles-and-material.md`

**Interfaces:**
- Consumes: `app.component.ts`, `base-layout`, `app.routes.ts`, `app.config.ts`, styles under `src/styles/`, pointer docs
- Produces: four architecture pages linked from index

- [ ] **Step 1: Read sources**

Read:

- `frontend/src/app/app.component.ts` (+ html if any)
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/core/layout/base-layout/base-layout.component.ts`
- `frontend/docs/FILE_STRUCTURES.md` (pointer only)
- `frontend/docs/STYLING_GUIDELINES.md` (pointer only)
- `frontend/.cursor/rules/material-guide.mdc` (pointer only)

- [ ] **Step 2: Write `01-app-shell.md`**

Include banner, role of AppComponent + BaseLayout + Navbar/Sidebar, component Mermaid (App → BaseLayout → Navbar/Sidebar/outlet), rules pointers, source paths.

- [ ] **Step 3: Write `02-routing-and-guards.md`**

List child routes from `app.routes.ts` (markets, dashboard, trading `/crypto/:id`, portfolio, auth, admin crypto edit, system). Note `authGuard` / `adminGuard`. Sequence or relationship Mermaid for guard → route. Pointer to FILE_STRUCTURES.

- [ ] **Step 4: Write `03-state-and-data.md`**

Describe signals-in-services pattern, `toSignal`/`computed`, Binance ref-count + REST, HTTP via `ApiService`/`firstValueFrom`. Data-flow Mermaid for a representative path (e.g. miniTicker → latestTickers → Markets). Pointer to CRYPTO_WEBSOCKETS + angular-guide.

- [ ] **Step 5: Write `04-styles-and-material.md`**

Tokens / `_material-overrides` / no private DOM. Pointer to STYLING_GUIDELINES + material-guide. Optional small relationship diagram of styles entrypoints.

- [ ] **Step 6: Verify**

```powershell
@(
  'architecture/01-app-shell.md',
  'architecture/02-routing-and-guards.md',
  'architecture/03-state-and-data.md',
  'architecture/04-styles-and-material.md'
) | ForEach-Object { Test-Path "frontend/docs/review/$_" }
```

Expected: four `True`.

---

### Task 3: Core layout + search UI pages

**Files:**
- Create: `frontend/docs/review/core/overview.md`
- Create: `frontend/docs/review/core/layout-base-layout.md`
- Create: `frontend/docs/review/core/layout-sidebar.md`
- Create: `frontend/docs/review/core/layout-navbar.md`
- Create: `frontend/docs/review/core/layout-global-search.md`
- Create: `frontend/docs/review/core/layout-search-result.md`

**Interfaces:**
- Consumes: layout components under `core/layout/`
- Produces: core layout leaf pages

- [ ] **Step 1: Read**

- `base-layout.component.ts/html`
- `sidebar.component.ts/html` + `sidebar.const.ts`
- `navbar.component.ts/html`
- `global-search.component.ts` + `search-result.component.ts`
- `core/search/global-search.service.ts` (for connections; service page is Task 4)

- [ ] **Step 2: Write `core/overview.md`**

Map core folders (layout, services, binance, websocket, search, guards, env, utils, models). Relationship Mermaid. Pointer FILE_STRUCTURES.

- [ ] **Step 3: Write the five layout leaf pages**

Use leaf template. Include:

- base-layout: skip link, shell breakpoint `SHELL_MOBILE_MAX_PX`, sidebar collapse
- sidebar: `linksWithState`, watchlist dialog open
- navbar: theme, bottom nav `aria-current`, balance
- global-search: autocomplete + GlobalSearchService
- search-result: presentational row

Diagrams: component for base-layout; skip for search-result if trivial.

- [ ] **Step 4: Verify file count**

```powershell
(Get-ChildItem frontend/docs/review/core -Filter *.md).Count
```

Expected: at least `6` after this task (more after Task 4).

---

### Task 4: Core websocket, binance, services, guards/env

**Files:**
- Create: `frontend/docs/review/core/websocket-service.md`
- Create: `frontend/docs/review/core/binance-market-data.md`
- Create: `frontend/docs/review/core/binance-rest.md`
- Create: `frontend/docs/review/core/search-global-search.md`
- Create: `frontend/docs/review/core/service-auth.md`
- Create: `frontend/docs/review/core/service-api.md`
- Create: `frontend/docs/review/core/service-token-storage.md`
- Create: `frontend/docs/review/core/service-users.md`
- Create: `frontend/docs/review/core/service-crypto-currencies.md`
- Create: `frontend/docs/review/core/service-investments.md`
- Create: `frontend/docs/review/core/service-price-alerts.md`
- Create: `frontend/docs/review/core/service-watchlist-subscriptions.md`
- Create: `frontend/docs/review/core/service-notification.md`
- Create: `frontend/docs/review/core/notes-guards-env.md`

**Interfaces:**
- Consumes: corresponding `*.service.ts` / guard / env files; `CRYPTO_WEBSOCKETS.md` for pointers
- Produces: complete `core/` set

- [ ] **Step 1: Read each service file listed above** (skim public API + who injects whom via grep)

Example grep:

```powershell
rg -n "BinanceMarketDataService|WebSocketService|AuthService|PriceAlertsService" frontend/src/app --glob "*.ts"
```

- [ ] **Step 2: Write websocket + binance pages**

Must thin-pointer to `docs/CRYPTO_WEBSOCKETS.md`. Include:

- websocket: physical socket, connect/disconnect, no feature-owned disconnect
- binance-market-data: ref-count, `setMiniTickerTargets`, `latestTickers`, no idle disconnect note
- binance-rest: klines, ticker price, exchangeInfo

Primary diagram: sequence or data-flow on `binance-market-data.md`.

- [ ] **Step 3: Write remaining service pages + `notes-guards-env.md`**

Auth: session signals + `clearClientSession` / expiry.  
Api: HTTP base.  
Price-alerts: miniTicker evaluation (pointer WS-01 behavior).  
Notification: snackbar stack host on AppComponent.  
Guards/env: `authGuard`, `adminGuard`, `environment.ts` / `environment.prod.ts` + fileReplacements mention.

- [ ] **Step 4: Verify banners**

```powershell
rg -L "Snapshot review" frontend/docs/review/core
```

Expected: no files listed (all contain banner). If `rg` lacks `-L`, use:

```powershell
Get-ChildItem frontend/docs/review/core -Filter *.md | Where-Object { -not (Select-String -Path $_.FullName -Pattern 'Snapshot review' -Quiet) }
```

Expected: empty.

---

### Task 5: Shared components

**Files:**
- Create: `frontend/docs/review/shared/overview.md`
- Create: `frontend/docs/review/shared/data-table.md`
- Create: `frontend/docs/review/shared/crypto-card.md`
- Create: `frontend/docs/review/shared/crypto-chart.md`
- Create: `frontend/docs/review/shared/page-header.md`
- Create: `frontend/docs/review/shared/base-dialog.md`
- Create: `frontend/docs/review/shared/confirmation-dialog.md`
- Create: `frontend/docs/review/shared/app-snackbar.md`
- Create: `frontend/docs/review/shared/notification-stack.md`

**Interfaces:**
- Consumes: `shared/components/**`
- Produces: shared inventory complete

- [ ] **Step 1: Read** each shared component’s `.ts` (inputs/outputs) and note feature consumers via grep.

- [ ] **Step 2: Write `shared/overview.md`** + relationship Mermaid of shared kit.

- [ ] **Step 3: Write leaf pages**

Required emphasis:

- **crypto-card:** modes compact/intermediate/detailed; `externalTicker`; `enableWatchlist`; live signals; Trading vs Markets ownership — **state** + **component** diagram preferred
- **crypto-chart:** kline WS/REST; livePriceChange; aria-live OHLC
- **data-table:** columns, selection, formatCell/number utils, compact breakpoint
- dialogs / snackbar: Material patterns; pointer material-guide

- [ ] **Step 4: Verify**

```powershell
(Get-ChildItem frontend/docs/review/shared -Filter *.md).Name
```

Expected: `overview.md` plus the 8 leaves listed above.

---

### Task 6: Features — markets + trading

**Files:**
- Create: `frontend/docs/review/features/markets/overview.md`
- Create: `frontend/docs/review/features/markets/markets.md`
- Create: `frontend/docs/review/features/markets/animated-market-card-layout.md`
- Create: `frontend/docs/review/features/markets/market-movers.md`
- Create: `frontend/docs/review/features/markets/crypto-currency-edit.md`
- Create: `frontend/docs/review/features/markets/market-search-provider.md`
- Create: `frontend/docs/review/features/trading/overview.md`
- Create: `frontend/docs/review/features/trading/trading.md`
- Create: `frontend/docs/review/features/trading/invest-dialog.md`
- Create: `frontend/docs/review/features/trading/set-price-alert-dialog.md`

**Interfaces:**
- Consumes: markets + trading feature sources; shared crypto-card; binance services
- Produces: markets + trading review packs

- [ ] **Step 1: Read markets + trading sources**

Especially `markets.component.ts` (`setMiniTickerTargets`, page size), layout + movers, `trading.component.ts` (livePrice signal, dialogs, tables).

- [ ] **Step 2: Write markets pack**

Overview: route `/markets`, owns miniTicker targets, cards get `externalTicker`, movers empty copy.  
Data-flow Mermaid: catalog → targets → latestTickers → slots/movers.  
`market-search-provider.md`: GLOBAL_SEARCH_PROVIDERS registration.

- [ ] **Step 3: Write trading pack**

Overview: route `/crypto/:id`, invest/sell/alerts.  
Sequence Mermaid for invest or sell-confirm.  
Dialogs: reactive forms, available balance.

- [ ] **Step 4: Verify**

```powershell
@(
  'features/markets/overview.md',
  'features/trading/overview.md',
  'features/trading/set-price-alert-dialog.md'
) | ForEach-Object { Test-Path "frontend/docs/review/$_" }
```

Expected: three `True`.

---

### Task 7: Features — dashboard, portfolio, watchlist, auth, system

**Files:**
- Create: `frontend/docs/review/features/dashboard/overview.md`
- Create: `frontend/docs/review/features/dashboard/dashboard.md`
- Create: `frontend/docs/review/features/dashboard/analytics-card.md`
- Create: `frontend/docs/review/features/portfolio/overview.md`
- Create: `frontend/docs/review/features/portfolio/portfolio.md`
- Create: `frontend/docs/review/features/portfolio/edit-profile.md`
- Create: `frontend/docs/review/features/watchlist/overview.md`
- Create: `frontend/docs/review/features/watchlist/watchlist-dialog.md`
- Create: `frontend/docs/review/features/auth/overview.md`
- Create: `frontend/docs/review/features/auth/login.md`
- Create: `frontend/docs/review/features/auth/register.md`
- Create: `frontend/docs/review/features/auth/banned.md`
- Create: `frontend/docs/review/features/system/overview.md`
- Create: `frontend/docs/review/features/system/not-found.md`
- Create: `frontend/docs/review/features/system/testing-ground.md`

**Interfaces:**
- Consumes: respective feature folders
- Produces: remaining feature packs

- [ ] **Step 1: Read each feature’s main component + children**

Note: watchlist-config was **removed** — overview must say dialog-only, no `/watchlist/config` route.

- [ ] **Step 2: Write dashboard + portfolio packs**

Dashboard: holdings honesty, analytics-card sold view-models.  
Portfolio: funds form Material field, investments table.  
Optional ER Mermaid on dashboard overview (User–Investment–CryptoCurrency).

- [ ] **Step 3: Write watchlist + auth + system packs**

Auth: Learn2Trade branding; session via AuthService. Sequence for login optional.  
System: testing-ground is lab (unlisted in sidebar); not-found catch-all.

- [ ] **Step 4: Verify no missing feature overviews**

```powershell
Get-ChildItem frontend/docs/review/features -Recurse -Filter overview.md | ForEach-Object { $_.FullName }
```

Expected: 7 overview paths (markets, trading, dashboard, portfolio, watchlist, auth, system).

---

### Task 8: Suggestions file + index finalization

**Files:**
- Create: `frontend/docs/review/99-suggestions.md`
- Modify: `frontend/docs/review/00-index.md` (fix links, inventory roles, mark complete)

**Interfaces:**
- Consumes: entire review tree + improvement plan themes
- Produces: completed snapshot package

- [ ] **Step 1: Write `99-suggestions.md`**

Three sections with concrete bullets (examples to include, expand from review findings):

**Docs**

- Promote auth session / `clearClientSession` page into permanent docs if missing
- Dedicated crypto-card modes guide (compact/intermediate/detailed + Markets ownership)
- Search providers registration cookbook
- Update FILE_STRUCTURES watchlist section if still mentioning config stub (only if drift remains)

**Rules / skills**

- Consider a thin `docs/review` → SoT promotion checklist in `agents.md`
- Keep angular-guide / material-guide as guides (already renamed)
- Optional rule: “prefer concrete `@core`/`@shared` imports” already in FILE_STRUCTURES — ensure learn2trade cross-links

**Plugins / tools**

- Cursor skills already present (`ui-styling`, `design-system`, `ui-ux-pro-max`) — note when to invoke
- Superpowers plan/execute skills for future multi-step FE work
- Avoid recommending NgRx / extra state libs (aligned with improvement plan “NOT recommended”)

- [ ] **Step 2: Finalize `00-index.md`**

Ensure every created file is linked; reading path matches reality; snapshot date present.

- [ ] **Step 3: Full banner audit**

```powershell
Get-ChildItem frontend/docs/review -Recurse -Filter *.md |
  Where-Object { -not (Select-String -Path $_.FullName -Pattern 'Snapshot review' -Quiet) } |
  Select-Object -ExpandProperty FullName
```

Expected: empty output.

- [ ] **Step 4: Inventory count sanity**

```powershell
(Get-ChildItem frontend/docs/review -Recurse -Filter *.md).Count
```

Expected: roughly **55–65** files (index + suggestions + architecture 4 + core ~20 + shared 9 + feature leaves). If far below, find missing paths from spec §3.

---

### Task 9: Cross-check against spec + handoff note

**Files:**
- Modify: none required unless gaps found
- Optional: add one line to `frontend/README.md` under docs list pointing at `docs/review/00-index.md` as snapshot only — **only if** user wants; default **skip** (Ponytail / YAGNI; README already lists SoT docs)

**Interfaces:**
- Consumes: spec + completed tree
- Produces: verification report in the agent’s final message

- [ ] **Step 1: Spec coverage checklist**

Confirm each spec §3 path exists OR was intentionally merged (e.g. `notes-guards-env.md`). List any intentional merges in the final handoff.

- [ ] **Step 2: Spot-check accuracy**

Pick 3 pages (crypto-card, binance-market-data, trading) and re-read the TS sources; fix any wrong connections.

- [ ] **Step 3: Handoff**

Report: path to `00-index.md`, file count, known omissions, remind user this is a snapshot for cherry-picking — commit only if they ask.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Snapshot banner / cherry-pick nature | 1, 8, Global Constraints |
| Layered tree architecture/core/shared/features | 2–7 |
| Thin SoT pointers | Global + Tasks 2, 4 |
| Component inventory | 3, 5, 6, 7 |
| Service/infra inventory | 4 |
| Mermaid where appropriate | 2–7 (policy in Global + templates) |
| `99-suggestions.md` | 8 |
| Index reading path | 1, 8 |
| No app code changes | Global Constraints |

No TBD placeholders remain. Commit steps omitted as automatic (user must request commits).
