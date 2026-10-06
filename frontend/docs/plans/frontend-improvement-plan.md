# Learn2Trade Frontend Improvement Plan

> **Audit date:** 2026-10-06  
> **Scope:** `frontend/` only — investigation and planning; no application code changes in this task.  
> **Stack verified:** Angular / Material / CDK `^22.1.1`, RxJS `~7.8`, Zone.js `~0.15`, `lightweight-charts` `^5.1`, Vitest + Playwright (`frontend/package.json`).  
> **For implementers:** Prefer `superpowers:subagent-driven-development` or `superpowers:executing-plans` and keep diffs Ponytail-small. Do not introduce NgRx or new UI kits.

---

## 1. Executive Summary

The Learn2Trade frontend is a **functional, well-structured Angular 22 educational trading terminal** with a clear ownership model (core / shared / features), a correctly centralized Binance WebSocket stack, modern `inject()` + OnPush defaults, lazy `loadComponent` routes, and a real design-token + Material 3 theme pipeline.

**Overall maturity: Functional but inconsistent.**

| Dimension | Assessment |
| --- | --- |
| Architecture | **Good** — shell, features, Binance transport/domain split match `docs/FILE_STRUCTURES.md` |
| UI/UX | **Functional but inconsistent** — markets/trading feel terminal-like; portfolio/dashboard still card-stack + incomplete states |
| Maintainability | **Good foundation, growing debt** — unused shared primitives, dual button/input systems, doc/code drift |
| Consistency | **Weakest area** — numeric formatting, P&L colors, forms, loading/error, page chrome |

**Key strengths to preserve**

- Single physical Binance WS (`WebSocketService`) + ref-counted streams (`BinanceMarketDataService`) — documented in `docs/CRYPTO_WEBSOCKETS.md`.
- Feature-based layout with stable URLs and functional guards.
- Shared building blocks that already exist: `app-page-header`, `app-data-table`, `app-base-dialog`, `app-confirmation-dialog`, `NotificationService` / snackbar stack, `app-crypto-card` + detailed chart.
- Token + `mat.theme` / `mat.*-overrides` theming under `src/styles/`.
- Search split: engine in `core/search`, UI in `navbar/global-search`, feature providers.

**Most important problems**

1. Markets subscribes to **every** catalog symbol’s miniTicker (and doubles work with cards) — scales poorly.
2. Parallel Binance REST price paths in dashboard + price-alerts bypass `BinanceRestService` / WS.
3. Design-system primitives (`app-panel`, `app-status-chip`) and TRADING_UI_CONTEXT rules are under-adopted; `.btn` / `.input` compete with Material.
4. Loading / empty / error states are inconsistent; markets maps API failure to empty; dashboard loading UI unbound; header CTAs are no-ops.
5. Auth/brand polish: ~~login said “CryptoWatcher”~~ (fixed Phase 1); auth interceptor can still desync `AuthService` user state.

**Highest-value improvements**

1. Tighten Markets WS fan-out + choose one owner for live prices (page **or** card).
2. Unify Binance price REST/WS and migrate price-alerts off 15s REST polling.
3. Adopt existing panel/header/chip primitives + one numeric/P&L vocabulary.
4. Standardize loading/error/empty (with Retry) on markets, dashboard, chart, tables.
5. Fix trust/IA quick wins: brand copy, admin nav, dashboard actions, sell confirmation, Material override hygiene.

---

## 2. Standards Used for Evaluation

| Standard | Purpose |
| --- | --- |
| Learn2Trade frontend guide (`.cursor/rules/learn2trade.mdc`) | Project map, stack, placement, reuse rules |
| `docs/FILE_STRUCTURES.md` | Folder ownership, shell vs features, shared vs feature-local |
| `docs/CRYPTO_WEBSOCKETS.md` | Binance WS/REST architecture and compact vs detailed contract |
| `docs/TRADING_UI_CONTEXT.md` | Trading UI density, tokens, panels, forms, numeric rules |
| `agents.md` | Agent change discipline and priority order |
| Angular guide (`.cursor/rules/angular-guide.mdc`) | Signals, `inject()`, RxJS interop, templates, OnPush honesty |
| Material guide (`.cursor/rules/material-guide.mdc`) | `mat.theme` / overrides, no private DOM, no second UI kit |
| Ponytail (`.cursor/rules/ponytail.mdc`) | YAGNI, reuse first, smallest maintainable diff |
| Superpowers (writing-plans / verification principles) | Evidence-based planning; no speculative rewrites |
| UI/UX Pro Max (`frontend/.cursor/skills/ui-ux-pro-max`) | UX focus/loading/empty, chart a11y, Angular stack guidance |
| Angular / Material conventions (installed v22) | Framework-correct patterns for this version |

---

## 3. Current Frontend Architecture

### 3.1 Major directories

```text
frontend/src/
├── app/
│   ├── app.component.*          # root outlet + notification stack host
│   ├── app.config.ts            # zone CD, interceptor, animations, auth bootstrap, search providers
│   ├── app.routes.ts            # BaseLayout + lazy loadComponent children
│   ├── core/
│   │   ├── layout/              # base-layout, sidebar, navbar (+ global-search UI)
│   │   ├── search/              # GlobalSearchService + providers token
│   │   ├── websocket/           # single physical WS transport
│   │   ├── binance/             # market-data (ref-count) + REST helpers
│   │   ├── services/            # auth, API, users, cryptos, investments, alerts, watchlist, notifications
│   │   ├── guards/              # authGuard, adminGuard (functional)
│   │   ├── models/              # domain entities
│   │   ├── utils/               # number, investment helpers
│   │   └── env/                 # environment (dev; no prod twin found)
│   ├── shared/components/       # page-header, data-table, crypto-card(+chart), dialogs, snackbar, panel, status-chip
│   └── features/
│       ├── dashboard/
│       ├── markets/             # browser, movers, animated layout, admin crypto edit, market search provider
│       ├── trading/             # /crypto/:id + invest/alert dialogs
│       ├── portfolio/           # /profile, edit-profile (profile + wallet + tables + admin dump)
│       ├── watchlist/           # dialog + config stub
│       ├── auth/
│       └── system/              # testing-ground, not-found
└── styles/                      # tokens, theme, material-overrides, utilities (SCSS “tailwind”), components
```

### 3.2 Shell and routing

```text
AppComponent
  ├── notification-stack (global)
  └── RouterOutlet
       └── BaseLayoutComponent
            ├── SidebarComponent
            ├── NavbarComponent (+ GlobalSearch)
            └── RouterOutlet → lazy features
```

| URL | Feature | Guard |
| --- | --- | --- |
| `/` → `/markets` | markets | — |
| `/dashboard` | dashboard | auth |
| `/crypto/:id` | trading | auth |
| `/profile`, `/edit-profile` | portfolio | auth |
| `/watchlist/config` | watchlist stub | auth |
| `/login`, `/register` | auth | auth (guest flip) |
| `/banned` | banned | — |
| `/admin/crypto-currencies/...` | markets admin edit | auth + admin |
| `/testing-ground`, `**` | system | — |

### 3.3 State / data flow

```text
Backend API (HttpClient + authInterceptor)
  → AuthService signals (currentUser / isLoggedIn)
  → domain services (investments, cryptos, watchlist, price-alerts, users)

Binance Spot public WS
  → WebSocketService
  → BinanceMarketDataService (ref-counted miniTicker / kline)
  → Markets (page Map) + CryptoCard + WatchlistDialog + CryptoChart

Binance REST (fetch, no Bearer)
  → BinanceRestService (klines, exchangeInfo)
  → also ad-hoc ticker/price in Dashboard + PriceAlertsService (bypass)
```

### 3.4 Styling architecture

- **Tokens** → CSS variables (`_tokens.scss` + primitive maps).
- **Material 3** → `theme.scss` + `_material-overrides.scss` (density `-1`, dark-first).
- **Layout** → SCSS utility helpers (`tailwind.scss` / `_utilities.scss`) — **not** the Tailwind npm package.
- **Surfaces** → intended `app-panel`; many features still use `.card` / `mat-card` / elevation.

### 3.5 Design-system organization

| Intended primitive | Status |
| --- | --- |
| `app-page-header` | Used where title/actions chrome helps; **intentionally omitted on Markets** (density) |
| `.app-panel` / `.status-chip` CSS | Global primitives in `_components.scss`; Angular wrappers removed as unused |
| `app-data-table` | Heavy reuse; private `.mat-mdc-*` styling |
| `app-crypto-card` | Shared but domain-fat (WS, watchlist, notifications) |
| Custom `.btn` / `.input` | Parallel kit beside Material |
| `NotificationService` | Correct single toast path |

---

## 4. What Is Already Done Well

These decisions should be **preserved**, not redesigned.

### 4.1 Centralized Binance WebSocket stack

`WebSocketService` has no crypto knowledge; `BinanceMarketDataService` owns SUBSCRIBE/UNSUBSCRIBE, ref-counts, and reconnect resync. Cards/charts never open `new WebSocket`. Idle disconnect was deliberately removed to fix Markets ↔ Trading thrash (`docs/CRYPTO_WEBSOCKETS.md`).

**Preserve because:** correct boundary for educational market data; prevents per-component sockets.

### 4.2 Compact vs detailed crypto responsibilities

Compact/intermediate cards use miniTicker + sparkline; detailed trading view uses REST history + kline WS via colocated `crypto-chart`. Documented and largely respected.

