import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { PriceAlert, CryptoCurrency } from '../const/models';
import { AuthService } from './auth.service';
import { CryptoCurrenciesService } from './crypto-currencies.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class PriceAlertsService {
  private readonly collectionName = 'priceAlerts';

  private readonly alertsSubject = new BehaviorSubject<PriceAlert[]>([]);
  readonly alerts$ = this.alertsSubject.asObservable();

  private readonly firedAlertsSubject = new BehaviorSubject<PriceAlert[]>([]);
  readonly firedAlerts$ = this.firedAlertsSubject.asObservable();

  private started = false;
  private authSub?: Subscription;
  private pollSub?: Subscription;
  private currentUserId: string | null = null;

  private readonly cryptoCache = new Map<string, CryptoCurrency>();

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private cryptos: CryptoCurrenciesService,
    private notification: NotificationService
  ) {}

  /**
   * Starts background loading + polling for the current user.
   * Safe to call multiple times.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    this.authSub = this.auth.currentUserData$.subscribe(user => {
      const uid = user?.uid ?? null;
      if (uid === this.currentUserId) return;
      this.currentUserId = uid;

      // reset state when user changes
      this.alertsSubject.next([]);
      this.firedAlertsSubject.next([]);

      if (!uid) {
        this.stopPollingOnly();
        return;
      }

      // (re)load + start polling
      void this.reloadUserAlerts();
    });
  }

  stop(): void {
    this.started = false;
    try { this.authSub?.unsubscribe(); } catch {}
    this.authSub = undefined;
    this.stopPollingOnly();
    this.currentUserId = null;
    this.alertsSubject.next([]);
    this.firedAlertsSubject.next([]);
  }

  private stopPollingOnly(): void {
    try { this.pollSub?.unsubscribe(); } catch {}
    this.pollSub = undefined;
  }

  private startPollingOnly(): void {
    this.stopPollingOnly();
    // Poll frequently enough for UX, but not too aggressive.
    this.pollSub = timer(0, 15000).subscribe(() => {
      void this.tick();
    });
  }

  private ensurePollingState(): void {
    if (!this.currentUserId) {
      this.stopPollingOnly();
      return;
    }

    const hasActive = this.alertsSubject.value.some(a => !!a.isActive);
    if (!hasActive) {
      this.stopPollingOnly();
      return;
    }

    if (!this.pollSub) {
      this.startPollingOnly();
    }
  }

  async getAll(): Promise<PriceAlert[]> {
    return this.fs.getAll<PriceAlert>(this.collectionName);
  }

  async getById(id: string): Promise<PriceAlert | null> {
    return this.fs.getById<PriceAlert>(this.collectionName, id);
  }

  async getByUserId(userId: string): Promise<PriceAlert[]> {
    return this.fs.getWhere<PriceAlert>(this.collectionName, 'userId', '==', userId);
  }

  async create(item: Omit<PriceAlert, 'id'>): Promise<string> {
    const id = await this.fs.add<PriceAlert>(this.collectionName, item as any);
    // keep local cache in sync
    if (this.currentUserId && item.userId === this.currentUserId) {
      const next = [{ ...(item as any), id } as PriceAlert, ...this.alertsSubject.value];
      this.alertsSubject.next(next);
      this.ensurePollingState();
    }
    return id;
  }

  async updateById(id: string, updates: Partial<Omit<PriceAlert, 'id'>>): Promise<void> {
    await this.fs.updateById<PriceAlert>(this.collectionName, id, updates as any);
    // refresh local cache (simple approach)
    await this.reloadUserAlerts();
  }

  async deleteById(id: string): Promise<void> {
    await this.fs.deleteById(this.collectionName, id);
    // update local caches
    this.alertsSubject.next(this.alertsSubject.value.filter(a => a.id !== id));
    this.firedAlertsSubject.next(this.firedAlertsSubject.value.filter(a => a.id !== id));
    this.ensurePollingState();
  }

  async deactivate(id: string): Promise<void> {
    await this.updateById(id, { isActive: false } as any);
    // If it was fired, remove it from pinned widget.
    this.firedAlertsSubject.next(this.firedAlertsSubject.value.filter(a => a.id !== id));
    this.ensurePollingState();
  }

  /** Reloads alerts for current user (or clears if logged out). */
  async reloadUserAlerts(): Promise<void> {
    const uid = this.currentUserId;
    if (!uid) {
      this.alertsSubject.next([]);
      this.firedAlertsSubject.next([]);
      return;
    }
    try {
      const all = await this.getByUserId(uid);
      // newest first
      const sorted = [...all].sort((a, b) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? (a.createdAt as any)?.seconds ?? 0;
        const tb = (b.createdAt as any)?.toMillis?.() ?? (b.createdAt as any)?.seconds ?? 0;
        return tb - ta;
      });
      this.alertsSubject.next(sorted);
      // prune fired list for deleted/inactive alerts
      const activeIds = new Set(sorted.filter(a => a.isActive).map(a => a.id));
      this.firedAlertsSubject.next(this.firedAlertsSubject.value.filter(a => activeIds.has(a.id)));

      // start/stop background polling based on whether any alerts are active
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

    // periodically refresh alerts from Firestore so background stays accurate
    await this.reloadUserAlerts();

    const activeAlerts = this.alertsSubject.value.filter(a => a.isActive);
    if (!activeAlerts.length) {
      // nothing to poll right now
      this.ensurePollingState();
      return;
    }

    // group by cryptoCurrencyId
    const uniqueCryptoIds = Array.from(new Set(activeAlerts.map(a => a.cryptoCurrencyId)));
    const pricesByCryptoId = new Map<string, number>();

    await Promise.all(uniqueCryptoIds.map(async (cryptoId) => {
      const crypto = await this.getCryptoCached(cryptoId);
      if (!crypto) return;
      const pair = this.mapSymbolToBinancePair(crypto);
      if (!pair) return;
      const p = await this.fetchBinanceSpotPrice(pair);
      if (Number.isFinite(p) && p > 0) pricesByCryptoId.set(cryptoId, p);
    }));

    if (!pricesByCryptoId.size) return;

    const firedIds = new Set(this.firedAlertsSubject.value.map(a => a.id));
    const newlyFired: PriceAlert[] = [];

    for (const alert of activeAlerts) {
      const price = pricesByCryptoId.get(alert.cryptoCurrencyId);
      if (!price) continue;

      const target = Number(alert.alertPrice);
      if (!Number.isFinite(target)) continue;

      const hit = alert.type === 'above' ? price >= target : price <= target;
      if (!hit) continue;
      if (firedIds.has(alert.id)) continue;

      newlyFired.push(alert);
      firedIds.add(alert.id);
    }

    if (newlyFired.length) {
      this.firedAlertsSubject.next([...newlyFired, ...this.firedAlertsSubject.value]);
      // Also raise a toast so user notices even if widget is minimized.
      for (const a of newlyFired) {
        const crypto = await this.getCryptoCached(a.cryptoCurrencyId);
        const name = crypto?.symbol || a.cryptoCurrencyId;
        this.notification.alert(`${name}: ${a.type === 'above' ? '≥' : '≤'} ${a.alertPrice}${a.description ? ' — ' + a.description : ''}`);
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

    // Binance spot generally uses USDT rather than USD.
    const quoteRaw = String(coin.exchangeCurrency ?? '').trim().toLowerCase();
    const quote = quoteRaw === 'usd' ? 'usdt' : (quoteRaw || 'usdt');

    const safeBase = base.replace(/[^a-z0-9]/g, '');
    const safeQuote = quote.replace(/[^a-z0-9]/g, '');
    if (!safeBase || !safeQuote) return null;
    return `${safeBase}${safeQuote}`;
  }

  private async fetchBinanceSpotPrice(pair: string): Promise<number> {
    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(pair.toUpperCase())}`;
      const data = await fetch(url).then(r => r.json());
      const price = Number(data?.price);
      return Number.isFinite(price) ? price : NaN;
    } catch {
      return NaN;
    }
  }
}
