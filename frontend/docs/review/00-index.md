> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Frontend review index

## Purpose

This dated snapshot is a step-by-step written review of the Learn2Trade Angular frontend. It maps features, shared components, and core subsystems and what connects to what; states which rules and docs apply when touching each area (as pointers, not pasted rule bodies); and includes Mermaid diagrams where appropriate. It ends with optional suggestions for future permanent docs, rules, and tooling.

**Snapshot date:** 2026-10-06

## How to cherry-pick

Read pages in the order below. When something is worth keeping permanently, copy or adapt only that section into the authoritative doc it belongs in (SoT files or feature guides)—do not treat this tree as a living mirror of the codebase. Leave the snapshot banner off promoted content or replace it with a normal doc header. Skip pages that add no value beyond what SoT already covers.

## Reading path

1. This index (purpose, snapshot date, cherry-pick guidance, inventory)
2. [Architecture §01 → §04](./architecture/01-app-shell.md) through [04-styles-and-material](./architecture/04-styles-and-material.md)
3. [Core overview](./core/overview.md) → layout pages → websocket/Binance → global search → services → [notes-guards-env](./core/notes-guards-env.md)
4. [Shared overview](./shared/overview.md) → shared component leaves
5. Features: [markets](./features/markets/overview.md) → [trading](./features/trading/overview.md) → [dashboard](./features/dashboard/overview.md) → [portfolio](./features/portfolio/overview.md) → [watchlist](./features/watchlist/overview.md) → [auth](./features/auth/overview.md) → [system](./features/system/overview.md)
6. [99-suggestions](./99-suggestions.md)

## Snapshot inventory (complete)