**Preserve because:** different UX jobs; shared chart library without forcing one mode to do both.

### 4.3 Feature isolation + lazy routes + stable URLs

`app.routes.ts` uses `loadComponent` under one `BaseLayoutComponent`. Feature dialogs stay in features. URLs match the frontend guide.

**Preserve because:** bundle discipline and navigation contracts agents are told not to break.

### 4.4 Search architecture

`core/search` engine + provider token; navbar hosts UI; `MarketSearchProvider` registered from markets feature path at bootstrap so search works before lazy load. Ctrl/Cmd+K already exists.

**Preserve because:** extensible without a god search component.

### 4.5 Modern Angular baseline

Widespread `inject()`, standalone components, OnPush, `@if`/`@for`, signal inputs/outputs, functional guards, auth bootstrap via `provideAppInitializer`.

**Preserve because:** aligns with `angular-guide.mdc`; incremental modernization is cheaper than a rewrite.

### 4.6 Notification stack

Custom stacked snackbars via `NotificationService` hosted on `AppComponent` — intentional Material-expert-approved alternative to MatSnackBar.

**Preserve because:** already consistent app-wide feedback path.

### 4.7 Token + Material theme pipeline

`mat.theme` / validated overrides / app CSS variables match Material expert guidance. Typography (IBM Plex Sans + Space Grotesk) and trading-blue primary match TRADING_UI_CONTEXT.

**Preserve because:** theming SoT is already in the right place; fix consumers, not the pipeline.

---

## 5. Improvement Findings

### 5.1 Architecture

#### [ARCH-01] Markets miniTicker fan-out scales with full catalog

**Priority:** Critical  
**Area:** Architecture / Performance / WebSockets  

**Affected files:**

- `frontend/src/app/features/markets/markets.component.ts` (`wireAllTickers`)
- `frontend/src/app/features/markets/markets.const.ts` (`MARKETS_PAGE_SIZE`)
- `frontend/src/app/core/binance/binance-market-data.service.ts`
- `frontend/docs/CRYPTO_WEBSOCKETS.md` (documents “first-N” / card limit naming that no longer matches code)

**Observation**

`wireAllTickers` maps **all** DB cryptos to Binance pairs, calls `setMiniTickerTargets(pairs)`, and also `watchMiniTicker` for each pair. Page size is only 5 (`MARKETS_PAGE_SIZE`), but subscriptions are not limited to the current page.

**Problem**

As the catalog grows, Binance message volume, Map clones, and `computed` recomputation grow linearly with catalog size — not with visible cards. Movers need a broader set than one page, but not necessarily every symbol forever.

**Standard / principle**

- `docs/CRYPTO_WEBSOCKETS.md` (subscribe only what consumers need; targets for page sets)
- Ponytail (smallest correct work)
- Angular expert (avoid unnecessary derived recomputation)

**Recommended improvement**

Subscribe to:

1. current page pairs (for card live data / sort of visible set), **and**
2. a bounded movers candidate set (e.g. top-N by last known volume/change, or all only while catalog is tiny),

Clear targets on destroy (already done). Align docs with real behavior.

**Implementation approach**

- Change `wireAllTickers` (or replace with `wireVisibleTickers`) to compute `pairsNeeded = unique(pagePairs ∪ moverCandidatePairs)`.
- Keep `setMiniTickerTargets` for page-level desired set; avoid idle disconnect (already correct).
- Update `CRYPTO_WEBSOCKETS.md` Markets section to describe page+movers targeting.

**Expected benefit**

Lower WS traffic, less Map churn, healthier Markets page as catalog grows.

**Complexity:** Medium  
**Risk:** Medium (movers quality if candidate set is too small)  
**Dependencies:** Prefer deciding [ARCH-02] ownership model first.

---

#### [ARCH-02] Duplicate miniTicker consumers on Markets (page + card)

**Priority:** High  
**Area:** Architecture / WebSockets / Component design  

**Affected files:**

- `frontend/src/app/features/markets/markets.component.ts`
- `frontend/src/app/shared/components/crypto-card/crypto-card.component.ts`
- `frontend/src/app/features/markets/components/animated-market-card-layout/`

**Observation**

For the same pair, Markets holds a page-level `watchMiniTicker` subscription (into `tickers` Map) **and** each compact/intermediate `CryptoCard` opens its own `watchMiniTicker`. Ref-counting prevents double wire SUBSCRIBE, but JS handlers and UI updates still run twice.

**Problem**

Double work per tick on the hottest page; unclear ownership of “live price for Markets.”

**Standard / principle**

- `docs/CRYPTO_WEBSOCKETS.md` (centralized streams; consumers should not multiply unnecessary watches)
- Ponytail (one owner)

**Recommended improvement**

Pick **one** model:

- **A (recommended):** Page owns tickers Map; cards become more presentational for compact Markets use (price/change inputs or a thin live facade).  
- **B:** Cards own watches; page only uses `setMiniTickerTargets` + reads from a shared store/service signal for movers/sort.

Avoid keeping both full watches for the same pairs.

**Implementation approach**

- Prefer A if Markets needs movers/sort from a central Map anyway.
- Pass live fields into cards for Markets slots; keep card self-subscribe for watchlist dialog / standalone uses if needed.
- Do **not** invent a new global store library — extend `BinanceMarketDataService` with a small readonly ticker map **only if** multiple features need the same cache (Markets + movers already do).

**Expected benefit**

Half the per-tick JS work on Markets; clearer ownership.

**Complexity:** Medium  
**Risk:** Medium  
**Dependencies:** [ARCH-01]

---

#### [ARCH-03] Parallel Binance REST ticker paths bypass core binance layer

**Priority:** High  
**Area:** Architecture / State and data flow  

**Affected files:**

- `frontend/src/app/features/dashboard/dashboard.component.ts` (`fetchBinanceSpotPrice` / local pair mapper)
- `frontend/src/app/core/services/price-alerts.service.ts` (15s poll + local pair mapper)
- `frontend/src/app/core/binance/binance-rest.service.ts`
- `frontend/src/app/core/binance/binance.utils.ts` (`toBinancePair`)

**Observation**

Dashboard and price-alerts hardcode `https://api.binance.com/api/v3/ticker/price` and duplicate pair mapping instead of `toBinancePair` / `BinanceRestService`.

**Problem**

Three sources of truth for prices (WS miniTicker, REST in BinanceRestService, ad-hoc fetch). Bugfixes and URL/env changes must be repeated; alerts poll reloads the full alert list every 15s.

**Standard / principle**

- Learn2Trade frontend guide (reuse `core` before inventing)
- `docs/CRYPTO_WEBSOCKETS.md` (REST belongs in BinanceRestService; alerts→WS listed as future)
- Ponytail

**Recommended improvement**

1. Add `getTickerPrice(pair)` (or batch) to `BinanceRestService`.
2. Replace dashboard/price-alerts private fetch + mappers with `toBinancePair` + that method.
3. Migrate active alert monitoring to `BinanceMarketDataService.watchMiniTicker` (see [WS-01]).

**Implementation approach**

- Small REST method first (quick win for dashboard).
- Then replace alert polling with ref-counted miniTicker watches keyed by alert symbols; keep REST only as optional seed if needed.

**Expected benefit**

One Binance REST surface; fewer duplicate helpers; path to cheaper alerts.

**Complexity:** Medium  
**Risk:** Low–Medium  
**Dependencies:** None for REST unify; [WS-01] for alert migration.

---

#### [ARCH-04] Auth interceptor clears storage but not AuthService user signal

**Priority:** High  
**Area:** Architecture / Auth  

**Affected files:**

