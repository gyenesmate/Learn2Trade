import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WatchlistSubscription } from '@core/models/models';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Watchlist HTTP API + membership id cache for consumers (e.g. crypto-card).
 * Dialog / UI open state lives in the watchlist feature, not here.
 */
@Injectable({ providedIn: 'root' })
export class WatchlistSubscriptionsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly idsInternal = signal(new Set<string>());

  readonly ids = this.idsInternal.asReadonly();
  readonly idCount = computed(() => this.idsInternal().size);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => {
        if (!user?.id) {
          this.idsInternal.set(new Set());
          return;
        }
        void this.refresh();
      });
    });
  }

  isInWatchlist(cryptoId: string): boolean {
    return this.idsInternal().has(cryptoId);
  }

  getMe(): Promise<WatchlistSubscription[]> {
    return firstValueFrom(
      this.http.get<WatchlistSubscription[]>(this.api.url('/watchlist/me'))
    );
  }

  async refresh(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.idsInternal.set(new Set());
      return;
    }
    try {
      const subs = await this.getMe();
      this.idsInternal.set(new Set(subs.map((s) => s.crypto_currency_id)));
    } catch {
      this.idsInternal.set(new Set());
    }
  }

  async create(cryptoCurrencyId: string): Promise<WatchlistSubscription> {
    const sub = await firstValueFrom(
      this.http.post<WatchlistSubscription>(this.api.url('/watchlist'), {
        crypto_currency_id: cryptoCurrencyId,
      })
    );
    const next = new Set(this.idsInternal());
    next.add(cryptoCurrencyId);
    this.idsInternal.set(next);
    return sub;
  }

  async deleteByCryptoCurrencyId(cryptoCurrencyId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(this.api.url(`/watchlist/${cryptoCurrencyId}`))
    );
    const next = new Set(this.idsInternal());
    next.delete(cryptoCurrencyId);
    this.idsInternal.set(next);
  }
}
