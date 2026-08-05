import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, firstValueFrom, timer } from 'rxjs';
import { CryptoCurrency, PriceAlert } from '../const/models';
import { ApiService } from '../core/api.service';
import { toNumber } from '../core/number.util';
import { AuthService } from './auth.service';
import { CryptoCurrenciesService } from './crypto-currencies.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class PriceAlertsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly cryptos = inject(CryptoCurrenciesService);
  private readonly notification = inject(NotificationService);

  private readonly alertsSubject = new BehaviorSubject<PriceAlert[]>([]);
  readonly alerts$ = this.alertsSubject.asObservable();

  private readonly firedAlertsSubject = new BehaviorSubject<PriceAlert[]>([]);
  readonly firedAlerts$ = this.firedAlertsSubject.asObservable();

  private started = false;
  private authSub?: Subscription;
  private pollSub?: Subscription;
  private currentUserId: string | null = null;
  private readonly cryptoCache = new Map<string, CryptoCurrency>();

  private normalize(alert: PriceAlert): PriceAlert {
    return {
      ...alert,
      alert_price: toNumber(alert.alert_price),
    };
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    this.authSub = this.auth.currentUserData$.subscribe((user) => {
      const uid = user?.id ?? null;
      if (uid === this.currentUserId) return;
      this.currentUserId = uid;

      this.alertsSubject.next([]);
      this.firedAlertsSubject.next([]);

      if (!uid) {
        this.stopPollingOnly();
        return;
      }

      void this.reloadUserAlerts();
    });
  }

  stop(): void {
    this.started = false;
    try {
      this.authSub?.unsubscribe();
    } catch {
      /* ignore */
    }
    this.authSub = undefined;
    this.stopPollingOnly();
    this.currentUserId = null;
    this.alertsSubject.next([]);
    this.firedAlertsSubject.next([]);
  }

  private stopPollingOnly(): void {
    try {
      this.pollSub?.unsubscribe();
    } catch {
      /* ignore */
    }
    this.pollSub = undefined;
  }

  private startPollingOnly(): void {
    this.stopPollingOnly();
    this.pollSub = timer(0, 15000).subscribe(() => {
      void this.tick();
    });
  }

  private ensurePollingState(): void {
    if (!this.currentUserId) {
      this.stopPollingOnly();
      return;
    }

    const hasActive = this.alertsSubject.value.some((a) => !!a.is_active);
    if (!hasActive) {
      this.stopPollingOnly();
      return;
    }

    if (!this.pollSub) {
      this.startPollingOnly();
    }
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
      this.alertsSubject.next([normalized, ...this.alertsSubject.value]);
      this.ensurePollingState();
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
    this.alertsSubject.next(this.alertsSubject.value.filter((a) => a.id !== id));
    this.firedAlertsSubject.next(
      this.firedAlertsSubject.value.filter((a) => a.id !== id)
    );
    this.ensurePollingState();
  }

  async deactivate(id: string): Promise<void> {
    await this.updateById(id, { is_active: false });
    this.firedAlertsSubject.next(
      this.firedAlertsSubject.value.filter((a) => a.id !== id)
    );
    this.ensurePollingState();
  }

  async reloadUserAlerts(): Promise<void> {
    const uid = this.currentUserId;
    if (!uid) {
      this.alertsSubject.next([]);
      this.firedAlertsSubject.next([]);
      return;
    }
    try {
      const all = await this.getByUserId(uid);
      const sorted = [...all].sort((a, b) => {
        const ta = Date.parse(a.created_at) || 0;
        const tb = Date.parse(b.created_at) || 0;
        return tb - ta;
      });
      this.alertsSubject.next(sorted);
      const activeIds = new Set(sorted.filter((a) => a.is_active).map((a) => a.id));
      this.firedAlertsSubject.next(
        this.firedAlertsSubject.value.filter((a) => activeIds.has(a.id))
      );
      this.ensurePollingState();
    } catch (err) {
      console.error('PriceAlertsService.reloadUserAlerts failed', err);
      this.alertsSubject.next([]);
      this.firedAlertsSubject.next([]);
      this.ensurePollingState();
    }
  }

  private async tick(): Promise<void> {
    if (!this.currentUserId) return;

    await this.reloadUserAlerts();

    const activeAlerts = this.alertsSubject.value.filter((a) => a.is_active);
    if (!activeAlerts.length) {
      this.ensurePollingState();
      return;
    }

    const uniqueCryptoIds = Array.from(
      new Set(activeAlerts.map((a) => a.crypto_currency_id))
    );
    const pricesByCryptoId = new Map<string, number>();

    await Promise.all(
      uniqueCryptoIds.map(async (cryptoId) => {
        const crypto = await this.getCryptoCached(cryptoId);
        if (!crypto) return;
        const pair = this.mapSymbolToBinancePair(crypto);
        if (!pair) return;
        const p = await this.fetchBinanceSpotPrice(pair);
        if (Number.isFinite(p) && p > 0) pricesByCryptoId.set(cryptoId, p);
      })
    );

    if (!pricesByCryptoId.size) return;

    const firedIds = new Set(this.firedAlertsSubject.value.map((a) => a.id));
    const newlyFired: PriceAlert[] = [];

    for (const alert of activeAlerts) {
      const price = pricesByCryptoId.get(alert.crypto_currency_id);
      if (!price) continue;

      const target = Number(alert.alert_price);
      if (!Number.isFinite(target)) continue;

      const hit =
        alert.alert_type === 'above' ? price >= target : price <= target;
      if (!hit) continue;
      if (firedIds.has(alert.id)) continue;

      newlyFired.push(alert);
      firedIds.add(alert.id);
    }

    if (newlyFired.length) {
      this.firedAlertsSubject.next([
        ...newlyFired,
        ...this.firedAlertsSubject.value,
      ]);
      for (const a of newlyFired) {
        const crypto = await this.getCryptoCached(a.crypto_currency_id);
        const name = crypto?.symbol || a.crypto_currency_id;
        this.notification.alert(
          `${name}: ${a.alert_type === 'above' ? '≥' : '≤'} ${a.alert_price}${
            a.description ? ' — ' + a.description : ''
          }`
        );
      }
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

  private mapSymbolToBinancePair(coin?: CryptoCurrency): string | null {
    if (!coin?.symbol) return null;
    const base = String(coin.symbol).trim().toLowerCase();
    if (!base) return null;

    const quoteRaw = String(coin.exchange_currency ?? '')
      .trim()
      .toLowerCase();
    const quote = quoteRaw === 'usd' ? 'usdt' : quoteRaw || 'usdt';

    const safeBase = base.replace(/[^a-z0-9]/g, '');
    const safeQuote = quote.replace(/[^a-z0-9]/g, '');
    if (!safeBase || !safeQuote) return null;
    return `${safeBase}${safeQuote}`;
  }

  private async fetchBinanceSpotPrice(pair: string): Promise<number> {
    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(
        pair.toUpperCase()
      )}`;
      const data = await fetch(url).then((r) => r.json());
      const price = Number(data?.price);
      return Number.isFinite(price) ? price : NaN;
    } catch {
      return NaN;
    }
  }
}
