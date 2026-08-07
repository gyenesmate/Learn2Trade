import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { CryptoCurrency, Investment, PriceAlert } from '../../../const/models';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { CryptoCardComponent } from '../../shared/crypto-card/crypto-card.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InvestDialogComponent, InvestDialogResult } from '../../shared/invest-dialog/invest-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { InvestmentsService } from '../../../services/investments.service';
import { NotificationService } from '../../../services/notification.service';
import { ActiveInvestmentComponent } from '../../shared/active-investment/active-investment.component';
import { SetPriceAlertDialogComponent, SetPriceAlertDialogResult } from '../../shared/set-price-alert-dialog/set-price-alert-dialog.component';
import { PriceAlertsService } from '../../../services/price-alerts.service';
import { FiredAlertsWidgetComponent } from '../../shared/fired-alerts-widget/fired-alerts-widget.component';

@Component({
  selector: 'app-crypto-detail-page',
  imports: [RouterModule, CryptoCardComponent, MatDialogModule, ActiveInvestmentComponent, FiredAlertsWidgetComponent],
  templateUrl: './crypto-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crypto-detail-page.component.scss']
})
export class CryptoDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cryptoService = inject(CryptoCurrenciesService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly investments = inject(InvestmentsService);
  private readonly priceAlerts = inject(PriceAlertsService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly fallbackCryptocurrencies: CryptoCurrency[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', exchange_currency: 'USD', created_at: '', updated_at: '' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', exchange_currency: 'USD', created_at: '', updated_at: '' }
  ];

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') }
  );

  readonly selectedId = computed(() => this.routeId());
  readonly selectedCrypto = signal<CryptoCurrency | null>(null);
  readonly activeInvestments = signal<Investment[]>([]);
  readonly investing = signal(false);
  readonly selling = signal(false);

  readonly alertsForSelected = computed(() => {
    const id = this.selectedId();
    if (!id) return [] as PriceAlert[];
    return this.priceAlerts.alerts().filter(
      (a) => a.crypto_currency_id === id && !!a.is_active
    );
  });

  readonly card = viewChild<CryptoCardComponent>('card');

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      void this.loadSelectedCrypto(params.get('id'));
    });
  }

  private async loadSelectedCrypto(id: string | null): Promise<void> {
    if (!id) {
      this.selectedCrypto.set(null);
      this.activeInvestments.set([]);
      return;
    }

    try {
      const fromDb = await this.cryptoService.getById(id);
      if (fromDb) {
        this.selectedCrypto.set(fromDb);
        await this.loadActiveInvestments();
        return;
      }
    } catch {
      // ignore and fall back
    }

    this.selectedCrypto.set(this.fallbackCryptocurrencies.find((c) => c.id === id) ?? null);
    await this.loadActiveInvestments();
  }

  private async loadActiveInvestments(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      const crypto = this.selectedCrypto();
      if (!user?.id || !crypto?.id) {
        this.activeInvestments.set([]);
        return;
      }
      this.activeInvestments.set(
        await this.investments.getActiveByUserAndCrypto(user.id, crypto.id)
      );
    } catch {
      this.activeInvestments.set([]);
    }
  }

  openInvest(): void {
    const crypto = this.selectedCrypto();
    if (!crypto) return;
    const currentPrice = Number(this.card()?.livePrice || 0);
    const ref = this.dialog.open(InvestDialogComponent, {
      data: { crypto, currentPrice }
    });

    ref.afterClosed().subscribe((result: InvestDialogResult | null) => {
      if (!result) return;
      void this.confirmInvest(result);
    });
  }

  openSetAlert(): void {
    const crypto = this.selectedCrypto();
    if (!crypto) return;
    const currentPrice = Number(this.card()?.livePrice || 0);

    const ref = this.dialog.open(SetPriceAlertDialogComponent, {
      data: { crypto, currentPrice }
    });

    ref.afterClosed().subscribe((result: SetPriceAlertDialogResult | null) => {
      if (!result) return;
      void this.confirmSetAlert(result);
    });
  }

  private async confirmSetAlert(result: SetPriceAlertDialogResult): Promise<void> {
    const crypto = this.selectedCrypto();
    if (!crypto) return;

    try {
      const user = this.auth.currentUser();
      if (!user?.id) {
        this.notification.warning('Please log in to set alerts');
        return;
      }

      const alertPrice = Number(result.alertPrice);
      if (!Number.isFinite(alertPrice) || alertPrice <= 0) {
        this.notification.error('Invalid alert price');
        return;
      }

      const currentPrice = Number(this.card()?.livePrice || 0);
      const alertType: 'above' | 'below' = alertPrice < currentPrice ? 'below' : 'above';

      await this.priceAlerts.create({
        crypto_currency_id: crypto.id,
        alert_price: alertPrice,
        description: String(result.description || ''),
        alert_type: alertType,
        is_active: true
      });

      this.notification.success('Alert created');
    } catch (err: any) {
      console.error('confirmSetAlert failed', err);
      this.notification.error(err?.message || 'Failed to create alert');
    }
  }

  private async confirmInvest(result: InvestDialogResult): Promise<void> {
    const crypto = this.selectedCrypto();
    if (!crypto) return;
    if (this.investing()) return;
    this.investing.set(true);

    try {
      const user = this.auth.currentUser();
      if (!user?.id) {
        this.notification.warning('Please log in to invest');
        return;
      }

      const amount = Number(result.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        this.notification.error('Invalid amount');
        return;
      }

      const balance = Number(user.balance || 0);
      if (balance < amount) {
        this.notification.error('Insufficient balance');
        return;
      }

      const currentPrice = Number(this.card()?.livePrice || 0);
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        this.notification.error('Current price unavailable');
        return;
      }

      const newInv = await this.investments.create({
        crypto_currency_id: crypto.id,
        amount,
        buying_price: currentPrice,
        description: result.description
      });

      this.activeInvestments.update((list) => [...list, newInv]);
      this.notification.success('Investment created');
    } catch (err: any) {
      console.error('confirmInvest failed', err);
      this.notification.error(err?.message || 'Failed to invest');
    } finally {
      this.investing.set(false);
    }
  }

  async sellActiveInvestment(investmentId?: string): Promise<void> {
    if (this.selling()) return;
    this.selling.set(true);

    try {
      const currentPrice = Number(this.card()?.livePrice || 0);
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) throw new Error('Current price unavailable');

      const list = this.activeInvestments();
      let inv: Investment | undefined;
      if (investmentId) {
        inv = list.find((i) => i.id === investmentId);
      } else if (list.length === 1) {
        inv = list[0];
      } else {
        throw new Error('Select an investment to sell');
      }

      if (!inv) throw new Error('Investment not found');

      await this.investments.sell(inv.id, currentPrice);
      this.notification.success('Investment sold');
      this.activeInvestments.update((items) => items.filter((i) => i.id !== inv!.id));
    } catch (err: any) {
      console.error('sellActiveInvestment failed', err);
      this.notification.error(err?.message || 'Failed to sell');
    } finally {
      this.selling.set(false);
    }
  }
}
