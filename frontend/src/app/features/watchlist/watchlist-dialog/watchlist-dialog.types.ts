import { CryptoCurrency } from '@core/models/models';

export interface WatchlistDialogRow {
  crypto: CryptoCurrency;
  price?: number;
  change24hPct?: number;
}

export type WatchlistDialogListState = 'loading' | 'empty' | 'ready';
