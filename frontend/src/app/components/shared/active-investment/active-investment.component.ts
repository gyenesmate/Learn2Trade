import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Investment, CryptoCurrency } from '../../../const/models';

@Component({
  selector: 'app-active-investment',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './active-investment.component.html',
  styleUrls: ['./active-investment.component.scss']
})
export class ActiveInvestmentComponent {
  @Input() investment!: Investment;
  @Input() crypto!: CryptoCurrency;
  @Input() currentPrice = 0;
  @Output() sell = new EventEmitter<void>();

  get estimatedPayout(): number {
    const buy = Number(this.investment?.buying_price || 0);
    const sell = Number(this.currentPrice || 0);
    const amount = Number(this.investment?.amount || 0);
    if (!buy || !sell || !amount) return 0;
    return amount * (sell / buy);
  }

  onSell(): void {
    this.sell.emit();
  }
}
