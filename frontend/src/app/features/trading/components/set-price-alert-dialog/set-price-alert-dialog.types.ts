import { CryptoCurrency } from '@core/models/models';

export interface SetPriceAlertDialogData {
  crypto: CryptoCurrency;
  currentPrice: number;
}

export interface SetPriceAlertDialogResult {
  alertPrice: number;
  description: string;
}
