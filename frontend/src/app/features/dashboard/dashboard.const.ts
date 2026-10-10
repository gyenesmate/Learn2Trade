import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';
import { TableColumn } from '@shared/components/data-table/data-table.types';

export const DASHBOARD_PAGE_TITLE = 'DASHBOARD.PAGE_TITLE';

export const DASHBOARD_HEADER_ACTIONS = {
  browseMarkets: {
    label: 'DASHBOARD.ACTION_BROWSE_MARKETS',
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
  { key: 'name', label: 'DASHBOARD.HOLDINGS_COL_ASSET', type: 'text' },
  { key: 'symbol', label: 'DASHBOARD.HOLDINGS_COL_SYMBOL', type: 'text' },
  { key: 'amount', label: 'DASHBOARD.HOLDINGS_COL_AMOUNT', type: 'number' },
  { key: 'avgPrice', label: 'DASHBOARD.HOLDINGS_COL_AVG_PRICE', type: 'currency' },
  { key: 'currentPrice', label: 'DASHBOARD.HOLDINGS_COL_CURRENT_PRICE', type: 'currency' },
  { key: 'pnl', label: 'DASHBOARD.HOLDINGS_COL_PNL', type: 'currency' },
  { key: 'change', label: 'DASHBOARD.HOLDINGS_COL_CHANGE', type: 'number' },
];
