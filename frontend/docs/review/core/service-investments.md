> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Investments service

**Source:** `frontend/src/app/core/services/investments.service.ts`

## Role

Current-user investment HTTP adapter. It normalizes API numeric fields, reads user-scoped holdings, creates and sells investments, then refreshes auth user data so balance/profit state stays current.

## API surface

- `getAll`, `getById`, `getByUserId`
- `getActiveByUserAndCrypto`
- `create`, `sell`

## Connected to

- `ApiService`, `AuthService`; Dashboard, Trading, and Portfolio.

## Rules that apply

- [`angular-guide.mdc`](../../../.cursor/rules/angular-guide.mdc) — centralize shared HTTP and numeric normalization.
- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — app-wide investment API access stays in core services.

## Notes / smells

- `_userId` parameters are compatibility placeholders; endpoints are explicitly current-user (`/me`).