- `frontend/src/app/core/services/auth.interceptor.ts`
- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/core/services/token-storage.service.ts`
- `frontend/src/app/core/guards/auth.guard.ts`

**Observation**

On 401, interceptor clears token storage and navigates to login, but `AuthService.currentUser` may remain set until something else refreshes. `isSessionExpired()` used as a guard predicate can call `logout()` (side effect inside a check).

**Problem**

Navbar/balance/admin UI can briefly show a logged-in user after session death; guard “predicates” with side effects are hard to reason about and test.

**Standard / principle**

- Angular expert (explicit state; no hidden races)
- `agents.md` (auth changes require tracing consumers)

**Recommended improvement**

- Single `AuthService.clearSession()` / `logout({ reason })` used by interceptor, timer, and guard.
- Make `isSessionExpired()` a pure read; perform logout in the caller.

**Implementation approach**

- Add/extend session-clear API on `AuthService`.
- Interceptor calls it before navigate.
- Guard: if expired → logout then redirect.

**Expected benefit**

UI auth state matches token reality; simpler guard tests.

**Complexity:** Small  
**Risk:** Medium (auth is sensitive — cover with existing guard specs)  
**Dependencies:** None

---

#### [ARCH-05] Portfolio is a god-page; admin IA is incomplete

**Priority:** Medium  
**Area:** Architecture / Navigation  

**Affected files:**

- `frontend/src/app/features/portfolio/portfolio.component.*`
- `frontend/src/app/core/layout/sidebar/sidebar.const.ts`
- `frontend/src/app/features/watchlist/watchlist-config/`

**Observation**

`/profile` hosts personal info, add funds, watchlist table, investments, alerts, **and** admin crypto/users tables. Sidebar admin links (Users, Crypto admin, Admin settings) have **no routes** — clicks no-op. Watchlist config is “Under construction.”

**Problem**

Hard to teach learners where “admin” lives; sidebar lies; portfolio component will keep growing.

**Standard / principle**

- `docs/FILE_STRUCTURES.md` (feature ownership; admin under markets edit already exists)
- TRADING_UI_CONTEXT (shell navigation clarity)
- Ponytail (don’t invent empty features — wire or remove)

**Recommended improvement**

Short term: wire admin sidebar items to existing routes (`/admin/crypto-currencies/new` or portfolio admin anchors) **or** remove inert items.  
Medium term: keep admin tables on portfolio **or** extract a thin admin feature only when a second admin surface appears — do not create empty `features/admin/` now.

**Implementation approach**

- Immediate: give `admin-crypto` a real `route`; hide/remove Users/Settings until endpoints/UI exist.
- Optionally deep-link portfolio admin sections with fragment IDs before splitting files.

**Expected benefit**

Honest navigation; less portfolio sprawl pressure.

**Complexity:** Small–Medium  
**Risk:** Low  
**Dependencies:** None

---

#### [ARCH-06] Doc / naming / brand drift

**Priority:** Low  
**Area:** Maintainability  

**Affected files:**

- `frontend/docs/CRYPTO_WEBSOCKETS.md` (`/home`, `MARKETS_CARD_LIMIT`)
- `frontend/package.json` (`name: cryptowatcher-app`)
- `frontend/src/app/features/auth/login/login.component.html`
- `frontend/src/app/features/auth/register/register.component.html`

**Observation**

Docs mention legacy `/home`; code redirects to `markets`. Package and auth copy still say CryptoWatcher.

**Problem**

Agents and humans follow docs/copy that disagree with runtime; brand trust suffers on the first screen.

**Standard / principle**

- Learn2Trade frontend guide (docs as SoT)
- TRADING_UI_CONTEXT / brand consistency

**Recommended improvement**

Align docs and user-visible brand strings to Learn2Trade; leave package rename optional (tooling churn).

**Implementation approach**

- Fix auth headings in the same PR as [UX-01].
- Patch CRYPTO_WEBSOCKETS Markets naming to `MARKETS_PAGE_SIZE` and actual subscribe policy after [ARCH-01].

**Expected benefit**

Less rediscovery; consistent product identity.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [ARCH-01] for accurate WS docs

---

### 5.2 Angular implementation

#### [ANG-01] CryptoCard live metrics are mutable fields under OnPush

**Priority:** High  
**Area:** Angular  

**Affected files:**

- `frontend/src/app/shared/components/crypto-card/crypto-card.component.ts`
- `frontend/src/app/shared/components/crypto-card/crypto-card.component.html`

**Observation**

Live price / 24h change / watchlistSaving etc. mix signals with mutable class fields; updates rely on `NgZone.run` and parent `livePriceTick` bumps.

**Problem**

OnPush + mutable fields is fragile (especially toward zoneless readiness). Template reads non-signal state inconsistently.

**Standard / principle**

- Angular expert (signals for view state; OnPush honesty)
- UI/UX Pro Max Angular stack (signals for state; prepare for zoneless)

**Recommended improvement**

Move live metrics and saving flags to `signal` / `computed`. Keep Rx only at the WS boundary (`subscribe` → `signal.set`, or `toSignal` where shape allows).

**Implementation approach**

- Replace mutable live fields with signals.
- Keep chart DOM bridging in `effect` / `afterRenderEffect` only where Lightweight Charts requires it.

**Expected benefit**

Reliable CD; clearer card API; safer future zoneless work.

**Complexity:** Medium  
**Risk:** Medium  
**Dependencies:** [ARCH-02] if Markets ownership changes card inputs

---

#### [ANG-02] Hot template methods on data-table, sidebar, analytics-card

**Priority:** Medium  
**Area:** Angular / Performance  

**Affected files:**

- `frontend/src/app/shared/components/data-table/data-table.component.html` + `.ts`
- `frontend/src/app/core/layout/sidebar/sidebar.component.html` + `.ts`
- `frontend/src/app/features/dashboard/components/analytics-card/analytics-card.component.html` + `.ts`
- `frontend/src/app/core/layout/navbar/navbar.component.html`

**Observation**

Selection/format/expand helpers and `isActive` / `profit()` / `roiPercent()` are invoked from templates on every CD cycle for many rows/links.

**Problem**

On Markets/Trading/Portfolio tables this adds avoidable work during live price ticks and route events.

**Standard / principle**

- Angular expert (keep templates declarative; `computed` / pure helpers)
- Ponytail (fix the shared function once)

**Recommended improvement**

Precompute view models with `computed()` (sidebar active flags per link; analytics metrics once; table cell formatters as pipes or column config functions called when data changes — not ad-hoc per CD if avoidable).

**Implementation approach**

- Sidebar: derive `linksWithState` computed from router URL signal.
- Analytics-card: compute profit/roi/date in a `computed` list.
- Data-table: cache selection set lookups; prefer pipes for formatting; reduce method fan-out in `@for`.

**Expected benefit**

Cheaper CD under live updates.

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** None

---

#### [ANG-03] Inconsistent Rx cleanup (`Subscription[]` vs `takeUntilDestroyed`)

**Priority:** Medium  
**Area:** Angular  

**Affected files:**

- `frontend/src/app/core/layout/sidebar/sidebar.component.ts`
- `frontend/src/app/core/layout/navbar/navbar.component.ts`
- `frontend/src/app/shared/components/app-snackbar/notification-stack.component.ts`
- `frontend/src/app/features/markets/markets.component.ts`
- `frontend/src/app/features/trading/trading.component.ts` (already uses `takeUntilDestroyed` for paramMap; also duplicates `toSignal(paramMap)`)

**Observation**

Newer code uses `takeUntilDestroyed`; layout/markets still use manual arrays. Trading listens to `paramMap` twice (signal + subscribe).

**Problem**

Inconsistent patterns increase leak risk in future edits; dual route listeners are pure waste.

**Standard / principle**

- Angular expert (`takeUntilDestroyed` / `toSignal`; don’t subscribe only to copy fields)

**Recommended improvement**

Standardize on `takeUntilDestroyed` for component subscriptions; drop Trading’s duplicate listener (keep `toSignal` **or** subscribe — not both).

**Implementation approach**

- Mechanical cleanup per file when touching that area; Trading duplicate is a quick win.

**Expected benefit**

Fewer lifecycle bugs; clearer idioms for agents.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

#### [ANG-04] Forms split: reactive Material vs ngModel dialogs vs native inputs

**Priority:** Medium  
**Area:** Angular / Material / UX  

**Affected files:**

- `frontend/src/app/features/auth/login|register`
- `frontend/src/app/features/portfolio/portfolio.component.html` (native add-funds)
- `frontend/src/app/features/trading/components/invest-dialog/`
- `frontend/src/app/features/trading/components/set-price-alert-dialog/`
- `frontend/src/app/features/portfolio/edit-profile/`

**Observation**

Auth/edit-profile use reactive + Material outline; invest/alert dialogs use template-driven `ngModel`; portfolio funds uses native `.input`.

**Problem**

Validation timing, error display, and a11y labels diverge; harder to teach one form pattern.

**Standard / principle**

- Angular expert (prefer reactive forms)
- Material expert + TRADING_UI_CONTEXT (outline fields; validate after blur/`touched`)
- UI/UX Pro Max Angular stack (reactive over template-driven for non-trivial forms)

**Recommended improvement**

Migrate invest/alert dialogs and add-funds to reactive + `mat-form-field appearance="outline"`. Show available balance helper text in invest dialog (spec). Keep markets toolbar `ngModel` on signals if it stays trivial.

**Implementation approach**

- One dialog at a time; reuse nearby edit-profile patterns.
- Do not adopt Signal Forms unless already stable in installed version and explicitly chosen later.

**Expected benefit**

Consistent validation UX; Material density/theme alignment.

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** None

---

### 5.3 State and data flow

#### [STATE-01] Dashboard computes holdings/metrics but under-renders; actions are no-ops

**Priority:** High  
**Area:** State / UX  

**Affected files:**

- `frontend/src/app/features/dashboard/dashboard.component.ts`
- `frontend/src/app/features/dashboard/dashboard.component.html`
- `frontend/src/app/features/dashboard/dashboard.const.ts`
- `frontend/src/app/features/dashboard/components/analytics-card/`

**Observation**

`isLoading` exists but is not bound in the template. Holdings/metrics are built in TS but the template mainly shows overview + analytics when sold investments exist. Header actions call `() => undefined`. Analytics shows raw `crypto_currency_id` and a placeholder timeline.

**Problem**

Learners see blank/partial dashboard with fake CTAs — trust and discoverability failure.

**Standard / principle**

- Angular expert (explicit loading/empty/success)
- UI/UX Pro Max (loading feedback High severity; empty states with action)
- TRADING_UI_CONTEXT (dashboard as portfolio overview)

**Recommended improvement**

- Bind loading spinner/skeleton.
- Either wire holdings table into the template **or** delete unused holdings/metrics code (Ponytail: delete over zombie features).
- Remove no-op header actions or navigate to Markets / Trading invest entry.

**Implementation approach**

- Prefer showing computed portfolio overview + a simple holdings table using existing `app-data-table`.
- Replace timeline placeholder with sold-history list only if real chart is out of scope (don’t add a chart library).

**Expected benefit**

Honest dashboard; less dead state.

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** [ARCH-03] for price fetch cleanup

---

#### [STATE-02] Markets API errors look like empty markets

**Priority:** High  
**Area:** State / Error handling  

**Affected files:**

- `frontend/src/app/features/markets/markets.component.ts` (`ngOnInit` catch → `[]`)
- `frontend/src/app/features/markets/markets.component.html`

**Observation**

Load failure sets an empty array; UI shows the same empty message as “no cryptos.”

**Problem**

Users cannot tell outage vs empty catalog; no Retry.

**Standard / principle**

- Angular expert (do not hide failures)
- TRADING_UI_CONTEXT / UI/UX Pro Max empty vs error distinction

**Recommended improvement**

Explicit `error` signal + Retry control; keep empty message only for successful empty lists.

**Implementation approach**

- Add `loadError` signal; template `@if` branches: loading / error+retry / empty / content.

**Expected benefit**

Debuggable UX; fewer false “no markets” reports.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

### 5.4 WebSockets and market data

#### [WS-01] Price alerts should use miniTicker instead of 15s REST polling

**Priority:** High  
**Area:** WebSockets / Performance  

**Affected files:**

- `frontend/src/app/core/services/price-alerts.service.ts`
- `frontend/src/app/core/binance/binance-market-data.service.ts`
- `frontend/docs/CRYPTO_WEBSOCKETS.md`

**Observation**

While alerts exist, service reloads alerts and fetches ticker prices on a 15s timer.

**Problem**

N+1 REST traffic; delayed alerts; duplicates WS infrastructure already paid for elsewhere.

**Standard / principle**

- `docs/CRYPTO_WEBSOCKETS.md` (planned migration)
- Ponytail (use existing BinanceMarketDataService)

**Recommended improvement**

For each unique alert symbol, `watchMiniTicker`; evaluate thresholds on tick; keep HTTP only for CRUD.

**Implementation approach**

- Maintain a `Map<pair, Subscription>` inside the service; sync when alert list changes.
- Use existing snackbar `NotificationService.alert()`.
- Add a small unit/self-check for threshold crossing logic.

**Expected benefit**

Faster alerts, less REST load, one market-data path.

**Complexity:** Medium  
**Risk:** Medium (must not leak watches when alerts cleared)  
**Dependencies:** [ARCH-03]

---

#### [WS-02] Document and optionally idle-disconnect after long empty desired set

**Priority:** Low  
**Area:** WebSockets  

**Affected files:**

- `frontend/src/app/core/binance/binance-market-data.service.ts`
- `frontend/docs/CRYPTO_WEBSOCKETS.md`

**Observation**

Socket stays open when desired set is empty (correct for route transitions).

**Problem**

Long-lived empty connection after leaving market surfaces (battery/network on mobile).

**Standard / principle**

- CRYPTO_WEBSOCKETS (idle timeout listed as future)
- Ponytail (only if measured pain)

**Recommended improvement**

Optional idle timeout (e.g. 60–120s empty) that disconnects **only** when desired streams stay empty — never during transitions.

**Implementation approach**

- Timer reset on any desired-set change; cancel on new subscribe.
- Do not ship until [ARCH-01]/[ARCH-02] stabilize subscribe sets.

**Expected benefit**

Cleaner resource use on idle sessions.

**Complexity:** Small  
**Risk:** Medium (regress Markets↔Trading thrash if timer too aggressive)  
**Dependencies:** [ARCH-01], [ARCH-02]

---

### 5.5 Component design

#### [COMP-01] Use `.app-panel` / `.status-chip` CSS (Angular wrappers removed)

**Priority:** High  
**Area:** Component design / Design system  

**Affected files:**

- `frontend/src/styles/_components.scss` (`.app-panel`, `.status-chip` primitives — kept)
- Feature templates: portfolio, dashboard, trading (`mat-card` wrappers)
- ~~`shared/components/panel/`~~ / ~~`status-chip/`~~ — **deleted in Phase 1** (unused)

**Observation**

Angular `<app-panel>` / `<app-status-chip>` had zero feature consumers. Global CSS primitives remain. Features still use `.card` / `mat-card` / elevation.

**Problem**

Double chrome (mat-card around elevated data-table); unused Angular wrappers were museum debt.

**Standard / principle**

- TRADING_UI_CONTEXT (prefer `.app-panel` classes)
- Ponytail (delete unused; don’t keep wrappers without consumers)

**Recommended improvement**

Apply `.app-panel` / `.status-chip` CSS classes on trading + portfolio + dashboard sections. Remove `mat-card` wrappers that only add elevation around tables. Reintroduce a thin Angular panel wrapper only if multiple features need the same projected API.

**Implementation approach**

- Class-based adoption in Phase 3; no new shared component unless projection is clearly shared.

**Expected benefit**

Visual consistency without unused abstractions.

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** None

---

#### [COMP-02] CryptoCard is domain-fat for a shared component

**Priority:** Medium  
**Area:** Component design  

**Affected files:**

- `frontend/src/app/shared/components/crypto-card/crypto-card.component.ts`
- `frontend/src/app/shared/components/crypto-card/crypto-card.types.ts` (unused `CryptoCardData`)
- Colocated chart under card (OK per FILE_STRUCTURES)

**Observation**

Card owns Binance watches, watchlist mutations, notifications, routing to `/crypto/:id`, plus inline sparkline chart code separate from detailed `crypto-chart`.

**Problem**

Hard to reuse in testing-ground/markets without side effects; shared layer leaks feature concerns; two chart implementations to maintain.

**Standard / principle**

- FILE_STRUCTURES (shared = reusable presentation; feature owns feature dialogs/logic)
- Ponytail (thin shared; don’t rewrite unless multiple consumers suffer)

**Recommended improvement**

Incremental thinning — not a rewrite:

1. Extract watchlist toggle to inputs/outputs or a tiny facade used by card.
2. Prefer page-provided live props on Markets ([ARCH-02]).
3. Delete unused `CryptoCardData` or actually use it.
4. Longer term: share sparkline helpers with chart utils only if duplication hurts.

**Implementation approach**

- Do not move card out of shared (still multi-feature).
- Push side effects behind optional inputs (`enableWatchlist`, `livePrice`) with defaults preserving current behavior.

**Expected benefit**

Easier testing; clearer Markets composition.

**Complexity:** Large (full thin) / Medium (incremental)  
**Risk:** Medium  
**Dependencies:** [ARCH-02], [ANG-01]

---

#### [COMP-03] Dead / aspirational UI: active-investment, neumorphic, animated layout name

**Priority:** Low  
**Area:** Maintainability  

**Affected files:**

- `frontend/src/app/features/trading/components/active-investment/`
- `frontend/src/app/shared/directives/neumorphic.*` (+ testing-ground only)
- `frontend/src/app/features/markets/components/animated-market-card-layout/`

**Observation**

`ActiveInvestmentComponent` is unused; neumorphic only on testing-ground; animated layout comment admits animation may come later.

**Problem**

Dead code confuses agents about the “real” sell UX path.

**Standard / principle**

- Ponytail (deletion over addition)

**Recommended improvement**

Delete unused `active-investment` **or** use it for sell+confirm. Keep neumorphic as testing-ground lab or remove if unwanted. Rename layout if no animation ships.

**Implementation approach**

- Prefer delete active-investment after confirming no dynamic import.
- Confirm sell via existing `app-confirmation-dialog` on trading table actions ([UX-05]).

**Expected benefit**

Less noise in trading feature.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [UX-05] if delete vs reuse decision ties to confirm flow

---

### 5.6 Angular Material / CDK

#### [MAT-01] Private Material DOM styling and `::ng-deep`

**Priority:** High  
**Area:** Material  

**Affected files:**

- `frontend/src/app/shared/components/data-table/data-table.component.scss` (`.mat-mdc-*`, `.mdc-*`)
- `frontend/src/app/features/markets/components/market-movers/market-movers.component.scss` (`::ng-deep`)
- `frontend/src/app/core/layout/navbar/navbar.component.scss` (`!important` on toolbar)
- `frontend/src/styles/_material-overrides.scss`

**Observation**

Component SCSS pierces Material internals instead of `mat.*-overrides`.

**Problem**

Breaks on Material upgrades; violates project Material expert hard rules.

**Standard / principle**

- Material expert (no `.mat-mdc-*`, `::ng-deep`, `!important`, private vars)

**Recommended improvement**

Move table/checkbox/toggle/toolbar look into `_material-overrides.scss` or validated component overrides; keep component SCSS for layout only.

**Implementation approach**

- Inventory selectors in data-table/movers/navbar.
- Map each to the corresponding `mat.table-overrides` / `mat.button-toggle-overrides` / toolbar tokens.
- Visually regress Markets movers + portfolio tables + navbar.

**Expected benefit**

Upgrade-safe theming; one SoT for Material look.

**Complexity:** Medium  
**Risk:** Medium (visual diffs)  
**Dependencies:** None

---

#### [MAT-02] Dual button / input kits

**Priority:** High  
**Area:** Material / Design system  

**Affected files:**

- `frontend/src/styles/_components.scss` (`.btn`, `.input`)
- Auth submits, `page-header`, crypto-card CTAs, portfolio add-funds, data-table action bars

**Observation**

Material buttons/fields coexist with custom `.btn` / `.input`; sometimes stacked (`mat-button` + `btn btn-secondary`).

**Problem**

Inconsistent density, focus, hover; second UI kit forbidden by Material expert.

**Standard / principle**

- Material expert (don’t invent parallel kits)
- TRADING_UI_CONTEXT (primary/secondary/trade-buy/sell)

**Recommended improvement**

Choose Material buttons as primary actions; keep only semantic trade helpers (`trade-buy-button` / `trade-sell-button`) if they wrap Material or are thin tokenized classes. Migrate native `.input` to `mat-form-field`.

**Implementation approach**

- Update `page-header` actions to Material buttons first (high leverage).
- Then auth submits + dialogs + portfolio funds.
- Deprecate `.btn` gradually; don’t big-bang.

**Expected benefit**

Coherent controls; better a11y defaults from Material.

**Complexity:** Medium  
**Risk:** Low–Medium  
**Dependencies:** [ANG-04] for forms; [A11Y-01] for focus on leftover custom controls

---

### 5.7 UI/UX

#### [UX-01] Brand copy still says CryptoWatcher

**Priority:** High  
**Area:** UX / Brand  

**Affected files:**

- `frontend/src/app/features/auth/login/login.component.html`
- `frontend/src/app/features/auth/register/register.component.html`

**Observation**

Headings welcome users to “CryptoWatcher” while sidebar/product is Learn2Trade.

**Problem**

First-run trust break; looks unfinished.

**Standard / principle**

- Learn2Trade branding / TRADING_UI_CONTEXT typography brand accents
- UI/UX Pro Max consistency

**Recommended improvement**

Replace with Learn2Trade copy; keep educational tone.

**Implementation approach**

- One-line template edits; optional shared auth title const.

**Expected benefit**

Immediate brand coherence.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

#### [UX-02] Markets sidebar icon misleading; page-header intentionally omitted

**Priority:** Medium  
**Area:** UX / Navigation  

**Affected files:**

- `frontend/src/app/core/layout/sidebar/sidebar.const.ts`
- `frontend/docs/TRADING_UI_CONTEXT.md` (page-header exception)
- `frontend/.cursor/rules/learn2trade.mdc`

**Observation**

Markets intentionally has no `app-page-header` — the browse layout is denser without it. Markets sidebar icon was `home` (misleading).

**Problem**

`home` icon implies “home/dashboard,” not market discovery. Forcing a page-header on Markets would waste vertical space.

**Standard / principle**

- TRADING_UI_CONTEXT (dense terminal; page-header optional on browse surfaces)
- Learn2Trade guide (use `app-page-header` when chrome is needed; Markets may omit)

**Recommended improvement**

Keep Markets without `app-page-header`. Change sidebar icon to a market-like Material icon (`show_chart`). Document the page-header exception in project rules/docs.

**Implementation approach**

- Sidebar const icon change + docs/rules update only.

**Expected benefit**

Honest IA; preserved Markets density.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

#### [UX-03] Inconsistent numeric formatting and tabular nums

**Priority:** High  
**Area:** UX / Financial data  

**Affected files:**

- `frontend/src/app/core/utils/number.util.ts`
- Templates: crypto-card, market-movers, navbar, data-table, dashboard, portfolio
- `frontend/docs/TRADING_UI_CONTEXT.md` §7

**Observation**

Mix of `$` interpolation, `number` pipe precisions (2–8), `currency` pipe, raw totals; `tabular-nums` only in some SCSS islands.

**Problem**

Columns misalign; low-priced alts look wrong at 2 decimals; dashboard totals can look “off-spec.”

**Standard / principle**

- TRADING_UI_CONTEXT (tabular nums; right-align numerics)
- UI/UX Pro Max chart/finance guidance (signed values; don’t rely on color alone)

**Recommended improvement**

Centralize format helpers (price by magnitude, pct with sign, money) in `number.util.ts`; apply `.tabular-nums` / `.numeric` on table cells and price displays.

**Implementation approach**

- Extend existing util; use from templates/pipes; update data-table currency/number cell rendering once.

**Expected benefit**

Readable financial UI; one place to tune precision.

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** None

---

#### [UX-04] Fragmented P&L / up-down color classes

**Priority:** Medium  
**Area:** UX / Design system  

**Affected files:**

- Local SCSS: crypto-card, market-movers, watchlist, crypto-chart, dashboard
- `frontend/src/styles/_utilities.scss` (`.price-up` / `.price-down`)

**Observation**

Multiple class vocabularies (`.up`/`.down`, `.profit`/`.loss`, `.price-up`/`.price-down`). Zero often styled as down.

**Problem**

Theme/token changes don’t propagate; a11y (color-only) inconsistently mitigated.

**Standard / principle**

- TRADING_UI_CONTEXT (semantic success/danger tokens; not decorative red/green)
- UI/UX Pro Max (signed values + not color alone)

**Recommended improvement**

Standardize on `.price-up` / `.price-down` (or tokenized utilities) + always show `+`/`−` or arrow for nonzero; treat `0` as neutral.

**Implementation approach**

- Grep and replace local class pairs when touching those components.
- Prefer utilities over new components.

**Expected benefit**

Consistent movement semantics.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [UX-03] helpful but not required

---

#### [UX-05] Destructive actions inconsistent (sell without confirm)

**Priority:** Medium  
**Area:** UX  

**Affected files:**

- `frontend/src/app/features/trading/trading.component.ts`
- `frontend/src/app/shared/components/confirmation-dialog/`
- Portfolio delete/ban flows (already confirm)

**Observation**

Portfolio uses `app-confirmation-dialog` for deletes; trading sell does not.

**Problem**

Accidental educational “sells” frustrate learners; inconsistent mental model.

**Standard / principle**

- TRADING_UI_CONTEXT (destructive → confirm)
- Material expert (reuse shared dialogs)

**Recommended improvement**

Confirm sell with existing confirmation dialog before calling investments service.

**Implementation approach**

- Mirror portfolio openDialog pattern; no new dialog component.

**Expected benefit**

Safer trading UX with existing primitive.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

#### [UX-06] Dashboard / analytics visual debt

**Priority:** Medium  
**Area:** UX  

**Affected files:**

- `frontend/src/app/features/dashboard/components/analytics-card/analytics-card.component.scss` (hardcoded light greys `#f5f5f5`, `#888`, `#bbb`)
- `analytics-card.component.html` (IDs, placeholder timeline)

