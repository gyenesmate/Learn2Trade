import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-crypto-currency-edit-page',
  imports: [FormsModule, RouterModule],
  templateUrl: './crypto-currency-edit-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crypto-currency-edit-page.component.scss']
})
export class CryptoCurrencyEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cryptoCurrencies = inject(CryptoCurrenciesService);
  private readonly notification = inject(NotificationService);

  id: string | null = null;
  readonly loading = signal(false);
  readonly saving = signal(false);

  form = {
    name: '',
    symbol: '',
    exchange_currency: 'USD'
  };

  get isNew(): boolean {
    return !this.id;
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) return;

    this.loading.set(true);
    try {
      const existing = await this.cryptoCurrencies.getById(this.id);
      if (!existing) {
        this.notification.error('Crypto currency not found');
        void this.router.navigate(['/profile']);
        return;
      }
      this.form = {
        name: existing.name,
        symbol: existing.symbol,
        exchange_currency: existing.exchange_currency
      };
    } catch (err) {
      console.error('Error loading crypto currency:', err);
      this.notification.error('Error loading crypto currency');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const name = this.form.name.trim();
    const exchange_currency = this.form.exchange_currency.trim();
    const symbol = this.form.symbol.trim();

    if (!name || !symbol || !exchange_currency) {
      this.notification.error('Please fill all fields');
      return;
    }

    this.saving.set(true);
    try {
      if (this.id) {
        await this.cryptoCurrencies.update(this.id, { name, symbol, exchange_currency });
        this.notification.success('Crypto currency updated');
      } else {
        await this.cryptoCurrencies.create({ name, symbol, exchange_currency });
        this.notification.success('Crypto currency created');
      }
      void this.router.navigate(['/profile']);
    } catch (err) {
      console.error('Error saving crypto currency:', err);
      this.notification.error('Error saving crypto currency');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/profile']);
  }
}
