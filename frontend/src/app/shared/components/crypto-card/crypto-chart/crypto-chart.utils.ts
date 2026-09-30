import { ChartCandle } from '@core/binance/binance.types';
import {
  EMA_FAST_PERIOD,
  EMA_SLOW_PERIOD,
  RSI_PERIOD,
  SMA_PERIOD,
} from './crypto-chart.const';
import { LinePoint, VolumePoint } from './crypto-chart.types';

export function computeSma(candles: ChartCandle[], period = SMA_PERIOD): LinePoint[] {
  const out: LinePoint[] = [];
  if (period <= 0 || candles.length < period) return out;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({ time: candles[i].time, value: sum / period });
    }
  }
  return out;
}

export function computeEma(candles: ChartCandle[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  if (period <= 0 || candles.length < period) return out;
  const k = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += candles[i].close;
  ema /= period;
  out.push({ time: candles[period - 1].time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({ time: candles[i].time, value: ema });
  }
  return out;
}

export function computeEma20(candles: ChartCandle[]): LinePoint[] {
  return computeEma(candles, EMA_FAST_PERIOD);
}

export function computeEma50(candles: ChartCandle[]): LinePoint[] {
  return computeEma(candles, EMA_SLOW_PERIOD);
}

/** Wilder RSI. */
export function computeRsi(candles: ChartCandle[], period = RSI_PERIOD): LinePoint[] {
  const out: LinePoint[] = [];
  if (period <= 0 || candles.length <= period) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  const rsiAt = (gain: number, loss: number): number => {
    if (loss === 0) return 100;
    const rs = gain / loss;
    return 100 - 100 / (1 + rs);
  };

  out.push({ time: candles[period].time, value: rsiAt(avgGain, avgLoss) });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push({ time: candles[i].time, value: rsiAt(avgGain, avgLoss) });
  }
  return out;
}

export function toVolumePoints(candles: ChartCandle[]): VolumePoint[] {
  return candles.map((c) => ({
    time: c.time,
    value: c.volume,
    up: c.close >= c.open,
  }));
}

export function rangeChangePct(candles: ChartCandle[]): number | undefined {
  if (candles.length < 2) return undefined;
  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  if (!first || !Number.isFinite(first) || !Number.isFinite(last)) return undefined;
  return ((last - first) / first) * 100;
}

export function mergeLiveCandle(
  history: ChartCandle[],
  live: ChartCandle | null
): ChartCandle[] {
  if (!live) return history;
  if (!history.length) return [live];
  const last = history[history.length - 1];
  if (last.time === live.time) {
    return [...history.slice(0, -1), live];
  }
  if (live.time > last.time) {
    return [...history, live];
  }
  return history;
}

export function formatCompactVolume(volume: number): string {
  if (!Number.isFinite(volume)) return '—';
  const abs = Math.abs(volume);
  if (abs >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(volume / 1_000).toFixed(2)}K`;
  return volume.toFixed(2);
}
