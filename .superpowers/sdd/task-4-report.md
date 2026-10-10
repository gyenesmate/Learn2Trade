# Task 4 report: feature SCSS → Tailwind

## Status

**Complete.** All `frontend/src/app/features/**` component styles migrated per brief; grep gates clean; build passes.

## Commit

_(filled after commit)_

## Build

```
Application bundle generation complete. [~5.1s]
Output: frontend/dist/client
Warning: crypto-card.component.scss exceeds 4 kB budget by ~525 B (pre-existing).
```

## SCSS files deleted (16)

- `frontend/src/app/features/auth/login/login.component.scss`
- `frontend/src/app/features/auth/register/register.component.scss`
- `frontend/src/app/features/auth/banned/banned.component.scss`
- `frontend/src/app/features/dashboard/dashboard.component.scss`
- `frontend/src/app/features/dashboard/components/analytics-card/analytics-card.component.scss`
- `frontend/src/app/features/markets/markets.component.scss`
- `frontend/src/app/features/markets/components/market-movers/market-movers.component.scss`
- `frontend/src/app/features/markets/components/crypto-currency-edit/crypto-currency-edit.component.scss`
- `frontend/src/app/features/portfolio/portfolio.component.scss`
- `frontend/src/app/features/portfolio/edit-profile/edit-profile.component.scss`
- `frontend/src/app/features/trading/trading.component.scss`
- `frontend/src/app/features/trading/components/invest-dialog/invest-dialog.component.scss`
- `frontend/src/app/features/trading/components/set-price-alert-dialog/set-price-alert-dialog.component.scss`
- `frontend/src/app/features/watchlist/watchlist-dialog/watchlist-dialog.component.scss`
- `frontend/src/app/features/system/testing-ground/testing-ground.component.scss`
- `frontend/src/app/features/system/not-found/not-found.component.scss`

## Kept (escape hatch)

- `frontend/src/app/features/markets/components/animated-market-card-layout/animated-market-card-layout.component.scss` — CSS grid areas, `data-position` selectors, slot transition, responsive breakpoints.

## What changed

- Layout/spacing/flex/grid moved to Tailwind utilities on feature templates.
- `:host` sizing → `host: { class: ... }` on trading, market-movers, crypto-currency-edit, edit-profile, animated-market-card-layout.
- Removed dead dashboard SCSS (legacy holdings table / chart blocks unused by template).
- Added missing `analytics-grid` layout (was unstyled class in template).
- Semantic P&L continues via global `.price-up` / `.price-down`; panels via `.app-panel*`.

## Concerns

1. **`bg-[var(--color-bg)]` / `text-[var(--color-text)]`** — same arbitrary-token pattern as Task 3 where `@theme` has no `bg-bg` / `text-text` bridge.
2. **Markets pagination active page** uses `text-white` on `bg-primary`; could switch to `text-[var(--color-on-primary)]` if contrast audit flags it.
3. **Auth login/register** still wrap auth-layout centering with an inner full-viewport gradient; could simplify markup in a follow-up.
4. **crypto-card** style budget warning unchanged; out of Task 4 scope.
