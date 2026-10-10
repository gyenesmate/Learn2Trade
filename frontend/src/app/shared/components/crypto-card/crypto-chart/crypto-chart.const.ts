export const KLINE_INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
] as const;

export const DEFAULT_KLINE_INTERVAL = '15m' as const;

/** Max candlesticks fetched per historical REST request. */
export const KLINE_HISTORY_LIMIT = 500;

export const CHART_INDICATORS = [
  { id: 'volume', label: 'TRADING.IND_VOLUME', defaultEnabled: true },
  { id: 'sma20', label: 'TRADING.IND_SMA20', defaultEnabled: false },
  { id: 'ema20', label: 'TRADING.IND_EMA20', defaultEnabled: false },
  { id: 'ema50', label: 'TRADING.IND_EMA50', defaultEnabled: false },
  { id: 'rsi14', label: 'TRADING.IND_RSI14', defaultEnabled: false },
] as const;

export const SMA_PERIOD = 20;
export const EMA_FAST_PERIOD = 20;
export const EMA_SLOW_PERIOD = 50;
export const RSI_PERIOD = 14;
