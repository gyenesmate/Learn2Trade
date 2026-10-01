export type MarketMoverMode = 'gainers' | 'losers' | 'active';

export interface MarketMoverRow {
  crypto: import('@core/models/models').CryptoCurrency;
  price: number;
  change24hPct: number;
  quoteVolume: number;
}
