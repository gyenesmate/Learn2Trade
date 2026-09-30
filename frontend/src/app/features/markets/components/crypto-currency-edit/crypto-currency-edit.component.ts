import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { startWith } from 'rxjs';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { NotificationService } from '@core/services/notification.service';
import { BinanceRestService } from '@core/binance/binance-rest.service';
import { BinanceMarketOption } from '@core/binance/binance.types';
import { formatMarketOptionLabel, normalizeBinanceQuote, toBinancePair } from '@core/binance/binance.utils';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { CRYPTO_CURRENCY_EDIT_TITLES } from './crypto-currency-edit.const';

function marketOptionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && typeof value === 'object' && 'symbol' in value && 'baseAsset' in value) {
      return null;
    }
    return { marketRequired: true };
  };
}

@Component({
  selector: 'app-crypto-currency-edit',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    PageHeaderComponent,
  ],
  templateUrl: './crypto-currency-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crypto-currency-edit.component.scss']
})
export class CryptoCurrencyEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cryptoCurrencies = inject(CryptoCurrenciesService);
  private readonly notification = inject(NotificationService);
  private readonly binanceRest = inject(BinanceRestService);
  private readonly fb = inject(FormBuilder);

  id: string | null = null;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly marketsLoading = signal(false);
  readonly markets = signal<BinanceMarketOption[]>([]);
  readonly usedPairs = signal(new Set<string>());
  readonly marketMissingWarning = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    /** Hidden payload fields kept for API shape. */
    symbol: ['', Validators.required],
    exchange_currency: ['', Validators.required],
    market: this.fb.control<BinanceMarketOption | string | null>(null, {
      validators: [marketOptionValidator()],
    }),
  });

  private readonly marketFilter = toSignal(
    this.form.controls.market.valueChanges.pipe(startWith(this.form.controls.market.value)),
    { initialValue: this.form.controls.market.value }
  );

  readonly filteredMarkets = computed(() => {
    const all = this.markets();
    const used = this.usedPairs();
    const raw = this.marketFilter();
    const query =
      typeof raw === 'string'
        ? raw.trim().toLowerCase()
        : raw && typeof raw === 'object'
          ? ''
          : '';

    const available = all.filter((m) => {
      const pair = `${m.baseAsset}${m.quoteAsset}`.toLowerCase();
      if (!used.has(pair)) return true;
      // Allow the currently selected market when editing.
      const current = this.form.controls.market.value;
      return (
        typeof current === 'object' &&
        current !== null &&
        current.symbol === m.symbol
      );
    });

    if (!query) return available.slice(0, 80);

    return available
      .filter((m) => {
        const label = formatMarketOptionLabel(m.baseAsset, m.quoteAsset).toLowerCase();
        return (
          m.symbol.toLowerCase().includes(query) ||
          m.baseAsset.toLowerCase().includes(query) ||
          m.quoteAsset.toLowerCase().includes(query) ||
          label.includes(query)
        );
      })
      .slice(0, 80);
  });

  get isNew(): boolean {
    return !this.id;
  }

  get pageTitle(): string {
    return this.isNew ? CRYPTO_CURRENCY_EDIT_TITLES.add : CRYPTO_CURRENCY_EDIT_TITLES.edit;
  }

  displayMarket = (value: BinanceMarketOption | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return formatMarketOptionLabel(value.baseAsset, value.quoteAsset);
  };

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);
    this.marketsLoading.set(true);

    try {
      const [marketOptions, existingCryptos, existing] = await Promise.all([
        this.binanceRest.getExchangeInfoMarkets(),
        this.cryptoCurrencies.getAll().catch(() => []),
        this.id ? this.cryptoCurrencies.getById(this.id) : Promise.resolve(null),
      ]);

      this.markets.set(marketOptions);

      const used = new Set<string>();
      for (const c of existingCryptos) {
        if (this.id && c.id === this.id) continue;
        const pair = toBinancePair(c.symbol, c.exchange_currency);
        if (pair) used.add(pair);
      }
      this.usedPairs.set(used);

      if (this.id) {
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

        const match = this.findMatchingMarket(
          marketOptions,
          existing.symbol,
          existing.exchange_currency
        );
        if (match) {
          this.applyMarket(match);
          this.marketMissingWarning.set(false);
        } else {
          this.form.controls.market.setValue(null);
          this.form.controls.market.markAsTouched();
          this.marketMissingWarning.set(true);
        }
      }
    } catch (err) {
      console.error('Error loading crypto currency edit:', err);
      this.notification.error('Error loading form data');
    } finally {
      this.loading.set(false);
      this.marketsLoading.set(false);
    }
  }

  onMarketSelected(option: BinanceMarketOption): void {
    this.applyMarket(option);
    this.marketMissingWarning.set(false);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Please select a Binance market and enter a name');
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

  private applyMarket(option: BinanceMarketOption): void {
    this.form.patchValue({
      market: option,
      symbol: option.baseAsset,
      exchange_currency: option.quoteAsset,
    });
  }

  private findMatchingMarket(
    options: BinanceMarketOption[],
    symbol: string,
    exchangeCurrency: string
  ): BinanceMarketOption | null {
    const base = symbol.trim().toUpperCase();
    const quote = normalizeBinanceQuote(exchangeCurrency).toUpperCase();
    const quoteAlt = quote === 'USDT' ? 'USD' : quote === 'USD' ? 'USDT' : null;

    return (
      options.find(
        (m) =>
          m.baseAsset === base &&
          (m.quoteAsset === quote || (quoteAlt !== null && m.quoteAsset === quoteAlt))
      ) ?? null
    );
  }
}