**Observation**

Hardcoded light greys break dark theme contrast; analytics content is half-finished.

**Problem**

Fails contrast readability (UI/UX Pro Max High); looks broken in default dark theme.

**Standard / principle**

- TRADING_UI_CONTEXT / Material expert (tokens only)
- UI/UX Pro Max contrast

**Recommended improvement**

Replace hex with tokens; show crypto symbol/name via join map; drop fake chart chrome until a real series exists.

**Implementation approach**

- SCSS token swap + template data fix as part of [STATE-01].

**Expected benefit**

Usable dark dashboard analytics.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [STATE-01]

---

### 5.8 Responsive design

#### [RESP-01] Breakpoint magic numbers disagree with token scale

**Priority:** Medium  
**Area:** Responsive  

**Affected files:**

- `frontend/src/styles/_breakpoints.scss` (xs 480 / sm 600 / md 900 / lg 1200 / xl 1600)
- `base-layout` mobile shell **768**
- `data-table` mobile **600** + SCSS **640**
- trading/markets/dashboard media queries **900 / 960 / 1100 / 1200**
- `_utilities.scss` trading-workspace **1439 / 1023**

**Observation**

Tokens exist but components hardcode divergent px values. Shell mobile ≠ table mobile ≠ utility workspace breakpoints.

