/** Visible cards per Markets page (1 intermediate + 4 compact). */
export const MARKETS_PAGE_SIZE = 5;

export const MARKETS_EMPTY_MESSAGE = 'No cryptocurrencies available.';
export const MARKETS_LOAD_ERROR = 'Could not load markets. Check your connection and try again.';

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
