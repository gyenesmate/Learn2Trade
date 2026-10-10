import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';
import { TableColumn } from '@shared/components/data-table/data-table.types';
import { CryptoCurrency, User } from '@core/models/models';

export const PORTFOLIO_PAGE_TITLE = 'PORTFOLIO.PAGE_TITLE';

export const PORTFOLIO_HEADER_ACTIONS = {
  editProfile: {
    label: 'PORTFOLIO.ACTION_EDIT_PROFILE',
    icon: 'edit',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
} as const;

export const PORTFOLIO_TABLE_ACTIONS = {
  addCrypto: { label: 'COMMON.ADD', icon: 'add', variant: 'primary' as const },
  edit: { label: 'COMMON.EDIT', icon: 'edit' },
  delete: { label: 'COMMON.DELETE', icon: 'delete', color: 'warn' as const },
  ban: { label: 'PORTFOLIO.ACTION_BAN_UNBAN', icon: 'block', color: 'warn' as const },
  view: { label: 'COMMON.VIEW', icon: 'visibility' },
} as const;

export const PORTFOLIO_CRYPTO_COLUMNS: TableColumn<CryptoCurrency>[] = [
  { key: 'name', label: 'PORTFOLIO.COL_NAME', filterable: true },
  { key: 'symbol', label: 'PORTFOLIO.COL_SYMBOL', filterable: true },
  { key: 'exchange_currency', label: 'PORTFOLIO.COL_QUOTE', filterable: true },
];

export const PORTFOLIO_USER_COLUMNS: TableColumn<User>[] = [
  { key: 'username', label: 'PORTFOLIO.COL_USER_NAME', filterable: true },
  { key: 'email', label: 'AUTH.EMAIL', filterable: true },
  { key: 'is_admin', label: 'COMMON.ADMIN', type: 'boolean' },
];

export const PORTFOLIO_WATCHLIST_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'name', label: 'PORTFOLIO.COL_NAME', filterable: true },
  { key: 'symbol', label: 'PORTFOLIO.COL_SYMBOL', filterable: true },
  { key: 'exchangeCurrency', label: 'PORTFOLIO.COL_QUOTE', filterable: true },
];

export const PORTFOLIO_INVESTMENTS_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'currencyName', label: 'PORTFOLIO.COL_CURRENCY', filterable: true },
  { key: 'exchange', label: 'PORTFOLIO.COL_EXCHANGE', filterable: true },
  { key: 'amount', label: 'TRADING.COL_AMOUNT', type: 'currency' as const },
  { key: 'soldAt', label: 'PORTFOLIO.COL_SOLD_AT', type: 'date' },
  { key: 'createdAt', label: 'PORTFOLIO.COL_CREATED_AT', type: 'date' },
];

export const PORTFOLIO_ALERTS_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'currencyName', label: 'PORTFOLIO.COL_CURRENCY', filterable: true },
  { key: 'type', label: 'TRADING.COL_TYPE', filterable: true },
  { key: 'alertPrice', label: 'TRADING.COL_TARGET', type: 'number' },
  { key: 'description', label: 'TRADING.COL_DESCRIPTION', filterable: true },
  { key: 'isActive', label: 'TRADING.COL_ACTIVE', type: 'boolean' },
  { key: 'createdAt', label: 'PORTFOLIO.COL_CREATED_AT', type: 'date' },
];
