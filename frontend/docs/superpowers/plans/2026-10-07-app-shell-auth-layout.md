# App Shell Auth Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a plans-mirror for review cherry-picks, introduce a minimal AuthLayout for login/register/banned, thin AppComponent, and arm PriceAlerts after auth bootstrap.

**Architecture:** Keep nested layout routes: root `RouterOutlet` selects `BaseLayoutComponent` or `AuthLayoutComponent`; each shell’s outlet hosts feature pages. AppComponent keeps only the root outlet + notification stack. `PriceAlertsService.start()` runs once after `AuthService.bootstrap()` in `provideAppInitializer`.

**Tech Stack:** Angular 22 standalone components, `Routes` / `loadComponent`, Material (unchanged on auth pages), Vitest via `ng test`.

**Spec:** `frontend/docs/superpowers/specs/2026-10-07-app-shell-auth-layout-design.md`

## Global Constraints

- Do not put sidebar/navbar in `AppComponent`
- Do not use `app-shell` or `*-page` naming — use `auth-layout` / `AuthLayoutComponent`
- AuthLayout is minimal: centered host + `<router-outlet />` only (no brand chrome in this pass)
- Auth routes under AuthLayout: `/login`, `/register`, `/banned` (URLs unchanged)
- Guest markets-only mode is **Future only** — document in improvements note, do not implement
- Commit only when the user explicitly asks
- Prefer smallest correct diffs; update SoT docs that describe the shell hierarchy

### File map

| Path | Responsibility |
| --- | --- |
| `docs/plans/00-index.md` | How to use plans mirror + status |
| `docs/plans/architecture/01-app-shell-improvements.md` | Do-now checklist + future guest |
| `core/layout/auth-layout/*` | Minimal auth shell |
| `app.routes.ts` | Dual parent layouts |
| `app.component.ts` / `.spec.ts` | Thin root; drop cryptowatcher title |
| `app.config.ts` | bootstrap then `priceAlerts.start()` |
| `FILE_STRUCTURES.md`, `learn2trade.mdc` | Dual-layout hierarchy |

---

### Task 1: Plans mirror + app-shell improvements note

**Files:**
- Create: `frontend/docs/plans/00-index.md`
- Create: `frontend/docs/plans/architecture/01-app-shell-improvements.md`
- Leave: `frontend/docs/plans/frontend-improvement-plan.md` as-is

**Interfaces:**
- Consumes: Spec §3, §6, §9
- Produces: Tracking docs for this workstream

- [ ] **Step 1: Write `00-index.md`**

Include:
- Purpose: cherry-pick tracking mirror of `docs/review/`
- Naming rule: `<review-name>-improvements.md`
- Link to existing `frontend-improvement-plan.md`
- Table with at least `architecture/01-app-shell-improvements.md` status `in progress`

- [ ] **Step 2: Write `01-app-shell-improvements.md`**

Must include:
1. Link to `../../review/architecture/01-app-shell.md`
2. Status: `in progress`
3. **Do now** checklist matching this plan (title removal, AuthLayout, alerts arming, SoT updates)
4. **Decision log** — nested shells kept for chrome-free auth
5. **Future** — guest markets-only (view markets; no invest/alerts/watchlist/portfolio mutations; BaseLayout for markets; AuthLayout for full login)

- [ ] **Step 3: Verify files exist**

```powershell
Test-Path frontend/docs/plans/00-index.md
Test-Path frontend/docs/plans/architecture/01-app-shell-improvements.md
```

Expected: `True` / `True`

---

### Task 2: AuthLayout component

**Files:**
- Create: `frontend/src/app/core/layout/auth-layout/auth-layout.component.ts`
- Create: `frontend/src/app/core/layout/auth-layout/auth-layout.component.html`
- Create: `frontend/src/app/core/layout/auth-layout/auth-layout.component.scss`

**Interfaces:**
- Consumes: Angular `RouterOutlet`, OnPush, `inject` patterns from `base-layout`
- Produces: `AuthLayoutComponent` selector `app-auth-layout`

- [ ] **Step 1: Create component class**

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
```

- [ ] **Step 2: Template + styles**

HTML:

```html
<main class="auth-layout">
  <router-outlet />
</main>
```

SCSS (minimal centering; use tokens):

```scss
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--color-background);
}
```

- [ ] **Step 3: Sanity** — file paths match `core/layout/auth-layout/` (no empty sibling folders)

---

### Task 3: Split routes + thin AppComponent + alerts initializer

**Files:**
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/app.component.ts`
- Modify: `frontend/src/app/app.component.spec.ts`
- Modify: `frontend/src/app/app.config.ts`

**Interfaces:**
- Consumes: `AuthLayoutComponent`, `BaseLayoutComponent`, `AuthService`, `PriceAlertsService`
- Produces: Dual-layout route tree; alerts armed after bootstrap

