import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CryptoCurrency, PriceAlert } from '../../../const/models';
import { PriceAlertsService } from '../../../services/price-alerts.service';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';

@Component({
  selector: 'app-fired-alerts-widget',
  imports: [RouterModule],
  templateUrl: './fired-alerts-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./fired-alerts-widget.component.scss'],
})
export class FiredAlertsWidgetComponent implements OnInit {
  private readonly alertsService = inject(PriceAlertsService);
  private readonly cryptos = inject(CryptoCurrenciesService);
  private readonly router = inject(Router);

  /**
   * Optional alerts list. If omitted, defaults to fired alerts from the service.
   */
  readonly alerts = input<PriceAlert[] | undefined>(undefined);
  readonly title = input('Alerts');
  /** When true, renders as an inline/embedded panel instead of fixed pinned widget. */
  readonly embedded = input(false);

  readonly displayedAlerts = computed(() => this.alerts() ?? this.alertsService.firedAlerts());

  private readonly cryptoById = signal(new Map<string, CryptoCurrency>());

  ngOnInit(): void {
    void this.loadCryptos();
  }

  private async loadCryptos(): Promise<void> {
    try {
      const all = await this.cryptos.getAll();
      this.cryptoById.set(new Map(all.map((c) => [c.id, c] as const)));
    } catch {
      // ignore
    }
  }

  label(alert: PriceAlert): string {
    const c = this.cryptoById().get(alert.crypto_currency_id);
    if (!c) return alert.crypto_currency_id;
    const symbol = c.symbol ? ` (${c.symbol})` : '';
    const quote = c.exchange_currency ? ` / ${c.exchange_currency}` : '';
    return `${c.name}${symbol}${quote}`;
  }

  view(alert: PriceAlert): void {
    void this.router.navigate(['/crypto', alert.crypto_currency_id]);
  }

  stop(alert: PriceAlert): void {
    void this.alertsService.deactivate(alert.id);
  }
}
