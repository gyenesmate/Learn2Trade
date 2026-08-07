import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Investment, CryptoCurrency } from '../../../const/models';

@Component({
  selector: 'app-active-investment',
  imports: [DecimalPipe],
  templateUrl: './active-investment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./active-investment.component.scss'],
})
export class ActiveInvestmentComponent {
  readonly investment = input.required<Investment>();
  readonly crypto = input.required<CryptoCurrency>();
  readonly currentPrice = input(0);
  readonly sell = output<void>();

  readonly estimatedPayout = computed(() => {
    const buy = Number(this.investment()?.buying_price || 0);
    const sell = Number(this.currentPrice() || 0);
    const amount = Number(this.investment()?.amount || 0);
    if (!buy || !sell || !amount) return 0;
    return amount * (sell / buy);
  });

  onSell(): void {
    this.sell.emit();
  }
}
