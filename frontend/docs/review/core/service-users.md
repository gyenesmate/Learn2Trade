> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Users service

**Source:** `frontend/src/app/core/services/users.service.ts`

## Role

User/account HTTP adapter. It normalizes numeric profile fields, reuses the auth user cache, refreshes auth state after profile/wallet/admin mutations, and performs client-side admin checks before ban operations.

## API surface

- `getAll`, `getCurrentUserData`, `updateProfile`
- `addCurrencyToBalance`, `subtractCurrencyFromBalance`
- `isCurrentUserAdmin`, `banByUid`, `unbanByUid`

## Connected to

- `ApiService`, `AuthService`, navbar/profile/portfolio, and `adminGuard`.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — shared HTTP in existing core services.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — user API concerns stay in `core/services/`.