**Problem**

Layouts “jump” at different widths; hard to teach one mobile threshold.

**Standard / principle**

- TRADING_UI_CONTEXT (mobile &lt;768 task-focused)
- Learn2Trade styles placement (use breakpoint helpers)

**Recommended improvement**

Pick shell mobile = 768 (matches docs) and table compact = 600 (`sm`); replace scattered queries gradually; prefer `@include breakpoints.*` or CSS vars.

**Implementation approach**

- Introduce shared constants/mixins usage in the files you touch.
- Consider CDK `BreakpointObserver` only if multiple TS consumers need the same query — otherwise CSS media queries are enough (Ponytail).

**Expected benefit**

Predictable responsive behavior.

**Complexity:** Medium  
**Risk:** Medium (layout regressions)  
**Dependencies:** None

---

#### [RESP-02] Bottom nav lacks `aria-current`; trading workspace utilities unused

**Priority:** Low  
**Area:** Responsive / a11y  

**Affected files:**

- `frontend/src/app/core/layout/navbar/navbar.component.html`
- `frontend/src/app/features/trading/trading.component.html`
- `frontend/src/styles/_utilities.scss` (`trading-workspace`)

**Observation**

Sidebar marks current page; bottom nav does not. Trading uses custom layout classes instead of documented workspace helpers.

**Problem**

Weaker mobile a11y; unused utilities rot.

**Standard / principle**

- UI/UX Pro Max keyboard/nav clarity
- TRADING_UI_CONTEXT shell

**Recommended improvement**

Add `aria-current` to bottom nav active item; either adopt `trading-workspace` on trading page or delete unused utilities.

**Implementation approach**

- Small template + optional class swap.

**Expected benefit**

Clearer mobile nav; less dead CSS.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

### 5.9 Accessibility

#### [A11Y-01] Focus rings removed on custom controls

**Priority:** High  
**Area:** Accessibility  

