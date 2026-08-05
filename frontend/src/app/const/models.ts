export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMe extends User {
  theme: 'light' | 'dark' | 'system';
  balance: number;
  currency_code: string;
  profit_index: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserMe;
}

export interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  exchange_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  crypto_currency_id: string;
  amount: number;
  buying_price: number;
  selling_price: number | null;
  description: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface WatchlistSubscription {
  user_id: string;
  crypto_currency_id: string;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  crypto_currency_id: string;
  alert_price: number;
  description: string | null;
  alert_type: 'above' | 'below';
  is_active: boolean;
  created_at: string;
}
