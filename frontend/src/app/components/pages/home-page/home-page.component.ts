import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CryptoCurrency, User } from '../../../const/models';
import { CryptoCardComponent } from '../../shared/crypto-card/crypto-card.component';
import { AuthService } from '../../../services/auth.service';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CryptoCardComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  user$: Observable<User | null>;

  private readonly fallbackCryptocurrencies: CryptoCurrency[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', exchangeCurrency: 'USD' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', exchangeCurrency: 'USD' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', exchangeCurrency: 'USD' },
    { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', exchangeCurrency: 'USD' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', exchangeCurrency: 'USD' }
  ];

  cryptocurrencies: CryptoCurrency[] = [...this.fallbackCryptocurrencies];
  watchlistCryptos: CryptoCurrency[] = [];

  constructor(private auth: AuthService, private cryptoService: CryptoCurrenciesService) {
    this.user$ = this.auth.currentUserData$;
  }

  async ngOnInit(): Promise<void> {
    try {
      // Prefer Firestore-backed list if available
      const fromDb = await this.cryptoService.getAll();
      if (Array.isArray(fromDb) && fromDb.length) {
        this.cryptocurrencies = fromDb;
      }
    } catch {
      // fallback stays
    }

    this.user$.subscribe(user => {
      const subs = (user?.preferences.watchlistSubscriptions ?? []) || [];
      const ids = new Set(subs.map(s => s.cryptoCurrencyId));
      this.watchlistCryptos = this.cryptocurrencies.filter(c => ids.has(c.id));
    });
  }
}