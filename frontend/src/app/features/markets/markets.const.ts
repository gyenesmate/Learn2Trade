export const MARKETS_PAGE_TITLE = 'Markets';
export const MARKETS_PAGE_SUBTITLE = 'Discover and explore cryptocurrency markets';

/** Visible cards per Markets page (1 intermediate + 4 compact). */
export const MARKETS_PAGE_SIZE = 5;

export const MARKETS_EMPTY_MESSAGE = 'No cryptocurrencies available.';

export type MarketsFilter = 'all' | 'gainers' | 'losers';
export type MarketsSort = 'volume' | 'price' | 'change' | 'name';

export const MARKETS_FILTERS: ReadonlyArray<{ id: MarketsFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
];

export const MARKETS_SORT_OPTIONS: ReadonlyArray<{ id: MarketsSort; label: string }> = [
  // ponytail: no market-cap feed; volume is the best available proxy for "size".
  { id: 'volume', label: '24h Volume' },
  { id: 'price', label: 'Price' },
  { id: 'change', label: '24h Change' },
  { id: 'name', label: 'Name' },
];