**Affected files:**

- `frontend/src/styles/_components.scss` (`.btn { outline: none }`)
- `frontend/src/app/shared/components/data-table/data-table.component.scss` (column filters)
- `frontend/src/styles/_base.scss` (link focus vs global `:focus-visible`)

**Observation**

Custom controls strip outlines without an equivalent ring. Global `:focus-visible` exists but does not cover all cases.

**Problem**

Keyboard users lose focus visibility — UI/UX Pro Max marks this High severity.

**Standard / principle**

- UI/UX Pro Max (Focus States / Focus Appearance)
- Material expert (preserve a11y)
- TRADING_UI_CONTEXT focus tokens

**Recommended improvement**

Never remove outline without a 2px+ high-contrast `:focus-visible` replacement using primary/focus tokens.

**Implementation approach**

- Fix `.btn` and `.column-filter` first; audit interactive custom elements.

**Expected benefit**

Keyboard operability on non-Material controls.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [MAT-02] reduces surface area long-term

---

#### [A11Y-02] Data-table labels and chart keyboard/hover gaps

**Priority:** Medium  
**Area:** Accessibility  

**Affected files:**

- `frontend/src/app/shared/components/data-table/data-table.component.html` (paginator `aria-label="Select"`; static checkbox label)
- `frontend/src/app/shared/components/crypto-card/` (mouse-only sparkline tooltip)
- `frontend/src/app/shared/components/crypto-card/crypto-chart/` (good `aria-live` OHLC — preserve)

**Observation**

Detailed chart already exposes OHLC via `aria-live` (good). Table labels are vague; compact sparkline hover is pointer-centric.

**Problem**

Screen reader/table UX weaker than visual UI; compact charts rely on color/hover.

**Standard / principle**

- UI/UX Pro Max chart guidance (OHLC text; not color alone; keyboard reveal)
- WCAG focus/name

**Recommended improvement**

- Specific aria-labels for paginator page size and row checkboxes (`Select {{symbol}}`).
- Ensure compact cards expose signed % text (already partial) and consider keyboard focus showing last point value.

**Implementation approach**

- Label fixes first (small).
- Compact chart keyboard enhancement only if Markets remains card-heavy.

**Expected benefit**

Better SR and keyboard parity on dense tables.

**Complexity:** Small–Medium  
**Risk:** Low  
**Dependencies:** None

---

#### [A11Y-03] Missing skip link; reduced-motion only on snackbars

**Priority:** Low  
**Area:** Accessibility  

**Affected files:**

- `frontend/src/index.html` / `base-layout`
- `crypto-card` pulse animations; layout width transitions
- `notification-stack` (already handles reduced motion)

**Observation**

No skip-to-content. Live price pulse and shell transitions ignore `prefers-reduced-motion`.

**Problem**

Motion-sensitive users get constant pulses; keyboard users tab through full chrome every time.

**Standard / principle**

- UI/UX Pro Max motion / focus-not-obscured
- TRADING_UI_CONTEXT motion tokens

**Recommended improvement**

Add skip link to main outlet; wrap decorative animations in reduced-motion queries.

**Implementation approach**

- One link in base-layout; SCSS media queries colocated with animations.

**Expected benefit**

Inclusive terminal chrome.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

### 5.10 Styling and design system

#### [STYLE-01] Token alias sprawl and unused purple secondary

**Priority:** Low  
**Area:** Styling  

**Affected files:**

- `frontend/src/styles/_tokens.scss`, `_colors.scss`, `_spacing.scss`, `_radius.scss`, `_typography.scss`, `_utilities.scss`
- TRADING_UI_CONTEXT still documents `--color-secondary: #8b5cf6`

**Observation**

Duplicate aliases (`--color-text` vs `--color-text-primary`, spacing dual API, radius xs≡sm). Purple secondary largely unused; Material expert warns against purple AI-default drift — here secondary is documented but not productized.

**Problem**

Agents pick random aliases; purple invites accidental accent use.

**Standard / principle**

- Material expert / TRADING_UI_CONTEXT (trading blue + semantic green/red)
- Ponytail (collapse duplicates when touching tokens)

**Recommended improvement**

Document preferred alias set; avoid new purple usages; optionally mark secondary as “reserved / unused” in TRADING_UI_CONTEXT rather than deleting tokens blindly.

**Implementation approach**

- Prefer semantic names in new code; no mass rename unless paired with a codemod.

**Expected benefit**

Less token bikeshedding.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

### 5.11 Performance

Covered primarily by [ARCH-01], [ARCH-02], [WS-01], [ANG-01], [ANG-02]. Additional note:

#### [PERF-01] Map clone on every miniTicker tick

**Priority:** Medium  
**Area:** Performance  

**Affected files:**

- `frontend/src/app/features/markets/markets.component.ts`
- `frontend/src/app/features/watchlist/watchlist-dialog/watchlist-dialog.component.ts`

**Observation**

Each tick does `new Map(tickers())` + `set`, invalidating broad computeds.

**Problem**

With many symbols, computeds for rows/movers recompute more than necessary.

**Standard / principle**

- Angular expert (fine-grained signals)
- Ponytail (fix shared hot path once)

**Recommended improvement**

After [ARCH-01] reduces symbol count, consider per-pair signals or immutable updates only for changed key. Avoid premature micro-optimization before fan-out fix.

**Implementation approach**

- First shrink subscription set; then profile; only then introduce per-symbol signal map if still hot.

**Expected benefit**

Smoother Markets under load.

**Complexity:** Medium  
**Risk:** Medium  
**Dependencies:** [ARCH-01], [ARCH-02]

---

### 5.12 Code consistency

#### [CONS-01] Trading fallback hard-coded cryptocurrencies

**Priority:** Medium  
**Area:** Consistency / Trust  

**Affected files:**

- `frontend/src/app/features/trading/trading.component.ts` (`fallbackCryptocurrencies`)

**Observation**

On API miss, trading can show hard-coded assets.

**Problem**

Educational app may display fake markets as if real — trust issue.

**Standard / principle**

- Angular expert (explicit error state)
- Ponytail (don’t paper over failures)

**Recommended improvement**

Remove fallbacks; show not-found / error + link back to Markets.

**Implementation approach**

- Delete array; bind existing empty card / snackbar.

**Expected benefit**

Honest trading route.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

#### [CONS-02] Partial barrels and mixed HTTP styles

**Priority:** Low  
**Area:** Consistency  

**Affected files:**

- `frontend/src/app/core/services/index.ts`
- Domain services using `firstValueFrom` vs Observable search pipelines

**Observation**

Barrel omits some services; HTTP style mixes async/await and Observables appropriately in places but inconsistently documented.

**Problem**

Minor import confusion only — not a structural defect.

**Standard / principle**

- Ponytail (don’t expand barrels for fashion)

**Recommended improvement**

Either document “import concrete paths” (current de facto) or complete the barrel — pick one. Keep Rx for search/WS; `firstValueFrom` for one-shot CRUD is fine.

**Implementation approach**

- Prefer concrete path imports (already common); avoid large barrel churn.

**Expected benefit**

Less ambiguity for agents.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

### 5.13 Types, models and utilities

#### [TYPE-01] Unused / orphan types and deprecated consts

**Priority:** Low  
**Area:** Types  

**Affected files:**

- `frontend/src/app/shared/components/crypto-card/crypto-card.types.ts` (`CryptoCardData` unused)
- `frontend/src/app/features/trading/trading.const.ts` (deprecated `TRADING_HEADER_ACTIONS`)
- Dashboard `TableColumn<any>`

**Observation**

Orphan types and `any` columns linger.

**Problem**

False API surface; weak typing on dashboard holdings if revived.

**Standard / principle**

- Learn2Trade guide (`*.types.ts` for real APIs)
- Angular expert (no `any`)

**Recommended improvement**

Delete unused exports; type holdings columns if [STATE-01] keeps the table.

**Implementation approach**

- Cleanup with the feature touch.

**Expected benefit**

Honest type surface.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [STATE-01], [COMP-02]

---

### 5.14 Error / loading / empty states

#### [UXS-01] No shared panel-level loading/error/empty pattern

**Priority:** High  
**Area:** UX / Maintainability  

**Affected files:**

- Markets, dashboard, crypto-chart, watchlist-dialog, data-table, crypto-currency-edit
- TRADING_UI_CONTEXT (per-panel skeletons + Retry)

**Observation**

Each feature invents a slightly different spinner/empty string; chart has error text without Retry; dashboard loading unbound; markets error→empty.

**Problem**

Inconsistent learner experience; repeated template logic.

**Standard / principle**

- TRADING_UI_CONTEXT
- UI/UX Pro Max loading/empty
- Ponytail — **prefer a tiny shared template pattern or directive only if ≥3 call sites**; otherwise copy one good panel pattern

**Recommended improvement**

1. Fix critical call sites ([STATE-01], [STATE-02], chart Retry).
2. Only if still duplicated, add a minimal `app-panel` slot convention (loading/error/empty projected content) — not a new state library.

**Implementation approach**

- Chart: add Retry button calling existing reload pipeline.
- Markets/dashboard: explicit branches.
- Avoid NgRx/component-store for this.

**Expected benefit**

Predictable async UX across the terminal.

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** [COMP-01] if panel slots are used

---

### 5.15 Maintainability and technical debt

#### [DEBT-01] No production environment twin

**Priority:** Medium  
**Area:** Maintainability  

