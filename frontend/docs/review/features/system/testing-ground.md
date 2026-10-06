> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Testing ground

**Source:** `frontend/src/app/features/system/testing-ground/testing-ground.component.ts`

## Role

Developer-facing visual lab for exercising shared UI primitives outside product workflows. The current fixture demonstrates raised, pressed, floating, and interactive neumorphic states plus a compact crypto card with dummy Ethereum metadata.

## API surface

- Route: public `/testing-ground`, intentionally absent from `SIDEBAR_LINKS`.
- `ethData` is a static `CryptoCurrency` fixture.
- No persistence, auth, live data, or business action is involved.

## Connected to

- Shared `PageHeaderComponent` and `CryptoCardComponent`.
- Shared `NeumorphicDirective`.
- `app.routes.ts` exposes the lab directly for developer access.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — the lab should exercise established visual language, not define a competing one.
- [`CRYPTO_WEBSOCKETS.md`](../../../CRYPTO_WEBSOCKETS.md) — compact card behavior owns any market-data behavior it elects to start.
- [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md), [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`material-guide.mdc`](../../../../.cursor/rules/material-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`agents.md`](../../../../agents.md) — shared/component boundaries and repository conventions.

## Notes / smells

- Because the lab is a public route, it is reachable in production when its URL is known despite being unlisted.
