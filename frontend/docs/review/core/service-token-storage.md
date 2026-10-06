> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Token storage service

**Source:** `frontend/src/app/core/services/token-storage.service.ts`

## Role

Thin `localStorage` boundary for the access token and its login timestamp. Writing a token refreshes the timestamp; clearing removes both keys.

## API surface

- `getAccessToken`, `setAccessToken`, `clear`
- `getLoginTime()` parses the stored integer and returns `null` for missing or invalid data.

## Connected to

- `AuthService` manages session lifecycle.
- `authInterceptor` reads the token only for Learn2Trade API requests.

## Rules that apply

- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — shared auth persistence remains in core services.
