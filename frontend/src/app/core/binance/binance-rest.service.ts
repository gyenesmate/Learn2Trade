import { Injectable } from '@angular/core';
import {
  BINANCE_EXCHANGE_INFO_PATH,
  BINANCE_KLINES_PATH,
  BINANCE_REST_BASE_URL,
  BINANCE_TICKER_PRICE_PATH,
} from './binance.const';
import {
  BinanceExchangeInfoResponse,
  BinanceMarketOption,
  ChartCandle,
} from './binance.types';
import { restKlineToCandle } from './binance.utils';

/**
 * Public Binance Spot REST helpers.
 * Uses `fetch` (not HttpClient) so auth interceptors / XHR credentials never
 * hit third-party URLs.
 */
@Injectable({ providedIn: 'root' })
export class BinanceRestService {
  /** Spot TRADING markets only. No caching. */
  async getExchangeInfoMarkets(): Promise<BinanceMarketOption[]> {
    try {
      const url = `${BINANCE_REST_BASE_URL}${BINANCE_EXCHANGE_INFO_PATH}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('[Binance] exchangeInfo HTTP', res.status);
        return [];
      }
      const data = (await res.json()) as BinanceExchangeInfoResponse;
      const symbols = Array.isArray(data?.symbols) ? data.symbols : [];
      return symbols
        .filter(
          (s) => s.status === 'TRADING' && s.symbol && s.baseAsset && s.quoteAsset
        )
        .map((s) => ({
          symbol: s.symbol.toUpperCase(),
          baseAsset: s.baseAsset.toUpperCase(),
          quoteAsset: s.quoteAsset.toUpperCase(),
        }));
    } catch (err) {
      console.warn('[Binance] exchangeInfo failed', err);
      return [];
    }
  }

  /** Historical klines as normalized ChartCandle[]. No cache. */
  async getKlines(
    pair: string,
    interval: string,
    limit: number
  ): Promise<ChartCandle[]> {
    try {
      const params = new URLSearchParams({
        symbol: pair.toUpperCase(),
        interval,
        limit: String(limit),
      });
      const url = `${BINANCE_REST_BASE_URL}${BINANCE_KLINES_PATH}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data: unknown = await res.json();
      if (!Array.isArray(data)) return [];
      return data
        .map((row) => restKlineToCandle(row))
        .filter((c): c is ChartCandle => c !== null);
    } catch {
      return [];
    }
  }

  /** Latest spot price for a Binance pair (e.g. `btcusdt`). Returns NaN on failure. */
  async getTickerPrice(pair: string): Promise<number> {
    try {
      const symbol = pair.trim().toUpperCase();
      if (!symbol) return NaN;
      const params = new URLSearchParams({ symbol });
      const url = `${BINANCE_REST_BASE_URL}${BINANCE_TICKER_PRICE_PATH}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) return NaN;
      const data = (await res.json()) as { price?: string };
      const price = Number(data?.price);
      return Number.isFinite(price) ? price : NaN;
    } catch {
      return NaN;
    }
  }
}