| Path | Role |
| --- | --- |
| [00-index.md](./00-index.md) | Entry point: purpose, reading order, full file inventory, SoT links |
| [architecture/01-app-shell.md](./architecture/01-app-shell.md) | App shell, root component, and global hosts |
| [architecture/02-routing-and-guards.md](./architecture/02-routing-and-guards.md) | Routes, lazy loading, and guard behavior |
| [architecture/03-state-and-data.md](./architecture/03-state-and-data.md) | State patterns, HTTP, and data flow across the app |
| [architecture/04-styles-and-material.md](./architecture/04-styles-and-material.md) | Theming, tokens, Material, and layout styling |
| [core/overview.md](./core/overview.md) | Core layer map: layout, services, guards, env |
| [core/layout-base-layout.md](./core/layout-base-layout.md) | Base layout shell wrapping navbar, sidebar, and feature outlet |
| [core/layout-sidebar.md](./core/layout-sidebar.md) | Sidebar navigation component |
| [core/layout-navbar.md](./core/layout-navbar.md) | Top navbar and primary chrome actions |
| [core/layout-global-search.md](./core/layout-global-search.md) | Global search entry in the shell |
| [core/layout-search-result.md](./core/layout-search-result.md) | Search result presentation in the shell |
| [core/websocket-service.md](./core/websocket-service.md) | WebSocket connection and subscription lifecycle |
| [core/binance-market-data.md](./core/binance-market-data.md) | Binance market-data stream integration |
| [core/binance-rest.md](./core/binance-rest.md) | Binance REST client usage |
| [core/search-global-search.md](./core/search-global-search.md) | Global search service and indexing |
| [core/service-auth.md](./core/service-auth.md) | Authentication and session handling |
| [core/service-api.md](./core/service-api.md) | Shared HTTP API client |
| [core/service-token-storage.md](./core/service-token-storage.md) | Token persistence and retrieval |
| [core/service-users.md](./core/service-users.md) | User profile and account API |
| [core/service-crypto-currencies.md](./core/service-crypto-currencies.md) | Crypto currency catalog and admin data |
| [core/service-investments.md](./core/service-investments.md) | Portfolio investments and trades |
| [core/service-price-alerts.md](./core/service-price-alerts.md) | Price alert CRUD and triggers |
| [core/service-watchlist-subscriptions.md](./core/service-watchlist-subscriptions.md) | Watchlist subscription management |
| [core/service-notification.md](./core/service-notification.md) | In-app notification / snackbar stack |
| [core/notes-guards-env.md](./core/notes-guards-env.md) | Guards, environment config, and related short notes |
| [shared/overview.md](./shared/overview.md) | Shared components layer overview |
| [shared/data-table.md](./shared/data-table.md) | Reusable data table patterns |
| [shared/crypto-card.md](./shared/crypto-card.md) | Crypto summary card UI |
| [shared/crypto-chart.md](./shared/crypto-chart.md) | Chart wrapper (lightweight-charts) |
| [shared/page-header.md](./shared/page-header.md) | Page title and actions header |
| [shared/base-dialog.md](./shared/base-dialog.md) | Base dialog shell for Material dialogs |
| [shared/confirmation-dialog.md](./shared/confirmation-dialog.md) | Confirmation dialog pattern |
| [shared/app-snackbar.md](./shared/app-snackbar.md) | Snackbar presentation component |
| [shared/notification-stack.md](./shared/notification-stack.md) | Stacked notification host |
| [features/markets/overview.md](./features/markets/overview.md) | Markets feature: routes, flows, and child links |
| [features/markets/markets.md](./features/markets/markets.md) | Markets browse page |
| [features/markets/animated-market-card-layout.md](./features/markets/animated-market-card-layout.md) | Animated market card grid layout |
| [features/markets/market-movers.md](./features/markets/market-movers.md) | Market movers subsection |
| [features/markets/crypto-currency-edit.md](./features/markets/crypto-currency-edit.md) | Admin crypto currency edit |
| [features/markets/market-search-provider.md](./features/markets/market-search-provider.md) | Markets-specific search provider |
| [features/trading/overview.md](./features/trading/overview.md) | Trading feature overview |
| [features/trading/trading.md](./features/trading/trading.md) | Crypto trading detail page |
| [features/trading/invest-dialog.md](./features/trading/invest-dialog.md) | Invest / buy dialog |
| [features/trading/set-price-alert-dialog.md](./features/trading/set-price-alert-dialog.md) | Set price alert dialog |
| [features/dashboard/overview.md](./features/dashboard/overview.md) | Dashboard feature overview |
| [features/dashboard/dashboard.md](./features/dashboard/dashboard.md) | Dashboard home page |
| [features/dashboard/analytics-card.md](./features/dashboard/analytics-card.md) | Analytics summary card |
| [features/portfolio/overview.md](./features/portfolio/overview.md) | Portfolio / profile feature overview |
| [features/portfolio/portfolio.md](./features/portfolio/portfolio.md) | Profile / portfolio page |
| [features/portfolio/edit-profile.md](./features/portfolio/edit-profile.md) | Edit profile page |
| [features/watchlist/overview.md](./features/watchlist/overview.md) | Watchlist feature overview |
| [features/watchlist/watchlist-dialog.md](./features/watchlist/watchlist-dialog.md) | Watchlist management dialog |
| [features/auth/overview.md](./features/auth/overview.md) | Auth feature overview |
| [features/auth/login.md](./features/auth/login.md) | Login page |
| [features/auth/register.md](./features/auth/register.md) | Register page |
| [features/auth/banned.md](./features/auth/banned.md) | Banned user page |
| [features/system/overview.md](./features/system/overview.md) | System / misc routes overview |
| [features/system/not-found.md](./features/system/not-found.md) | Not-found page |
| [features/system/testing-ground.md](./features/system/testing-ground.md) | Internal testing ground page |
| [99-suggestions.md](./99-suggestions.md) | Optional backlog: docs, rules/skills, and plugins/tools |

## Source-of-truth docs

Review pages point here; they do not replace these files.

| Doc | Role |
| --- | --- |
| [FILE_STRUCTURES.md](../FILE_STRUCTURES.md) | Folder ownership and placement |
| [CRYPTO_WEBSOCKETS.md](../CRYPTO_WEBSOCKETS.md) | WebSocket / Binance market-data architecture |
| [TRADING_UI_CONTEXT.md](../TRADING_UI_CONTEXT.md) | Trading UI design system and tokens |
| [angular-guide.mdc](../../.cursor/rules/angular-guide.mdc) | Angular implementation standards |
| [material-guide.mdc](../../.cursor/rules/material-guide.mdc) | Material theming and component patterns |
| [learn2trade.mdc](../../.cursor/rules/learn2trade.mdc) | Project map and frontend conventions |
| [agents.md](../../agents.md) | Agent and contributor guidance |
