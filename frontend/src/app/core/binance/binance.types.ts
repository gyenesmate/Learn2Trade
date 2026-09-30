/** Raw Binance individual miniTicker payload. */
export interface BinanceMiniTickerMessage {
  e: string;
  E: number;
  s: string;
  c: string;
  o: string;
  h: string;
  l: string;
  v: string;
  q: string;
}

/** Raw Binance kline WebSocket payload (`e: "kline"`). */
export interface BinanceKlineMessage {
  e: string;
  E: number;
  s: string;
  k: BinanceKlinePayload;
}

export interface BinanceKlinePayload {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  x: boolean;
}

export interface BinanceCombinedStreamMessage {
  stream: string;
  data: BinanceMiniTickerMessage | BinanceKlineMessage;
}

export interface BinanceSubscriptionRequest {
  method: 'SUBSCRIBE' | 'UNSUBSCRIBE';
  params: string[];
  id: number;
}

export interface BinanceSubscriptionResponse {
  result: null | string[];
  id: number;
}

/** Frontend-facing Spot market option for admin autocomplete. */
export interface BinanceMarketOption {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

/** Normalized ticker for UI consumers. */
export interface MarketTicker {
  pair: string;
  price: number;
  open: number;
  high: number;
  low: number;
  change24hPct: number;
  eventTime: number;
  baseVolume: number;
  quoteVolume: number;
}

/** Normalized candle for charts (REST + WS). Time is Unix seconds. */
export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean;
}

export interface BinanceExchangeInfoSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface BinanceExchangeInfoResponse {
  symbols: BinanceExchangeInfoSymbol[];
}
