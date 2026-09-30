import {
  BinanceCombinedStreamMessage,
  BinanceKlineMessage,
  BinanceMiniTickerMessage,
  ChartCandle,
  MarketTicker,
} from './binance.types';

/** Normalize quote for Binance spot (USD → USDT). */
export function normalizeBinanceQuote(quote: string): string {
  const q = quote.trim().toLowerCase();
  return q === 'usd' ? 'usdt' : q;
}

/**
 * Build lowercase Binance pair from Learn2Trade symbol + exchange_currency.
 * Returns null if inputs are empty/invalid.
 */
export function toBinancePair(
  symbol: string | null | undefined,
  exchangeCurrency: string | null | undefined
): string | null {
  const base = String(symbol ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!base) return null;
  const quote = normalizeBinanceQuote(String(exchangeCurrency ?? 'usdt')).replace(
    /[^a-z0-9]/g,
    ''
  );
  if (!quote) return null;
  return `${base}${quote}`;
}

export function toMiniTickerStream(pair: string): string {
  return `${pair.toLowerCase()}@miniTicker`;
}

export function toKlineStream(pair: string, interval: string): string {
  return `${pair.toLowerCase()}@kline_${interval}`;
}

export function isBinanceMiniTickerMessage(
  value: unknown
): value is BinanceMiniTickerMessage {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v['e'] === '24hrMiniTicker' ||
    (typeof v['e'] === 'string' &&
      typeof v['s'] === 'string' &&
      typeof v['c'] === 'string' &&
      typeof v['o'] === 'string' &&
      !('k' in v))
  );
}

export function isBinanceKlineMessage(value: unknown): value is BinanceKlineMessage {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v['k'] !== 'object' || v['k'] === null) return false;
  const k = v['k'] as Record<string, unknown>;
  return (
    typeof k['t'] === 'number' &&
    typeof k['o'] === 'string' &&
    typeof k['c'] === 'string'
  );
}

export function unwrapCombinedStream(raw: unknown): {
  stream?: string;
  data: unknown;
} | null {
  if (!raw || typeof raw !== 'object') return null;
  if ('stream' in raw && 'data' in raw) {
    const combined = raw as BinanceCombinedStreamMessage;
    return { stream: combined.stream, data: combined.data };
  }
  return { data: raw };
}

export function toMarketTicker(msg: BinanceMiniTickerMessage): MarketTicker {
  const price = Number(msg.c);
  const open = Number(msg.o);
  const change24hPct =
    open > 0 && Number.isFinite(price) ? ((price - open) / open) * 100 : 0;
  return {
    pair: String(msg.s).toLowerCase(),
    price,
    open,
    high: Number(msg.h),
    low: Number(msg.l),
    change24hPct,
    eventTime: Number(msg.E) || Date.now(),
    baseVolume: Number(msg.v),
    quoteVolume: Number(msg.q),
  };
}

/** Map a Binance REST kline row to ChartCandle. */
export function restKlineToCandle(row: unknown): ChartCandle | null {
  if (!Array.isArray(row) || row.length < 6) return null;
  const time = Math.floor(Number(row[0]) / 1000);
  const open = Number(row[1]);
  const high = Number(row[2]);
  const low = Number(row[3]);
  const close = Number(row[4]);
  const volume = Number(row[5]);
  if (![time, open, high, low, close, volume].every(Number.isFinite)) return null;
  return { time, open, high, low, close, volume, isClosed: true };
}

/** Map a Binance WS kline payload to ChartCandle. */
export function wsKlineToCandle(msg: BinanceKlineMessage): ChartCandle {
  const k = msg.k;
  return {
    time: Math.floor(Number(k.t) / 1000),
    open: Number(k.o),
    high: Number(k.h),
    low: Number(k.l),
    close: Number(k.c),
    volume: Number(k.v),
    isClosed: !!k.x,
  };
}

export function formatMarketOptionLabel(base: string, quote: string): string {
  return `${base} / ${quote}`;
}
