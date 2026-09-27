import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, shareReplay } from 'rxjs';
import { CryptoCurrency } from '@core/models/models';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { AuthService } from '@core/services/auth.service';
import { SearchProvider, SearchResult } from '@core/search/search.types';
import { normalizeQuery } from '@core/search/search.utils';

@Injectable({ providedIn: 'root' })
export class MarketSearchProvider implements SearchProvider {
  readonly id = 'markets';

  private readonly cryptos = inject(CryptoCurrenciesService);
  private readonly auth = inject(AuthService);

  private readonly catalog$ = from(this.cryptos.getAll()).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  search(query: string): Observable<SearchResult[]> {
    const normalized = normalizeQuery(query);
    if (!normalized || normalized.length < 1) {
      return of([]);
    }

    // Trading routes require auth; hide market deep-links when logged out.
    if (!this.auth.isLoggedIn()) {
      return of([]);
    }

    return this.catalog$.pipe(
      map((items) =>
        items
          .filter((item) => this.matchesCrypto(item, normalized))
          .slice(0, 12)
          .map((item) => this.toResult(item))
      )
    );
  }

  private matchesCrypto(item: CryptoCurrency, query: string): boolean {
    const name = item.name.toLowerCase();
    const symbol = item.symbol.toLowerCase();
    const quote = item.exchange_currency.toLowerCase();
    const pair = `${symbol}/${quote}`;
    return (
      name.includes(query) ||
      symbol.includes(query) ||
      quote.includes(query) ||
      pair.includes(query)
    );
  }

  private toResult(item: CryptoCurrency): SearchResult {
    const pair = `${item.symbol}/${item.exchange_currency}`;
    return {
      id: `market:${item.id}`,
      title: pair,
      description: item.name,
      type: 'market',
      icon: 'currency_bitcoin',
      keywords: [item.name, item.symbol, item.exchange_currency, pair],
      action: { type: 'route', route: `/crypto/${item.id}` },
      priority: 5,
    };
  }
}
