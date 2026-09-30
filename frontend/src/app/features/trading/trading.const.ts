import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';
import { TableAction, TableColumn, RowAction } from '@shared/components/data-table/data-table.types';

export const TRADING_PAGE_TITLE_FALLBACK = 'Crypto';

/** Static action defs moved onto investment / alert tables (not page header). */
export const TRADING_TABLE_ACTIONS = {
  invest: {
    label: 'Invest',
    icon: 'payments',
    variant: 'primary',
  } satisfies Omit<TableAction, 'callback'>,
  setAlert: {
    label: 'Set alert',
    icon: 'notifications',
    variant: 'primary',
  } satisfies Omit<TableAction, 'callback'>,
  sell: {
    label: 'Sell',
    icon: 'sell',
  } satisfies Omit<RowAction<unknown>, 'callback'>,
  deleteAlert: {
    label: 'Delete',
    icon: 'delete',
  } satisfies Omit<RowAction<unknown>, 'callback'>,
} as const;

/** @deprecated header actions removed — invest/alert live on side tables. Kept empty for type compat. */
export const TRADING_HEADER_ACTIONS = {
  invest: {
    label: 'Invest',
    icon: 'payments',
    variant: 'primary',
  } satisfies PageHeaderActionDef,
  setAlert: {
    label: 'Set alert',
    icon: 'notifications',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
} as const;

export const TRADING_INVESTMENT_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'amount', label: 'Amount', type: 'currency' },
  { key: 'buyingPrice', label: 'Buy price', type: 'number' },
  { key: 'currentPrice', label: 'Current', type: 'number' },
  { key: 'estPayout', label: 'Est. payout', type: 'currency' },
];

export const TRADING_ALERT_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'type', label: 'Type', filterable: true },
  { key: 'alertPrice', label: 'Target', type: 'number' },
  { key: 'description', label: 'Description', filterable: true },
  { key: 'isActive', label: 'Active', type: 'boolean' },
];
