> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Analytics card

**Source:** `frontend/src/app/features/dashboard/components/analytics-card/analytics-card.component.ts`

## Role

Builds presentation-ready metrics from sold investments. A shared sold view-model normalizes profit, ROI, and sold date once, then feeds best-investment, average-profit, and six-item recent timeline states.

## API surface

- Inputs: `state` (`best`, `average`, `timeline`, or custom), `investments`, optional `label`, and optional `chartData`.
- Sold rows require `isInvestmentSold(inv)` and a non-null selling price.
- `bestInvestment` ranks by absolute profit; `averageProfit` averages absolute profit.
- `timeline` sorts newest sold date first and limits output to six rows.
- Empty states explicitly say no sold investments exist.

## Connected to

- Dashboard creates three cards from the same complete investment list.
- `isInvestmentSold` centralizes sold-state interpretation.
- Angular `DatePipe` and `DecimalPipe` format the view-model.

## Rules that apply

- [`TRADING_UI_CONTEXT.md`](../../../TRADING_UI_CONTEXT.md) — financial values and P&L must remain immediately distinguishable.
- [`angular-guide.mdc`](../../../../.cursor/rules/angular-guide.mdc), [`learn2trade.mdc`](../../../../.cursor/rules/learn2trade.mdc), and [`FILE_STRUCTURES.md`](../../../FILE_STRUCTURES.md) — computed state and feature-local child placement.

## Notes / smells

- `chartData` is currently accepted but unused; the default state renders only a placeholder.
- Rows display crypto IDs rather than catalog names or symbols.
