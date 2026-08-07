import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AnalyticsCardState } from './analytics-card-utilities';
import { Investment } from '../../../const/models';
import { isInvestmentSold } from '../../../core/investment.util';

@Component({
  selector: 'app-analytics-card',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './analytics-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./analytics-card.component.scss'],
})
export class AnalyticsCardComponent {
  readonly state = input<AnalyticsCardState>('average');
  readonly investments = input<Investment[]>([]);
  readonly label = input<string>();
  readonly chartData = input<unknown>();

  private readonly soldInvestments = computed(() =>
    (this.investments() ?? []).filter((inv) => isInvestmentSold(inv) && inv.selling_price !== null)
  );

  readonly timeline = computed(() =>
    [...this.soldInvestments()]
      .sort((a, b) => {
        const ta = Date.parse(this.soldDate(a)) || 0;
        const tb = Date.parse(this.soldDate(b)) || 0;
        return tb - ta;
      })
      .slice(0, 6)
  );

  readonly bestInvestment = computed(() => {
    const sold = this.soldInvestments();
    if (!sold.length) return null;
    return sold.slice().sort((a, b) => this.profit(b) - this.profit(a))[0] || null;
  });

  readonly averageProfit = computed(() => {
    const profits = this.soldInvestments().map((inv) => this.profit(inv));
    if (!profits.length) return null;
    return profits.reduce((a, b) => a + b, 0) / profits.length;
  });

  profit(inv: Investment): number {
    const buy = Number(inv?.buying_price || 0);
    const sell = Number(inv?.selling_price || 0);
    const amount = Number(inv?.amount || 0);
    if (!Number.isFinite(buy) || !Number.isFinite(sell) || !Number.isFinite(amount)) return 0;
    return amount * (sell - buy);
  }

  roiPercent(inv: Investment): number {
    const buy = Number(inv?.buying_price || 0);
    const sell = Number(inv?.selling_price || 0);
    if (!buy || !sell) return 0;
    return ((sell - buy) / buy) * 100;
  }

  soldDate(inv: Investment): string {
    return inv.sold_at ?? inv.created_at;
  }
}
