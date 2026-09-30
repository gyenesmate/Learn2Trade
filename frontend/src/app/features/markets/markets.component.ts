import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  effect,
  signal,
  untracked,
  computed,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CryptoCurrency, UserMe } from '@core/models/models';
import { CryptoCardComponent } from '@shared/components/crypto-card/crypto-card.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PageHeaderAction } from '@shared/components/page-header/page-header.types';
import { AuthService } from '@core/services/auth.service';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { toBinancePair } from '@core/binance/binance.utils';
import {
  MARKETS_CARD_LIMIT,
  MARKETS_EMPTY_MESSAGE,
  MARKETS_HEADER_ACTIONS,
  MARKETS_PAGE_TITLE,
} from './markets.const';

@Component({
  selector: 'app-markets',
  imports: [RouterModule, CryptoCardComponent, PageHeaderComponent, MatProgressSpinnerModule],
  templateUrl: './markets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./markets.component.scss']
})
export class MarketsComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly cryptoService = inject(CryptoCurrenciesService);
  private readonly watchlistSubscriptions = inject(WatchlistSubscriptionsService);
  private readonly marketData = inject(BinanceMarketDataService);
  private readonly router = inject(Router);

  readonly pageTitle = MARKETS_PAGE_TITLE;
  readonly emptyMessage = MARKETS_EMPTY_MESSAGE;
  readonly headerActions: PageHeaderAction[] = [
    {
      ...MARKETS_HEADER_ACTIONS.manageWatchlist,
      callback: () => void this.router.navigate(['/profile'], { fragment: 'watchlist' }),
    },
  ];

  readonly loading = signal(true);
  readonly cryptocurrencies = signal<CryptoCurrency[]>([]);
  /** First-N cards rendered on the markets grid. */
  readonly displayedCryptocurrencies = computed(() =>
    this.cryptocurrencies().slice(0, MARKETS_CARD_LIMIT)
  );
  readonly watchlistCryptos = signal<CryptoCurrency[]>([]);
  readonly watchlistCryptoIds = signal(new Set<string>());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const cryptos = this.cryptocurrencies();
      untracked(() => void this.refreshWatchlist(user, cryptos));
    });

    effect(() => {
      const displayed = this.displayedCryptocurrencies();
      const pairs = displayed
        .map((c) => toBinancePair(c.symbol, c.exchange_currency))
        .filter((p): p is string => !!p);
      untracked(() => this.marketData.setMiniTickerTargets(pairs));
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const fromDb = await this.cryptoService.getAll();
      this.cryptocurrencies.set(Array.isArray(fromDb) ? fromDb : []);
    } catch {
      this.cryptocurrencies.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.marketData.setMiniTickerTargets([]);
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
