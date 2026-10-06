> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# API service

**Source:** `frontend/src/app/core/services/api.service.ts`

## Role

Central URL builder for the Learn2Trade HTTP API. It reads `environment.apiUrl`, strips one trailing slash, and joins paths with exactly one leading slash.

## API surface

- `baseUrl` — normalized environment API origin.
- `url(path)` — absolute app-API URL for relative or slash-prefixed paths.

## Connected to

- Auth, users, crypto currencies, investments, price alerts, and watchlist services.
- `authInterceptor` recognizes the same API origin before attaching a bearer token.

## Rules that apply

- [`learn2trade.mdc`](../../../.cursor/rules/learn2trade.mdc) / [`FILE_STRUCTURES.md`](../../FILE_STRUCTURES.md) — shared HTTP base behavior belongs in `core/services/`.
