import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WatchlistSubscription } from '../const/models';
import { ApiService } from '../core/api.service';

@Injectable({ providedIn: 'root' })
export class WatchlistSubscriptionsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  getMe(): Promise<WatchlistSubscription[]> {
    return firstValueFrom(
      this.http.get<WatchlistSubscription[]>(this.api.url('/watchlist/me'))
    );
  }

  create(cryptoCurrencyId: string): Promise<WatchlistSubscription> {
    return firstValueFrom(
      this.http.post<WatchlistSubscription>(this.api.url('/watchlist'), {
        crypto_currency_id: cryptoCurrencyId,
      })
    );
  }

  async deleteByCryptoCurrencyId(cryptoCurrencyId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(this.api.url(`/watchlist/${cryptoCurrencyId}`))
    );
  }
}