**Affected files:**

- `frontend/src/app/core/env/environment.ts`
- `angular.json` fileReplacements (verify)

**Observation**

Only a dev `environment` with `production: false` was found.

**Problem**

Deployments risk pointing at wrong API if builds don’t replace env.

**Standard / principle**

- Angular conventions / agents.md validation discipline

**Recommended improvement**

Add `environment.prod.ts` + `fileReplacements` if missing; keep only `apiUrl` + `production` (Ponytail — no config framework).

**Implementation approach**

- Mirror Angular CLI default pattern already used by many repos.

**Expected benefit**

Safer production builds.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** None

---

#### [DEBT-02] Watchlist config stub and testing-ground scope

**Priority:** Low  
**Area:** Maintainability  

**Affected files:**

- `frontend/src/app/features/watchlist/watchlist-config/`
- `frontend/src/app/features/system/testing-ground/`

**Observation**

Config route is a stub; testing-ground demos neu + cards.

**Problem**

Stub routes in the main nav graph look like unfinished product if linked; testing-ground is fine as a lab if not linked in prod nav.

**Standard / principle**

- Ponytail / FILE_STRUCTURES (no speculative empty features)

**Recommended improvement**

Either implement minimal config (columns/sort preferences in localStorage) or remove route/CTA until needed. Keep testing-ground unlisted in sidebar (already).

**Implementation approach**

- Prefer remove/hide until real requirements exist.

**Expected benefit**

Less unfinished surface area.

**Complexity:** Small  
**Risk:** Low  
**Dependencies:** [ARCH-05]

---

## 6. Overengineering / Simplification Opportunities

| Item | Verdict | Action |
| --- | --- | --- |
| `WebSocketService` vs `BinanceMarketDataService` | **Remain** | Correct split; do not merge |
| Search provider token + GlobalSearchService | **Remain** | Multiple providers already |
| Custom snackbar stack | **Remain** | Intentional; don’t switch to MatSnackBar without product ask |
| `ApiService` (URL join only) | **Simplify OK** | Keep if useful for one base URL; don’t expand into HTTP wrapper |
| `setMiniTickerTargets` **plus** page `watchMiniTicker` for same pairs | **Simplify** | Pick one ownership model ([ARCH-02]) |
| `UsersService.getCurrentUserData` / auth wrappers | **Simplify** | Prefer `auth.currentUser()` after bootstrap where sufficient |
| `InvestmentsService.getById` (fetch all + find) | **Remain until backend by-id exists** | Don’t invent client cache layer |
| Angular `app-panel` / `app-status-chip` | **Removed (Phase 1)** | CSS primitives kept; reintroduce wrapper only with ≥2 consumers |
| `ActiveInvestmentComponent` | **Removed (Phase 1)** | Sell path uses table + confirmation dialog |
| Neumorphic directive | **Remain as lab or remove** | Not part of trading terminal language |
| Dual sparkline vs detailed chart | **Accept short-term** | Extract shared math only if duplication bites |
| NgRx / signals store | **Do not add** | Existing signals + services suffice |
| Second UI kit / custom table | **Do not add** | Fix Material overrides instead |
| Per-component WebSockets | **Do not add** | Violates CRYPTO_WEBSOCKETS |
| New empty `features/orders` / `features/admin` | **Do not add** | FILE_STRUCTURES + Ponytail |
| Tailwind npm package | **Do not add** | Explicit project decision — SCSS utilities already |

---

## 7. UI/UX Improvement Plan

### Visual hierarchy

- Keep Markets without `app-page-header` ([UX-02]); adopt `.app-panel` CSS for section chrome ([COMP-01]).
- Remove double elevation (`mat-card` + elevated table) on trading.
- Remove no-op dashboard header actions or wire them ([STATE-01]).

### Trading / financial data presentation

- One number formatter + tabular nums ([UX-03]).
- One up/down vocabulary + signed values; zero = neutral ([UX-04]).
- Keep detailed Lightweight Charts candlesticks (UI/UX Pro Max recommends this library for OHLC); preserve OHLC `aria-live` text.

### Navigation

- Fix inert admin sidebar links ([ARCH-05]).
- Markets icon not `home` ([UX-02]).
- Bottom nav `aria-current` ([RESP-02]).
- Clarify watchlist: dialog is primary; config stub should not pretend to be ready ([DEBT-02]).

### Interaction feedback

- Confirm sell ([UX-05]).
- Chart Retry ([UXS-01]).
- Focus rings on custom controls ([A11Y-01]).
- Prefer Material button states over `.btn` background-only focus ([MAT-02]).

### Responsive design

- Unify breakpoints to token scale + documented 768 shell ([RESP-01]).
- Keep mobile bottom nav task-focused (already present) — don’t miniaturize full terminal.

### Accessibility

- Brand-independent: focus, skip link, reduced motion, labeled table controls ([A11Y-01]–[A11Y-03], [A11Y-02]).
- Analytics contrast tokens ([UX-06]).

### Consistency

- Learn2Trade naming on auth ([UX-01]).
- Forms: outline Material + reactive ([ANG-04]).
- Notifications already consistent — keep.

### Empty / loading / error states

- Markets error ≠ empty ([STATE-02]).
- Dashboard bind loading + real empty ([STATE-01]).
- Panel-level Retry pattern ([UXS-01]).

### Charts and market visualization

- Markets sparklines: keep for browse density; ensure signed % text.
- Trading chart: keep intervals/indicators; add Retry; honor reduced motion for nonessential pulses.
- Dashboard: do not fake charts — show real sold history list or omit ([STATE-01]).

---

## 8. Architectural Target State

No rewrite. Same folders and URLs. Tighter ownership and adoption of existing primitives.

```text
Frontend (target)
│
├── Core
│   ├── layout (base-layout, sidebar, navbar/global-search)
│   ├── search (providers + ranking)
│   ├── websocket (transport)
│   ├── binance (REST + ref-counted market-data; ONLY price I/O to Binance)
│   ├── services (auth/session-clear, domain HTTP, notifications, watchlist)
│   ├── guards / models / utils / env(prod+dev)
│   └── (no NgRx)
│
├── Shared
│   ├── page-header (where needed); .app-panel / .status-chip CSS primitives
│   ├── data-table (Material overrides, not private DOM)
│   ├── crypto-card (thinner; optional live inputs; chart colocated)
│   ├── dialogs + snackbar stack
│   └── directives only if multi-use
│
└── Features
    ├── markets     → discovery; page owns ticker set for browse/movers
    ├── trading     → asset workstation; confirm destructive; no fake fallbacks
    ├── dashboard   → real overview + loading/empty; honest actions
    ├── portfolio   → profile/wallet/user tables; admin entry wired or extracted later
    ├── watchlist   → dialog primary; config only when real
    ├── auth        → Learn2Trade brand; Material forms
    └── system      → not-found + testing-ground lab
```

**Responsibilities**

| Layer | Does | Does not |
| --- | --- | --- |
| Core binance | All Binance WS/REST | UI rendering |
| Features | Route UX, feature dialogs, page composition | Open sockets |
| Shared | Presentation + genuinely reused widgets | Own admin/auth business rules (minimize) |

---

## 9. Implementation Roadmap

### Phase 1 — High-value low-risk cleanup

- [x] `[UX-01]` Replace CryptoWatcher auth copy with Learn2Trade.
- [x] `[UX-02]` Keep Markets without `app-page-header`; fix Markets sidebar icon (`show_chart`); document page-header exception.
- [x] `[ARCH-05]` Wire Crypto admin to `/admin/crypto-currencies/new`; remove inert Users/Settings links.
- [x] `[STATE-02]` Markets explicit error + Retry (stop mapping errors to empty).
- [x] `[CONS-01]` Remove trading hard-coded fallback cryptos.
- [x] `[UX-05]` Confirm sell via `app-confirmation-dialog`.
- [x] `[A11Y-01]` Restore `:focus-visible` on `.btn` / column filters.
- [x] `[UX-06]` Fix analytics-card hardcoded light greys → tokens.
- [x] `[ANG-03]` Remove Trading duplicate `paramMap` listener (route via `toSignal` + `effect`).
- [x] `[COMP-03]` Delete unused `active-investment`.
- [x] `[TYPE-01]` Delete unused `CryptoCardData` / deprecated `TRADING_HEADER_ACTIONS`.
- [x] Delete unused Angular `panel` / `status-chip` components (keep CSS primitives).

### Phase 2 — Architectural consistency (data / WS / auth)

- [x] `[ARCH-03]` Add `BinanceRestService.getTickerPrice`; remove dashboard/price-alerts duplicate fetch/mappers.
- [x] `[ARCH-01]` Markets uses `setMiniTickerTargets` + `latestTickers` (catalog targets for movers); docs updated. Further catalog sampling deferred until needed.
- [x] `[ARCH-02]` Markets owns tickers; cards take `externalTicker` (no double watches on Markets).
- [x] `[WS-01]` Migrate price-alerts monitoring to miniTicker watches.
- [x] `[ARCH-04]` Unify session clear between interceptor / AuthService / guard; purify `isSessionExpired`.
- [x] `[DEBT-01]` Add production environment + fileReplacements if missing.
- [x] `[STATE-01]` Dashboard: bind loading; wire holdings table; remove dead metrics/no-op actions.

### Phase 3 — UI/UX consistency

