import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';

export const MARKETS_PAGE_TITLE = 'Markets';

/** Max crypto cards shown on the markets page (first-N). */
export const MARKETS_CARD_LIMIT = 5;

export const MARKETS_EMPTY_MESSAGE = 'No cryptocurrencies available.';

export const MARKETS_HEADER_ACTIONS = {
  manageWatchlist: {
    label: 'Manage Watchlist',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
} as const;
