# App shell + plans mirror — design

**Date:** 2026-10-07  
**Status:** Approved for planning  
**Related review:** `frontend/docs/review/architecture/01-app-shell.md`

---

## 1. Purpose

1. Establish a **cherry-pick tracking tree** under `frontend/docs/plans/` that mirrors `frontend/docs/review/`, so progress through the snapshot review can be marked page-by-page.
2. Capture and implement the first improvements from the app-shell review: remove legacy branding residue, keep nested layout routes (enabling chrome-free auth), introduce a minimal AuthLayout, and arm price alerts after auth is ready — not from a fat `AppComponent`.

---

## 2. Goals / non-goals

### Goals (this pass)

- Plans mirror convention + `00-index.md` + `architecture/01-app-shell-improvements.md`
- Remove unused `AppComponent.title = 'cryptowatcher-app'` and update/remove the unit assertion
- Keep **layout-as-parent-route** pattern (root `RouterOutlet` selects shell; shell outlet selects feature)
- Add `AuthLayoutComponent` (minimal: centered host + `<router-outlet />`)
- Move `/login`, `/register`, `/banned` under AuthLayout (no sidebar/navbar)
- Keep trading/guest browsing routes under `BaseLayoutComponent`
- Stop calling `PriceAlertsService.start()` from `AppComponent`; arm after auth bootstrap settles
- Update SoT pointers (`FILE_STRUCTURES.md`, `learn2trade.mdc`) for dual layout
- Document **guest markets-only** as Future work in the improvements note (not implemented now)

### Non-goals

- Guest sign-in / anonymous markets-only role (Future only)
- Auth page visual redesign / marketing shell
- Flattening `BaseLayout` into `AppComponent`
- Idle WS disconnect, NgRx, package rename

---

## 3. Plans mirror convention

```text
frontend/docs/plans/
├── 00-index.md
├── frontend-improvement-plan.md          # existing phased backlog (unchanged role)
├── architecture/
│   └── 01-app-shell-improvements.md
├── core/          # created as review continues
├── shared/
└── features/
```

**Naming rule:** for `docs/review/<path>/<name>.md` → `docs/plans/<path>/<name>-improvements.md`.

**Improvements file template (minimum):**

1. Link to corresponding review page  
2. Status (`todo` / `in progress` / `done`)  
3. Do now (checklist)  
4. Decision log  
5. Future (optional)

`00-index.md` lists how to use the tree and which improvement pages exist / their status.

---

## 4. Shell & routing design

### 4.1 Why nested outlets stay

Root outlet chooses **which shell** mounts; shell outlet swaps **features** while chrome persists.

Use case that justifies not hard-coding `BaseLayout` in `AppComponent`: auth screens without trading chrome. Future guest browsing still uses BaseLayout for markets; login/register/banned use AuthLayout.

### 4.2 Target tree

```text
AppComponent
├── RouterOutlet (root)
└── NotificationStackComponent

Root routes:
├── path: '' → BaseLayoutComponent
│     children: markets, dashboard, profile, edit-profile,
│               crypto/:id, admin/*, testing-ground, **
└── path: '' (sibling group) OR dedicated auth parent
      → AuthLayoutComponent
          children: login, register, banned
```

**Route shape (normative intent):**

```ts
export const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [ /* feature routes except auth/banned */ ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', loadComponent: …, canActivate: [authGuard] },
      { path: 'register', loadComponent: …, canActivate: [authGuard] },
      { path: 'banned', loadComponent: … },
    ],
  },
];
```

URLs stay `/login`, `/register`, `/banned` (no `/auth/` prefix unless later desired).

### 4.3 AuthLayout

- Location: `frontend/src/app/core/layout/auth-layout/`
- Template: centered main region + `<router-outlet />` only  
- No sidebar, navbar, skip-link chrome beyond what accessibility needs (skip link optional; prefer keep simple)
- Page components retain their own forms/copy

### 4.4 AppComponent

- Remove `title` field and cryptowatcher spec  
- Remove `PriceAlertsService` inject/start  
- Remain: root outlet + notification stack  

---

## 5. Price alerts arming

`PriceAlertsService` already:

- Uses `started` gate + `effect` on `auth.currentUser()`
- Clears watches when logged out
- Loads alerts only when `uid` is set

**Change:** call `start()` once after auth bootstrap has produced a defined user signal (`null` or `UserMe`), not from UI hosts.

**Preferred:** chain in `app.config.ts` initializer:

```ts
provideAppInitializer(async () => {
  const auth = inject(AuthService);
  const priceAlerts = inject(PriceAlertsService);
  await auth.bootstrap();
  priceAlerts.start();
});
```

(Replace or extend the existing auth-only initializer so bootstrap still runs once.)

Do **not** start from `BaseLayoutComponent` or `AuthLayoutComponent`.

---

## 6. Future: guest markets-only

Document in `01-app-shell-improvements.md` under **Future**:

- User can enter as guest (explicit guest session or anonymous mode — exact mechanism TBD later)
- Capability limited to **viewing markets** (and related read-only market UI)
- No invest, sell, alerts CRUD, watchlist mutations, portfolio funds, admin
- Guest still uses **BaseLayout** for markets; AuthLayout remains for full login/register
- May require guard/capability matrix beyond today’s `authGuard` public-route list

Not part of the implementation plan’s code tasks for this pass.

---

## 7. Docs / rules updates

| File | Change |
| --- | --- |
| `docs/FILE_STRUCTURES.md` | Dual layout: BaseLayout + AuthLayout; AppComponent hosts root outlet + snackbars only |
| `.cursor/rules/learn2trade.mdc` | Same hierarchy; “do not put sidebar/navbar in AppComponent” unchanged |
| `docs/plans/architecture/01-app-shell-improvements.md` | Full do-now + future guest note |
| `docs/review/architecture/01-app-shell.md` | Optional later refresh after code lands (not required in same PR) |

---

## 8. Testing

- Manual: auth routes have no sidebar/navbar; markets still have shell  
- Manual: login → dashboard; logout → login without trading chrome  
- Alerts: logged-in user with alerts still receives notifications; logged-out has no ticker watches for alerts  
- `npm run build` + `npm run test:unit`  
- Update `app.component.spec.ts` (remove cryptowatcher title test; keep create smoke)

---

## 9. Delivery order

1. Write plans mirror (`00-index`, `01-app-shell-improvements`)  
2. AuthLayout + route split + AppComponent cleanup + alerts initializer  
3. SoT doc/rule updates  
4. Verify build/tests  

---

## 10. Resolved decisions

| Topic | Choice |
| --- | --- |
| Plans location | `frontend/docs/plans/` mirror of review |
| Nested shells | Keep (AuthLayout use case) |
| Auth routes | login, register, banned |
| AuthLayout chrome | Minimal (A) |
| Delivery | Docs-first track + one shell PR |
| Guest mode | Future note only |
