import { describe, expect, it } from 'vitest';
import { ChartCandle } from '@core/binance/binance.types';
import { computeEma, computeRsi, computeSma, toVolumePoints } from './crypto-chart.utils';

describe('crypto-chart.utils indicators', () => {
  const candles: ChartCandle[] = Array.from({ length: 30 }, (_, i) => ({
    time: 1_700_000_000 + i * 60,
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 10 + i,
  }));

  it('computes SMA 5', () => {
    const sma = computeSma(candles, 5);
    expect(sma).toHaveLength(26);
    expect(sma[0].value).toBeCloseTo(102);
  });

  it('computes EMA length', () => {
    expect(computeEma(candles, 5)).toHaveLength(26);
  });

  it('computes RSI in 0..100', () => {
    const rsi = computeRsi(candles, 14);
    expect(rsi.length).toBeGreaterThan(0);
    expect(rsi.every((p) => p.value >= 0 && p.value <= 100)).toBe(true);
  });

  it('maps volume up flag', () => {
    expect(toVolumePoints(candles.slice(0, 1))[0].up).toBe(true);
  });
});
