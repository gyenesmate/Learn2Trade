import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';

export const MARKETS_PAGE_TITLE = 'Markets';

export const MARKETS_HEADER_ACTIONS = {
  manageWatchlist: {
    label: 'Manage Watchlist',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
} as const;
