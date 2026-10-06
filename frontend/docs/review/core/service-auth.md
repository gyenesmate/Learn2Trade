> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Auth service

**Source:** `frontend/src/app/core/services/auth.service.ts`

## Role

Owns client authentication state and the one-hour local session policy. `currentUser` uses `undefined` while bootstrapping, `null` when signed out, and `UserMe` when signed in; `isLoggedIn` is derived. Login/register store the token, bootstrap validates it through `/auth/me`, and logout always clears client state.

## API surface

- `bootstrap`, `login`, `register`, `refreshUserData`, `logout`
- `currentUser`, `isLoggedIn`, `getCurrentUserData`
- `isSessionExpired()` is a pure check.
- `clearClientSession()` removes token/login time, stops expiry polling, and sets the user to `null` without an API call.

## Connected to

- `ApiService`, `TokenStorageService`, `HttpClient`; app initializer, auth interceptor, guards, users and user-scoped services.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — readonly/derived signal state and functional consumers.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — app-wide auth remains in core services.

## Notes / smells

- Expiry is checked by a one-minute interval; the live TODO suggests one calculated timeout instead.
