import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CryptoCurrency, UserMe } from '../../../const/models';
import { CryptoCardComponent } from '../../shared/crypto-card/crypto-card.component';
import { AuthService } from '../../../services/auth.service';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { WatchlistSubscriptionsService } from '../../../services/watchlist-subscriptions.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CryptoCardComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  user$: Observable<UserMe | null | undefined>;

  private readonly fallbackCryptocurrencies: CryptoCurrency[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', exchange_currency: 'USD', created_at: '', updated_at: '' }
  ];

  cryptocurrencies: CryptoCurrency[] = [...this.fallbackCryptocurrencies];
  watchlistCryptos: CryptoCurrency[] = [];
  watchlistCryptoIds = new Set<string>();

  constructor(
    private auth: AuthService,
    private cryptoService: CryptoCurrenciesService,
    private watchlistSubscriptions: WatchlistSubscriptionsService
  ) {
    this.user$ = this.auth.currentUserData$;
  }

  async ngOnInit(): Promise<void> {
    try {
      const fromDb = await this.cryptoService.getAll();
      if (Array.isArray(fromDb) && fromDb.length) {
        this.cryptocurrencies = fromDb;
      }
    } catch {
      // fallback stays
    }

    this.user$.subscribe(async user => {
      if (!user) {
        this.watchlistCryptos = [];
        this.watchlistCryptoIds = new Set();
        return;
      }

      try {
        const subs = await this.watchlistSubscriptions.getMe();
        const ids = new Set(subs.map(s => s.crypto_currency_id));
        this.watchlistCryptoIds = ids;
        this.watchlistCryptos = this.cryptocurrencies.filter(c => ids.has(c.id));
      } catch {
        this.watchlistCryptos = [];
        this.watchlistCryptoIds = new Set();
      }
    });
  }
}
