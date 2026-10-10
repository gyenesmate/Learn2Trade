/** Visible cards per Markets page (1 intermediate + 4 compact). */
export const MARKETS_PAGE_SIZE = 5;

export const MARKETS_EMPTY_MESSAGE = 'MARKETS.EMPTY';
export const MARKETS_LOAD_ERROR = 'MARKETS.LOAD_ERROR';

export type MarketsFilter = 'all' | 'gainers' | 'losers';
export type MarketsSort = 'volume' | 'price' | 'change' | 'name';

export const MARKETS_FILTERS: ReadonlyArray<{ id: MarketsFilter; labelKey: string }> = [
  { id: 'all', labelKey: 'MARKETS.FILTER_ALL' },
  { id: 'gainers', labelKey: 'MARKETS.FILTER_GAINERS' },
  { id: 'losers', labelKey: 'MARKETS.FILTER_LOSERS' },
];

export const MARKETS_SORT_OPTIONS: ReadonlyArray<{ id: MarketsSort; labelKey: string }> = [
  // ponytail: no market-cap feed; volume is the best available proxy for "size".
  { id: 'volume', labelKey: 'MARKETS.SORT_VOLUME' },
  { id: 'price', labelKey: 'MARKETS.SORT_PRICE' },
  { id: 'change', labelKey: 'MARKETS.SORT_CHANGE' },
  { id: 'name', labelKey: 'MARKETS.SORT_NAME' },
];

export const MARKETS_MOVERS_EMPTY_NO_MARKETS = 'MARKETS.MOVERS_EMPTY_NO_MARKETS';
export const MARKETS_MOVERS_EMPTY_WAITING = 'MARKETS.MOVERS_EMPTY_WAITING';
