import { TableAction, TableColumn, RowAction } from '@shared/components/data-table/data-table.types';

export const TRADING_PAGE_TITLE_FALLBACK = 'TRADING.PAGE_TITLE_FALLBACK';

/** Static action defs moved onto investment / alert tables (not page header). */
export const TRADING_TABLE_ACTIONS = {
  invest: {
    label: 'TRADING.ACTION_INVEST',
    icon: 'payments',
    variant: 'primary',
  } satisfies Omit<TableAction, 'callback'>,
  setAlert: {
    label: 'TRADING.ACTION_SET_ALERT',
    icon: 'notifications',
    variant: 'primary',
  } satisfies Omit<TableAction, 'callback'>,
  sell: {
    label: 'TRADING.ACTION_SELL',
    icon: 'sell',
  } satisfies Omit<RowAction<unknown>, 'callback'>,
  deleteAlert: {
    label: 'TRADING.ACTION_DELETE',
    icon: 'delete',
  } satisfies Omit<RowAction<unknown>, 'callback'>,
} as const;

export const TRADING_INVESTMENT_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'amount', label: 'TRADING.COL_AMOUNT', type: 'currency' },
  { key: 'buyingPrice', label: 'TRADING.COL_BUY_PRICE', type: 'number' },
  { key: 'currentPrice', label: 'TRADING.COL_CURRENT', type: 'number' },
  { key: 'estPayout', label: 'TRADING.COL_EST_PAYOUT', type: 'currency' },
];

export const TRADING_ALERT_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'type', label: 'TRADING.COL_TYPE', filterable: true },
  { key: 'alertPrice', label: 'TRADING.COL_TARGET', type: 'number' },
  { key: 'description', label: 'TRADING.COL_DESCRIPTION', filterable: true },
  { key: 'isActive', label: 'TRADING.COL_ACTIVE', type: 'boolean' },
];
