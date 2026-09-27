import { CryptoCurrency } from '@core/models/models';

export interface InvestDialogData {
  crypto: CryptoCurrency;
  currentPrice: number;
}

export interface InvestDialogResult {
  amount: number;
  description: string;
}
