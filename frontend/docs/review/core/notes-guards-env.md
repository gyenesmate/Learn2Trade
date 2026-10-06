> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Guards and environments

**Source:** `frontend/src/app/core/guards/auth.guard.ts`, `admin.guard.ts`, `frontend/src/app/core/env/environment.ts`, `environment.prod.ts`, `frontend/angular.json`

## Role

The functional route guards enforce initialized authentication and admin access. Environment files provide build-selected API configuration; production builds replace `environment.ts` with `environment.prod.ts` through Angular CLI `fileReplacements`.

## API surface

- `authGuard` waits until `AuthService.currentUser` leaves `undefined`, clears expired sessions, allows signed-out access only to `/login` and `/register`, redirects protected visitors to `/login`, and redirects signed-in users away from public auth routes to `/dashboard`.
- `adminGuard` asks `UsersService.isCurrentUserAdmin()` and redirects non-admin users to `/markets`.
- Both environments expose `{ production, apiUrl }`; `ApiService` consumes `apiUrl`.
- `angular.json` production `fileReplacements` swaps the environment file. The current production API URL is still localhost and must be overridden for a real deployment.

## Connected to

- `app.routes.ts` composes `authGuard` and `adminGuard`.
- `AuthService`, `UsersService`, `ApiService`, and `authInterceptor`.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — functional guards and cancellable/initialized auth reads.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — guards and environment config remain under their core folders.

## Diagram

```mermaid
flowchart TD
  Route[Route activation] --> Auth{authGuard}
  Auth -->|signed out + protected| Login[/login]
  Auth -->|signed in + public auth route| Dashboard[/dashboard]
  Auth -->|allowed| Admin{adminGuard when configured}
  Admin -->|admin| Page[Activate route]
  Admin -->|not admin| Markets[/markets]
  Build[Production build] --> Replace[environment.ts → environment.prod.ts]
  Replace --> API[ApiService baseUrl]
```

## Notes / smells

- `adminGuard` performs imperative navigation and returns `false`, unlike `authGuard`, which returns a `UrlTree`.