- [x] `[COMP-01]` Adopt `.app-panel` CSS on trading + portfolio + dashboard; remove double `mat-card` chrome.
- [x] `[MAT-02]` Migrate `page-header` + primary actions to Material buttons; portfolio funds to `mat-form-field`.
- [x] `[ANG-04]` Reactive outline forms for invest + alert dialogs; show available balance.
- [x] `[UX-03]` Centralize number formatting + tabular nums on tables/prices.
- [x] `[UX-04]` Standardize `.price-up` / `.price-down` + signed values; zero neutral.
- [x] `[UXS-01]` Chart Retry; align empty copy (movers vs no DB data).
- [x] `[RESP-02]` Bottom nav `aria-current`; delete unused `trading-workspace` utilities.

### Phase 4 — Performance and Angular honesty

- [x] `[ANG-01]` CryptoCard live fields → signals.
- [x] `[ANG-02]` Precompute sidebar/data-table/analytics template helpers.
- [x] `[PERF-01]` Profile Markets tick path; only then per-pair signal map if needed.
- [x] `[MAT-01]` Move data-table / movers / navbar Material hacks into `_material-overrides.scss`.
- [x] `[COMP-02]` Incremental crypto-card thinning (optional live inputs / watchlist outputs).
- [x] `[WS-02]` Consider idle disconnect timeout after subscribe set is stable.

### Phase 5 — Polish and technical debt

- [x] `[RESP-01]` Converge breakpoints on tokens + 768 shell.
- [x] `[A11Y-02]` Richer table aria-labels; compact chart keyboard value reveal if still needed.
- [x] `[A11Y-03]` Skip link + reduced-motion for pulses/transitions.
- [x] `[STYLE-01]` Document preferred token aliases; avoid new purple accents.
- [x] `[DEBT-02]` Remove or implement watchlist config stub.
- [x] `[ARCH-06]` Finish doc drift cleanup post WS changes.
- [x] `[CONS-02]` Document import style (concrete paths).

---

## 10. Priority Matrix

| ID | Improvement | Priority | Effort | Risk | Impact |
| --- | --- | --- | --- | --- | --- |
| ARCH-01 | Markets WS fan-out to page+movers | Critical | Medium | Medium | High |
| ARCH-02 | Single miniTicker owner on Markets | High | Medium | Medium | High |
| ARCH-03 | Unify Binance REST ticker paths | High | Medium | Low | High |
| WS-01 | Alerts via miniTicker | High | Medium | Medium | High |
| ARCH-04 | Auth session state sync | High | Small | Medium | High |
| STATE-01 | Dashboard honesty (loading/actions/data) | High | Medium | Low | High |
| STATE-02 | Markets error ≠ empty | High | Small | Low | High |
| UXS-01 | Async state pattern + chart Retry | High | Medium | Low | High |
| COMP-01 | Adopt panel/status-chip | High | Medium | Low | High |
| MAT-01 | Remove private Material DOM hacks | High | Medium | Medium | High |
| MAT-02 | End dual button/input kits | High | Medium | Medium | High |
| UX-01 | Learn2Trade auth brand | High | Small | Low | Medium |
| UX-03 | Numeric formatting system | High | Medium | Low | High |
| A11Y-01 | Focus rings on custom controls | High | Small | Low | High |
| ANG-01 | CryptoCard signals for live state | High | Medium | Medium | Medium |
| ARCH-05 | Admin nav IA | Medium | Small | Low | Medium |
| ANG-02 | Template method hotspots | Medium | Medium | Low | Medium |
| ANG-03 | Rx cleanup consistency | Medium | Small | Low | Medium |
| ANG-04 | Reactive Material forms | Medium | Medium | Low | Medium |
| COMP-02 | Thin crypto-card | Medium | Large | Medium | Medium |
| UX-02 | Markets header + icon | Medium | Small | Low | Medium |
| UX-04 | P&L class vocabulary | Medium | Small | Low | Medium |
| UX-05 | Confirm sell | Medium | Small | Low | Medium |
| UX-06 | Analytics contrast/content | Medium | Small | Low | Medium |
| RESP-01 | Breakpoint convergence | Medium | Medium | Medium | Medium |
| CONS-01 | Remove trading fallbacks | Medium | Small | Low | Medium |
| DEBT-01 | Prod environment | Medium | Small | Low | Medium |
| PERF-01 | Tick Map granularity | Medium | Medium | Medium | Medium |
| WS-02 | Idle disconnect | Low | Small | Medium | Low |
| ARCH-06 | Doc/brand package drift | Low | Small | Low | Low |
| COMP-03 | Dead components cleanup | Low | Small | Low | Low |
| RESP-02 | Bottom nav a11y / workspace utils | Low | Small | Low | Low |
| A11Y-02 | Table/chart a11y polish | Low | Medium | Low | Medium |
| A11Y-03 | Skip link + reduced motion | Low | Small | Low | Medium |
| STYLE-01 | Token alias hygiene | Low | Small | Low | Low |
| TYPE-01 | Orphan types | Low | Small | Low | Low |
| CONS-02 | Barrel/import policy | Low | Small | Low | Low |
| DEBT-02 | Watchlist config stub | Low | Small | Low | Low |

---

## 11. Quick Wins

These are good first-session candidates (small, low risk, visible or structural value):

1. **`[UX-01]`** Learn2Trade auth headings.
2. **`[UX-02]`** Markets sidebar icon (no page-header).
3. **`[STATE-02]`** Markets load error + Retry.
4. **`[CONS-01]`** Remove trading fallback coins.
5. **`[UX-05]`** Sell confirmation dialog.
6. **`[A11Y-01]`** Focus-visible on `.btn` / filters.
7. **`[UX-06]`** Analytics-card token colors.
8. **`[ARCH-05]`** Fix or hide admin sidebar links.
9. **`[ANG-03]`** Drop duplicate Trading `paramMap` subscribe.
10. **`[COMP-03]` / `[TYPE-01]`** Delete unused active-investment + orphan types.
11. **`[ARCH-03]` (partial)** Dashboard uses `toBinancePair` + `BinanceRestService` ticker helper.

---

## 12. Improvements NOT Recommended

| Idea | Why not |
| --- | --- |
| Add NgRx / Akita / ComponentStore | Signals + feature services already cover app size; Ponytail forbids speculative state layers |
| Per-component WebSockets | Explicitly rejected by CRYPTO_WEBSOCKETS; reconnect thrash returns |
| Replace Angular Material with custom UI kit or shadcn port | Material expert + stack already Material; ui-styling skill is not the app stack |
| Install Tailwind npm package | Project ships SCSS utility helpers by design (`learn2trade.mdc`) |
| Rewrite crypto-card from scratch | Incremental thinning is enough; full rewrite risk &gt; benefit |
| Create empty `features/orders` or `features/admin` | FILE_STRUCTURES: no empty placeholders; wire existing routes first |
| Replace custom snackbar with MatSnackBar | Working single path; swap is churn without product ask |
| Switch charts away from Lightweight Charts | Already correct library for OHLC (UI/UX Pro Max); keep |
| Zoneless migration as a blanket project | Angular expert: don’t broad-migrate unless tasked; fix signal honesty first |
| New design-system package / Storybook / token build pipeline | Tokens already in SCSS; extra tooling not justified yet |
| Merge WebSocketService into BinanceMarketDataService | Transport/domain split is a strength |
| Global CSS reset of all breakpoints in one PR | High layout risk; converge opportunistically ([RESP-01]) |
| Purple accent “refresh” | Conflicts with trading-blue identity and Material expert guidance |

---

## 13. Final Recommended Order

**Do first**

1. Quick wins: brand, Markets header/error, sell confirm, focus rings, admin nav honesty, remove fake trading fallbacks.
2. `[ARCH-03]` Unify Binance REST ticker access.
3. `[ARCH-01]` + `[ARCH-02]` Markets WS fan-out and single live-price owner.
4. `[ARCH-04]` Auth session clear consistency.
5. `[STATE-01]` Dashboard loading/actions/data honesty.

**Do next**

6. `[WS-01]` Price alerts on miniTicker.
7. `[COMP-01]` + `[MAT-02]` + `[ANG-04]` Panel/chip adoption, Material controls, reactive dialogs.
8. `[UX-03]` + `[UX-04]` Numbers and P&L vocabulary.
9. `[MAT-01]` Material overrides hygiene.
10. `[UXS-01]` Chart Retry + aligned async states.

**Do later**

11. `[ANG-01]` + `[ANG-02]` + `[PERF-01]` Signal honesty and CD hotspots.
12. `[COMP-02]` Incremental crypto-card thinning.
13. `[RESP-01]` Breakpoint convergence.
14. `[WS-02]` Idle disconnect (careful).
15. Broader a11y polish (`[A11Y-02]`, `[A11Y-03]`).

**Optional**

16. Watchlist config productization or deletion (`[DEBT-02]`).
17. Package rename away from `cryptowatcher-app`.
18. Neumorphism removal if lab is unwanted.
19. Token alias consolidation docs (`[STYLE-01]`).

---

### Execution note

Plan saved for implementation. Recommended follow-up modes:

1. **Subagent-driven** — one finding/phase task per subagent with review between tasks (`superpowers:subagent-driven-development`).
2. **Inline execution** — batch Phase 1 quick wins in this session with checkpoints (`superpowers:executing-plans`).

Do not start implementation until you explicitly choose an approach and scope (e.g. “Phase 1 only”).
