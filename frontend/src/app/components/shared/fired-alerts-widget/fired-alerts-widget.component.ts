import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CryptoCurrency, PriceAlert } from '../../../const/models';
import { PriceAlertsService } from '../../../services/price-alerts.service';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';

@Component({
  selector: 'app-fired-alerts-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fired-alerts-widget.component.html',
  styleUrls: ['./fired-alerts-widget.component.scss']
})
export class FiredAlertsWidgetComponent implements OnInit, OnChanges {
  /**
   * Optional source stream. If omitted, defaults to fired alerts.
   * This enables reusing this component as an embedded alerts list.
   */
  @Input() alerts$?: Observable<PriceAlert[]>;
  @Input() title = 'Alerts';
  /** When true, renders as an inline/embedded panel instead of fixed pinned widget. */
  @Input() embedded = false;

  source$!: Observable<PriceAlert[]>;
  private cryptoById = new Map<string, CryptoCurrency>();

  constructor(
    private alerts: PriceAlertsService,
    private cryptos: CryptoCurrenciesService,
    private router: Router
  ) {
    void this.loadCryptos();
  }

  ngOnInit(): void {
    this.source$ = this.alerts$ ?? this.alerts.firedAlerts$;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alerts$']) {
      this.source$ = this.alerts$ ?? this.alerts.firedAlerts$;
    }
  }

  private async loadCryptos(): Promise<void> {
    try {
      const all = await this.cryptos.getAll();
      this.cryptoById = new Map(all.map(c => [c.id, c] as const));
    } catch {
      // ignore
    }
  }

  label(alert: PriceAlert): string {
    const c = this.cryptoById.get(alert.crypto_currency_id);
    if (!c) return alert.crypto_currency_id;
    const symbol = c.symbol ? ` (${c.symbol})` : '';
    const quote = c.exchange_currency ? ` / ${c.exchange_currency}` : '';
    return `${c.name}${symbol}${quote}`;
  }

  view(alert: PriceAlert): void {
    void this.router.navigate(['/crypto', alert.crypto_currency_id]);
  }

  stop(alert: PriceAlert): void {
    void this.alerts.deactivate(alert.id);
  }
}
