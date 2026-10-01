import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { CryptoCurrency } from '@core/models/models';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { MarketTicker } from '@core/binance/binance.types';
import { toBinancePair } from '@core/binance/binance.utils';
import { AnimatedMarketCardLayoutComponent } from './components/animated-market-card-layout/animated-market-card-layout.component';
import { MarketMoversComponent } from './components/market-movers/market-movers.component';
import { MarketMoverRow } from './components/market-movers/market-movers.types';
import {
  MARKETS_EMPTY_MESSAGE,
  MARKETS_FILTERS,
  MARKETS_PAGE_SIZE,
  MARKETS_PAGE_SUBTITLE,
  MARKETS_PAGE_TITLE,
  MARKETS_SORT_OPTIONS,
  MarketsFilter,
  MarketsSort,
} from './markets.const';

interface MarketRow {
  crypto: CryptoCurrency;
  pair: string | null;
  price: number;
  change24hPct: number;
  quoteVolume: number;
}

@Component({
  selector: 'app-markets',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    AnimatedMarketCardLayoutComponent,
    MarketMoversComponent,
  ],
  templateUrl: './markets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./markets.component.scss'],
})
export class MarketsComponent implements OnInit, OnDestroy {
  private readonly cryptoService = inject(CryptoCurrenciesService);
  private readonly marketData = inject(BinanceMarketDataService);

  readonly pageTitle = MARKETS_PAGE_TITLE;
  readonly pageSubtitle = MARKETS_PAGE_SUBTITLE;
  readonly emptyMessage = MARKETS_EMPTY_MESSAGE;
  readonly filters = MARKETS_FILTERS;
  readonly sortOptions = MARKETS_SORT_OPTIONS;
  readonly pageSize = MARKETS_PAGE_SIZE;

  readonly loading = signal(true);
  readonly cryptocurrencies = signal<CryptoCurrency[]>([]);
  readonly tickers = signal(new Map<string, MarketTicker>());
  readonly search = signal('');
  readonly filter = signal<MarketsFilter>('all');
  readonly sort = signal<MarketsSort>('volume');
  readonly pageIndex = signal(0);

  private tickerSubs: Subscription[] = [];

  readonly marketRows = computed<MarketRow[]>(() => {
    const tickers = this.tickers();
    return this.cryptocurrencies().map((crypto) => {
      const pair = toBinancePair(crypto.symbol, crypto.exchange_currency);
      const ticker = pair ? tickers.get(pair) : undefined;
      return {
        crypto,
        pair,
        price: ticker?.price ?? 0,
        change24hPct: ticker?.change24hPct ?? 0,
        quoteVolume: ticker?.quoteVolume ?? 0,
      };
    });
  });

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const filter = this.filter();
    let rows = this.marketRows();

    if (q) {
      rows = rows.filter(
        (r) =>
          r.crypto.name.toLowerCase().includes(q) ||
          r.crypto.symbol.toLowerCase().includes(q)
      );
    }

    if (filter === 'gainers') {
      rows = rows.filter((r) => r.change24hPct > 0);
    } else if (filter === 'losers') {
      rows = rows.filter((r) => r.change24hPct < 0);
    }

    const sort = this.sort();
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.change24hPct - a.change24hPct;
        case 'name':
          return a.crypto.name.localeCompare(b.crypto.name);
        case 'volume':
        default:
          return b.quoteVolume - a.quoteVolume;
      }
    });

    return rows;
  });

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize))
  );

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i)
  );

  readonly pageAssets = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.filteredRows()
      .slice(start, start + this.pageSize)
      .map((r) => r.crypto);
  });

  readonly moverRows = computed<MarketMoverRow[]>(() =>
    this.marketRows()
      .filter((r) => r.price > 0)
      .map((r) => ({
        crypto: r.crypto,
        price: r.price,
        change24hPct: r.change24hPct,
        quoteVolume: r.quoteVolume,
      }))
  );

  constructor() {
    effect(() => {
      const cryptos = this.cryptocurrencies();
      untracked(() => this.wireAllTickers(cryptos));
    });

    effect(() => {
      // Clamp page when filters shrink the result set.
      const count = this.pageCount();
      const index = this.pageIndex();
      if (index > count - 1) {
        untracked(() => this.pageIndex.set(Math.max(0, count - 1)));
      }
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
    this.releaseTickers();
    this.marketData.setMiniTickerTargets([]);
  }

  onSearchInput(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  setFilter(filter: MarketsFilter): void {
    this.filter.set(filter);
    this.pageIndex.set(0);
  }

  setSort(sort: MarketsSort): void {
    this.sort.set(sort);
    this.pageIndex.set(0);
  }

  goToPage(index: number): void {
    if (index < 0 || index >= this.pageCount()) return;
    this.pageIndex.set(index);
  }

  prevPage(): void {
    this.goToPage(this.pageIndex() - 1);
  }

  nextPage(): void {
    this.goToPage(this.pageIndex() + 1);
  }

  private wireAllTickers(cryptos: CryptoCurrency[]): void {
    this.releaseTickers();
    const pairs = cryptos
      .map((c) => toBinancePair(c.symbol, c.exchange_currency))
      .filter((p): p is string => !!p);
    this.marketData.setMiniTickerTargets(pairs);

    for (const pair of pairs) {
      const sub = this.marketData.watchMiniTicker(pair).subscribe((ticker) => {
        const next = new Map(this.tickers());
        next.set(pair, ticker);
        this.tickers.set(next);
      });
      this.tickerSubs.push(sub);
    }
  }

  private releaseTickers(): void {
    for (const sub of this.tickerSubs) {
      sub.unsubscribe();
    }
    this.tickerSubs = [];
  }
}
