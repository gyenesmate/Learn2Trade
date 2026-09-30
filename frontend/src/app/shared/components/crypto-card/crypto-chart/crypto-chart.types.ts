import {
  CHART_INDICATORS,
  KLINE_INTERVALS,
} from './crypto-chart.const';

export type KlineInterval = (typeof KLINE_INTERVALS)[number]['value'];

export type ChartIndicatorId = (typeof CHART_INDICATORS)[number]['id'];

export type IndicatorEnabledMap = Record<ChartIndicatorId, boolean>;

export interface OhlcDisplay {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time?: number;
}

export interface LinePoint {
  time: number;
  value: number;
}

export interface VolumePoint {
  time: number;
  value: number;
  up: boolean;
}
