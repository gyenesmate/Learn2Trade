import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsCardState, AnalyticsCardInput } from './analytics-card-utilities';
import { Investment } from '../../../const/models';

@Component({
  selector: 'app-analytics-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-card.component.html',
  styleUrls: ['./analytics-card.component.scss']
})
export class AnalyticsCardComponent {
  @Input() state: AnalyticsCardState = 'average';
  @Input() investments: Investment[] = [];
  @Input() label?: string;
  @Input() chartData?: any;

  private get soldInvestments(): Investment[] {
    return (this.investments ?? []).filter(inv => !!inv?.isSold && inv.sellingPrice !== null);
  }

  profit(inv: Investment): number {
    const buy = Number(inv?.buyingPrice || 0);
    const sell = Number(inv?.sellingPrice || 0);
    const amount = Number(inv?.amount || 0);
    if (!Number.isFinite(buy) || !Number.isFinite(sell) || !Number.isFinite(amount)) return 0;
    return amount * (sell - buy);
  }

  roiPercent(inv: Investment): number {
    const buy = Number(inv?.buyingPrice || 0);
    const sell = Number(inv?.sellingPrice || 0);
    if (!buy || !sell) return 0;
    return ((sell - buy) / buy) * 100;
  }

  get timeline(): Investment[] {
    return [...this.soldInvestments]
      .sort((a, b) => {
        const ta = (a.soldAt as any)?.toMillis?.() ?? (a.createdAt as any)?.toMillis?.() ?? 0;
        const tb = (b.soldAt as any)?.toMillis?.() ?? (b.createdAt as any)?.toMillis?.() ?? 0;
        return tb - ta;
      })
      .slice(0, 6);
  }

  get bestInvestment(): Investment | null {
    const sold = this.soldInvestments;
    if (!sold.length) return null;
    return sold
      .slice()
      .sort((a, b) => this.profit(b) - this.profit(a))[0] || null;
  }

  get averageProfit(): number | null {
    const profits = this.soldInvestments.map(inv => this.profit(inv));
    if (!profits.length) return null;
    return profits.reduce((a, b) => a + b, 0) / profits.length;
  }
}
