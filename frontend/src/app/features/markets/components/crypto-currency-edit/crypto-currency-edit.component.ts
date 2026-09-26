import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-crypto-currency-edit',
  imports: [ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule],
  templateUrl: './crypto-currency-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crypto-currency-edit.component.scss']
})
export class CryptoCurrencyEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cryptoCurrencies = inject(CryptoCurrenciesService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  id: string | null = null;
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    symbol: ['', Validators.required],
    exchange_currency: ['USD', Validators.required],
  });

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
      this.form.patchValue({
        name: existing.name,
        symbol: existing.symbol,
        exchange_currency: existing.exchange_currency,
      });
    } catch (err) {
      console.error('Error loading crypto currency:', err);
      this.notification.error('Error loading crypto currency');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Please fill all fields');
      return;
    }

    const { name, symbol, exchange_currency } = this.form.getRawValue();
    const payload = {
      name: name.trim(),
      symbol: symbol.trim(),
      exchange_currency: exchange_currency.trim(),
    };

    this.saving.set(true);
    try {
      if (this.id) {
        await this.cryptoCurrencies.update(this.id, payload);
        this.notification.success('Crypto currency updated');
      } else {
        await this.cryptoCurrencies.create(payload);
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