- [ ] **Step 1: Rewrite `app.routes.ts`**

Structure (keep existing `loadComponent` / guard imports; only move auth routes):

```ts
export const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', redirectTo: 'markets', pathMatch: 'full' },
      // dashboard, markets, profile, edit-profile,
      // crypto/:id, admin/*, testing-ground, **
      // — same as today, WITHOUT login/register/banned
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('@features/auth/login/login.component').then((m) => m.LoginComponent),
        canActivate: [authGuard],
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@features/auth/register/register.component').then((m) => m.RegisterComponent),
        canActivate: [authGuard],
      },
      {
        path: 'banned',
        loadComponent: () =>
          import('@features/auth/banned/banned.component').then((m) => m.BannedComponent),
      },
    ],
  },
];
```

Import `AuthLayoutComponent` from `@core/layout/auth-layout/auth-layout.component`.

- [ ] **Step 2: Thin `AppComponent`**

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationStackComponent } from '@shared/components/app-snackbar/notification-stack.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationStackComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {}
```

Template unchanged: `<router-outlet />` + `<app-notification-stack />`.

- [ ] **Step 3: Update `app.component.spec.ts`**

- Keep `should create the app`
- Keep `should render the root router outlet`
- **Delete** the `cryptowatcher-app` title test entirely
- Mock/provide whatever is needed so create still works (router already provided)

If `NotificationStackComponent` / services require extra providers, add the minimal mocks already used elsewhere — do not reintroduce `PriceAlertsService` into AppComponent for the test.

- [ ] **Step 4: Chain alerts after auth bootstrap in `app.config.ts`**

Replace:

```ts
provideAppInitializer(() => inject(AuthService).bootstrap()),
```

with:

```ts
provideAppInitializer(async () => {
  // inject() before any await — post-await is not an injection context (NG0203).
  const auth = inject(AuthService);
  const priceAlerts = inject(PriceAlertsService);
  await auth.bootstrap();
  priceAlerts.start();
}),
```

Add import: `import { PriceAlertsService } from '@core/services/price-alerts.service';`

- [ ] **Step 5: Build**

```powershell
cd frontend; npm run build
```

Expected: success (budget warnings OK if pre-existing).

---

### Task 4: SoT docs + improvements status

**Files:**
- Modify: `frontend/docs/FILE_STRUCTURES.md` (hierarchy / AppComponent rules / layout section)
- Modify: `frontend/.cursor/rules/learn2trade.mdc` (tree blurb)
- Modify: `frontend/docs/plans/architecture/01-app-shell-improvements.md` (status → note code landed / checklist progress)
- Modify: `frontend/docs/plans/00-index.md` (status update)

**Interfaces:**
- Consumes: Completed Tasks 2–3
- Produces: Docs aligned with dual layout

- [ ] **Step 1: Update FILE_STRUCTURES**

- AppComponent: root outlet + notification stack only (no alert start, no title)
- Add `auth-layout/` under `core/layout/`
- State: main features remain BaseLayout children; login/register/banned under AuthLayout
- Keep “do not put Sidebar/Navbar into AppComponent”

- [ ] **Step 2: Update learn2trade.mdc**

Short hierarchy:

```text
AppComponent (root outlet + global hosts)
  → RouterOutlet
       → BaseLayoutComponent | AuthLayoutComponent
            → feature RouterOutlet
```

- [ ] **Step 3: Mark improvements note**

Update do-now checklist items to done where completed; leave Future guest section untouched; set status appropriately (`done` if all do-now complete).

- [ ] **Step 4: Unit tests**

```powershell
cd frontend; npm run test:unit
```

Expected: all pass (including updated AppComponent specs).

---

### Task 5: Manual verification checklist + handoff

**Files:** none required

- [ ] **Step 1: Manual route check** (dev server if available)

- `/login`, `/register`, `/banned` — no sidebar, no navbar  
- `/markets` — BaseLayout chrome present  
- Login as user → lands on dashboard/markets with shell; alerts behavior unchanged when alerts exist  

- [ ] **Step 2: Handoff summary**

Report: files touched, guest Future still docs-only, remind not to commit unless asked.

---

## Self-review (plan vs spec)

| Spec item | Task |
| --- | --- |
| Plans mirror + naming | 1 |
| AuthLayout minimal | 2 |
| Route split login/register/banned | 3 |
| Thin AppComponent / remove cryptowatcher | 3 |
| Alerts after bootstrap | 3 |
| SoT updates | 4 |
| Guest Future docs only | 1, 4 |
| Verify build/tests | 3, 4 |

No TBD implementation steps. Guest mechanism intentionally deferred.
