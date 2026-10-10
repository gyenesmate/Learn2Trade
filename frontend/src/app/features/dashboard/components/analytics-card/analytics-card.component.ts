import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AnalyticsCardState } from './analytics-card.types';
import { Investment } from '@core/models/models';
import { isInvestmentSold } from '@core/utils/investment.util';

interface SoldView {
  inv: Investment;
  profit: number;
  roiPercent: number;
  soldDate: string;
}

function soldMetrics(inv: Investment): SoldView {
  const buy = Number(inv?.buying_price || 0);
  const sell = Number(inv?.selling_price || 0);
  const amount = Number(inv?.amount || 0);
  const profit =
    Number.isFinite(buy) && Number.isFinite(sell) && Number.isFinite(amount)
      ? amount * (sell - buy)
      : 0;
  const roiPercent = buy && sell ? ((sell - buy) / buy) * 100 : 0;
  return {
    inv,
    profit,
    roiPercent,
    soldDate: inv.sold_at ?? inv.created_at,
  };
}

@Component({
  selector: 'app-analytics-card',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './analytics-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsCardComponent {
  readonly state = input<AnalyticsCardState>('average');
  readonly investments = input<Investment[]>([]);
  readonly label = input<string>();
  readonly chartData = input<unknown>();

  private readonly soldViews = computed(() =>
    (this.investments() ?? [])
      .filter((inv) => isInvestmentSold(inv) && inv.selling_price !== null)
      .map(soldMetrics)
  );

  readonly timeline = computed(() =>
    [...this.soldViews()]
      .sort((a, b) => (Date.parse(b.soldDate) || 0) - (Date.parse(a.soldDate) || 0))
      .slice(0, 6)
  );

  readonly bestInvestment = computed(() => {
    const sold = this.soldViews();
    if (!sold.length) return null;
    return sold.slice().sort((a, b) => b.profit - a.profit)[0] ?? null;
  });

  readonly averageProfit = computed(() => {
    const sold = this.soldViews();
    if (!sold.length) return null;
    return sold.reduce((sum, row) => sum + row.profit, 0) / sold.length;
  });
}
