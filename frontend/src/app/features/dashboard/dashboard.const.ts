import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';
import { TableColumn } from '@shared/components/data-table/data-table.types';

export const DASHBOARD_PAGE_TITLE = 'Dashboard';

export const DASHBOARD_HEADER_ACTIONS = {
  browseMarkets: {
    label: 'Browse markets',
    icon: 'show_chart',
    variant: 'primary',
  } satisfies PageHeaderActionDef,
} as const;

export interface DashboardHoldingRow {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  change: number;
}

export const DASHBOARD_HOLDINGS_COLUMNS: TableColumn<DashboardHoldingRow>[] = [
  { key: 'name', label: 'Asset', type: 'text' },
  { key: 'symbol', label: 'Symbol', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'avgPrice', label: 'Avg. Price', type: 'currency' },
  { key: 'currentPrice', label: 'Current Price', type: 'currency' },
  { key: 'pnl', label: 'P&L', type: 'currency' },
  { key: 'change', label: '% Change', type: 'number' },
];
