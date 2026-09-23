import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CryptoCurrency, UserMe } from '@core/models/models';
import { CryptoCardComponent } from '@shared/components/crypto-card/crypto-card.component';
import { AuthService } from '@core/services/auth.service';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';

@Component({
  selector: 'app-markets',
  imports: [RouterModule, CryptoCardComponent],
  templateUrl: './markets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./markets.component.scss']
})
export class MarketsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cryptoService = inject(CryptoCurrenciesService);
  private readonly watchlistSubscriptions = inject(WatchlistSubscriptionsService);

  private readonly fallbackCryptocurrencies: CryptoCurrency[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', exchange_currency: 'USD', created_at: '', updated_at: '' }
  ];

  readonly cryptocurrencies = signal<CryptoCurrency[]>([...this.fallbackCryptocurrencies]);
  readonly watchlistCryptos = signal<CryptoCurrency[]>([]);
  readonly watchlistCryptoIds = signal(new Set<string>());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const cryptos = this.cryptocurrencies();
      untracked(() => void this.refreshWatchlist(user, cryptos));
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const fromDb = await this.cryptoService.getAll();
      if (Array.isArray(fromDb) && fromDb.length) {
        this.cryptocurrencies.set(fromDb);
      }
    } catch {
      // fallback stays
    }
  }

  private async refreshWatchlist(
    user: UserMe | null | undefined,
    cryptos: CryptoCurrency[]
  ): Promise<void> {
    if (!user) {
      this.watchlistCryptos.set([]);
      this.watchlistCryptoIds.set(new Set());
      return;
    }

    try {
      const subs = await this.watchlistSubscriptions.getMe();
      const ids = new Set(subs.map((s) => s.crypto_currency_id));
      this.watchlistCryptoIds.set(ids);
      this.watchlistCryptos.set(cryptos.filter((c) => ids.has(c.id)));
    } catch {
      this.watchlistCryptos.set([]);
      this.watchlistCryptoIds.set(new Set());
    }
  }
}
