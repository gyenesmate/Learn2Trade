import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { CryptoCurrency, PriceAlert } from '@core/models/models';
import { ApiService } from '@core/services/api.service';
import { toNumber } from '@core/utils/number.util';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { toBinancePair } from '@core/binance/binance.utils';
import { AuthService } from './auth.service';
import { CryptoCurrenciesService } from './crypto-currencies.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class PriceAlertsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly cryptos = inject(CryptoCurrenciesService);
  private readonly marketData = inject(BinanceMarketDataService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly alerts = signal<PriceAlert[]>([]);
  readonly firedAlerts = signal<PriceAlert[]>([]);

  private started = false;
  private currentUserId: string | null = null;
  private readonly cryptoCache = new Map<string, CryptoCurrency>();
  /** Active miniTicker watches keyed by Binance pair. */
  private readonly tickerSubs = new Map<string, Subscription>();
  /** pair → crypto ids that have active alerts on that pair */
  private readonly pairToCryptoIds = new Map<string, Set<string>>();

  constructor() {
    effect(() => {
      if (!this.started) return;
      const user = this.auth.currentUser();
      if (user === undefined) return;

      const uid = user?.id ?? null;
      if (uid === this.currentUserId) return;
      this.currentUserId = uid;

      this.alerts.set([]);
      this.firedAlerts.set([]);

      if (!uid) {
        this.clearTickerWatches();
        return;
      }

      void this.reloadUserAlerts();
    });
  }

  private normalize(alert: PriceAlert): PriceAlert {
    return {
      ...alert,
      alert_price: toNumber(alert.alert_price),
    };
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    const user = this.auth.currentUser();
    if (user === undefined) return;

    const uid = user?.id ?? null;
    this.currentUserId = uid;
    this.alerts.set([]);
    this.firedAlerts.set([]);

    if (!uid) {
      this.clearTickerWatches();
      return;
    }

    void this.reloadUserAlerts();
  }

  stop(): void {
    this.started = false;
    this.clearTickerWatches();
    this.currentUserId = null;
    this.alerts.set([]);
    this.firedAlerts.set([]);
  }

  async getByUserId(_userId?: string): Promise<PriceAlert[]> {
    const items = await firstValueFrom(
      this.http.get<PriceAlert[]>(this.api.url('/price-alerts/me'))
    );
    return items.map((item) => this.normalize(item));
  }

  async create(item: {
    crypto_currency_id: string;
    alert_price: number;
    description?: string | null;
    alert_type: 'above' | 'below';
    is_active?: boolean;
  }): Promise<PriceAlert> {
    const created = await firstValueFrom(
      this.http.post<PriceAlert>(this.api.url('/price-alerts'), {
        crypto_currency_id: item.crypto_currency_id,
        alert_price: Number(item.alert_price),
        description: item.description ?? null,
        alert_type: item.alert_type,
        is_active: item.is_active ?? true,
      })
    );
    const normalized = this.normalize(created);
    if (this.currentUserId && normalized.user_id === this.currentUserId) {
      this.alerts.update((list) => [normalized, ...list]);
      void this.syncTickerWatches();
    }
    return normalized;
  }

  async updateById(
    id: string,
    updates: Partial<{
      alert_price: number;
      description: string | null;
      alert_type: 'above' | 'below';
      is_active: boolean;
    }>
  ): Promise<PriceAlert> {
    const body: Record<string, unknown> = { ...updates };
    if (updates.alert_price !== undefined) {
      body['alert_price'] = Number(updates.alert_price);
    }
    const updated = await firstValueFrom(
      this.http.patch<PriceAlert>(this.api.url(`/price-alerts/${id}`), body)
    );
    await this.reloadUserAlerts();
    return this.normalize(updated);
  }

  async deleteById(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(this.api.url(`/price-alerts/${id}`)));
    this.alerts.update((list) => list.filter((a) => a.id !== id));
    this.firedAlerts.update((list) => list.filter((a) => a.id !== id));
    void this.syncTickerWatches();
  }

  async deactivate(id: string): Promise<void> {
    await this.updateById(id, { is_active: false });
    this.firedAlerts.update((list) => list.filter((a) => a.id !== id));
  }

  async reloadUserAlerts(): Promise<void> {
    const uid = this.currentUserId;
    if (!uid) {
      this.alerts.set([]);
      this.firedAlerts.set([]);
      this.clearTickerWatches();
      return;
    }
    try {
      const all = await this.getByUserId(uid);
      const sorted = [...all].sort((a, b) => {
        const ta = Date.parse(a.created_at) || 0;
        const tb = Date.parse(b.created_at) || 0;
        return tb - ta;
      });
      this.alerts.set(sorted);
      const activeIds = new Set(sorted.filter((a) => a.is_active).map((a) => a.id));
      this.firedAlerts.update((list) => list.filter((a) => activeIds.has(a.id)));
      await this.syncTickerWatches();
    } catch (err) {
      console.error('PriceAlertsService.reloadUserAlerts failed', err);
      this.alerts.set([]);
      this.firedAlerts.set([]);
      this.clearTickerWatches();
    }
  }

  private async syncTickerWatches(): Promise<void> {
    if (!this.currentUserId) {
      this.clearTickerWatches();
      return;
    }

    const activeAlerts = this.alerts().filter((a) => !!a.is_active);
    if (!activeAlerts.length) {
      this.clearTickerWatches();
      return;
    }

    const nextPairToCryptoIds = new Map<string, Set<string>>();
    for (const alert of activeAlerts) {
      const crypto = await this.getCryptoCached(alert.crypto_currency_id);
      if (!crypto) continue;
      const pair = toBinancePair(crypto.symbol, crypto.exchange_currency);
      if (!pair) continue;
      let set = nextPairToCryptoIds.get(pair);
      if (!set) {
        set = new Set();
        nextPairToCryptoIds.set(pair, set);
      }
      set.add(alert.crypto_currency_id);
    }

    this.pairToCryptoIds.clear();
    for (const [pair, ids] of nextPairToCryptoIds) {
      this.pairToCryptoIds.set(pair, ids);
    }

    const needed = new Set(nextPairToCryptoIds.keys());

    for (const [pair, sub] of this.tickerSubs) {
      if (!needed.has(pair)) {
        sub.unsubscribe();
        this.tickerSubs.delete(pair);
      }
    }

    for (const pair of needed) {
      if (this.tickerSubs.has(pair)) continue;
      const sub = this.marketData.watchMiniTicker(pair).subscribe((ticker) => {
        void this.onTickerPrice(pair, ticker.price);
      });
      this.tickerSubs.set(pair, sub);
    }
  }

  private clearTickerWatches(): void {
    for (const sub of this.tickerSubs.values()) {
      sub.unsubscribe();
    }
    this.tickerSubs.clear();
    this.pairToCryptoIds.clear();
  }

  private async onTickerPrice(pair: string, price: number): Promise<void> {
    if (!Number.isFinite(price) || price <= 0) return;

    const cryptoIds = this.pairToCryptoIds.get(pair);
    if (!cryptoIds?.size) return;

    const activeAlerts = this.alerts().filter(
      (a) => a.is_active && cryptoIds.has(a.crypto_currency_id)
    );
    if (!activeAlerts.length) return;

    const firedIds = new Set(this.firedAlerts().map((a) => a.id));
    const newlyFired: PriceAlert[] = [];

    for (const alert of activeAlerts) {
      const target = Number(alert.alert_price);
      if (!Number.isFinite(target)) continue;

      const hit =
        alert.alert_type === 'above' ? price >= target : price <= target;
      if (!hit || firedIds.has(alert.id)) continue;

      newlyFired.push(alert);
      firedIds.add(alert.id);
    }

    if (!newlyFired.length) return;

    this.firedAlerts.update((list) => [...newlyFired, ...list]);
    for (const a of newlyFired) {
      const crypto = await this.getCryptoCached(a.crypto_currency_id);
      const label = crypto
        ? `${crypto.name}${crypto.symbol ? ` (${crypto.symbol})` : ''}${
            crypto.exchange_currency ? ` / ${crypto.exchange_currency}` : ''
          }`
        : a.crypto_currency_id;
      const message = `${a.alert_type === 'above' ? '≥' : '≤'} ${a.alert_price}${
        a.description ? ` — ${a.description}` : ''
      }`;

      this.notification.alert(message, label, [
        {
          label: 'View',
          run: () => {
            void this.router.navigate(['/crypto', a.crypto_currency_id]);
          },
        },
        {
          label: 'Stop',
          run: () => {
            void this.deactivate(a.id);
          },
        },
      ]);
    }
  }

  private async getCryptoCached(id: string): Promise<CryptoCurrency | null> {
    if (this.cryptoCache.has(id)) return this.cryptoCache.get(id)!;
    try {
      const crypto = await this.cryptos.getById(id);
      if (crypto) this.cryptoCache.set(id, crypto);
      return crypto;
    } catch {
      return null;
    }
  }
}
