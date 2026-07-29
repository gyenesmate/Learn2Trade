import { Investment } from '../../../const/models';

export type AnalyticsCardState = 'best' | 'average' | 'timeline' | 'custom';

export interface AnalyticsCardInput {
  state: AnalyticsCardState;
  investments: Investment[];
  /**
   * Optionally, a custom label or value to display
   */
  label?: string;
  /**
   * Optionally, a custom chart data set
   */
  chartData?: any;
}
