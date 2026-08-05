import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-crypto-currency-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crypto-currency-edit-page.component.html',
  styleUrls: ['./crypto-currency-edit-page.component.scss']
})
export class CryptoCurrencyEditPageComponent implements OnInit {
  id: string | null = null;
  loading = false;
  saving = false;

  form = {
    name: '',
    symbol: '',
    exchange_currency: 'USD'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cryptoCurrencies: CryptoCurrenciesService,
    private notification: NotificationService
  ) {}

  get isNew(): boolean {
    return !this.id;
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) return;

    this.loading = true;
    try {
      const existing = await this.cryptoCurrencies.getById(this.id);
      if (!existing) {
        this.notification.error('Crypto currency not found');
        this.router.navigate(['/profile']);
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
      this.loading = false;
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

    this.saving = true;
    try {
      if (this.id) {
        await this.cryptoCurrencies.update(this.id, { name, symbol, exchange_currency });
        this.notification.success('Crypto currency updated');
      } else {
        await this.cryptoCurrencies.create({ name, symbol, exchange_currency });
        this.notification.success('Crypto currency created');
      }
      this.router.navigate(['/profile']);
    } catch (err) {
      console.error('Error saving crypto currency:', err);
      this.notification.error('Error saving crypto currency');
    } finally {
      this.saving = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }
}
