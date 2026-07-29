import { Component, OnInit, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CryptoCurrency, Investment, User } from '../../../const/models';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { CryptoCardComponent } from '../../shared/crypto-card/crypto-card.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InvestDialogComponent, InvestDialogResult } from '../../shared/invest-dialog/invest-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { InvestmentsService } from '../../../services/investments.service';
import { NotificationService } from '../../../services/notification.service';
import { firstValueFrom, Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { ActiveInvestmentComponent } from '../../shared/active-investment/active-investment.component';
import { SetPriceAlertDialogComponent, SetPriceAlertDialogResult } from '../../shared/set-price-alert-dialog/set-price-alert-dialog.component';
import { PriceAlertsService } from '../../../services/price-alerts.service';
import { FiredAlertsWidgetComponent } from '../../shared/fired-alerts-widget/fired-alerts-widget.component';

@Component({
  selector: 'app-crypto-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CryptoCardComponent, MatDialogModule, ActiveInvestmentComponent, FiredAlertsWidgetComponent],
  templateUrl: './crypto-detail-page.component.html',
  styleUrls: ['./crypto-detail-page.component.scss']
})
export class CryptoDetailPageComponent implements OnInit {
  cryptocurrencies: CryptoCurrency[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', exchangeCurrency: 'USD' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', exchangeCurrency: 'USD' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', exchangeCurrency: 'USD' },
    { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', exchangeCurrency: 'USD' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', exchangeCurrency: 'USD' }
  ];

  selectedId: string | null = null;
  selectedCrypto: CryptoCurrency | null = null;
  user$: Observable<User | null>;
  activeInvestments: Investment[] = [];
  investing = false;
  selling = false;

  private readonly selectedCryptoId = signal<string | null>(null);
  readonly alertsForSelected$: Observable<import('../../../const/models').PriceAlert[]>;

  @ViewChild('card') card?: CryptoCardComponent;

  constructor(
    private route: ActivatedRoute,
    private cryptoService: CryptoCurrenciesService,
    private dialog: MatDialog,
    private auth: AuthService,
    private users: UsersService,
    private investments: InvestmentsService,
    private priceAlerts: PriceAlertsService,
    private notification: NotificationService
  ) {
    this.user$ = this.auth.currentUserData$;

    this.alertsForSelected$ = combineLatest([
      this.priceAlerts.alerts$,
      // convert signal to observable by mapping to a simple subject via map in combineLatest
      new Observable<string | null>((sub) => {
        // emit current
        sub.next(this.selectedCryptoId());
        const eff = effect(() => sub.next(this.selectedCryptoId()));
        return () => eff && (eff as any)();
      })
    ]).pipe(
      map(([alerts, selectedId]) => {
        if (!selectedId) return [];
        return (alerts || []).filter(a => a.cryptoCurrencyId === selectedId && !!a.isActive);
      })
    );

    // Effect: when selectedCryptoId changes, run the page load logic
    effect(() => {
      const id = this.selectedCryptoId();
      // run async logic in microtask
      (async () => {
        this.selectedId = id;
        if (!id) {
          this.selectedCrypto = null;
          this.activeInvestments = [];
          return;
        }

        try {
          const fromDb = await this.cryptoService.getById(id);
          if (fromDb) {
            this.selectedCrypto = fromDb;
            await this.loadActiveInvestments();
            return;
          }
        } catch (err) {
          // ignore and fall back
        }

        this.selectedCrypto = this.cryptocurrencies.find(c => c.id === id) ?? null;
        await this.loadActiveInvestments();
      })();
    });
  }

  ngOnInit(): void {
    // wire route changes into the signal; the effect in constructor handles loading
    this.route.paramMap.subscribe(params => {
      this.selectedCryptoId.set(params.get('id'));
    });
  }

  private async loadActiveInvestments(): Promise<void> {
    try {
      const user = await firstValueFrom(this.user$);
      if (!user?.uid || !this.selectedCrypto?.id) {
        this.activeInvestments = [];
        return;
      }
      this.activeInvestments = await this.investments.getActiveByUserAndCrypto(user.uid, this.selectedCrypto.id);
    } catch {
      this.activeInvestments = [];
    }
  }

  openInvest(): void {
    if (!this.selectedCrypto) return;
    const currentPrice = Number(this.card?.livePrice || 0);
    const ref = this.dialog.open(InvestDialogComponent, {
      data: { crypto: this.selectedCrypto, currentPrice }
    });

    ref.afterClosed().subscribe((result: InvestDialogResult | null) => {
      if (!result) return;
      void this.confirmInvest(result);
    });
  }

  openSetAlert(): void {
    if (!this.selectedCrypto) return;
    const currentPrice = Number(this.card?.livePrice || 0);

    const ref = this.dialog.open(SetPriceAlertDialogComponent, {
      data: { crypto: this.selectedCrypto, currentPrice }
    });

    ref.afterClosed().subscribe((result: SetPriceAlertDialogResult | null) => {
      if (!result) return;
      void this.confirmSetAlert(result);
    });
  }

  private async confirmSetAlert(result: SetPriceAlertDialogResult): Promise<void> {
    if (!this.selectedCrypto) return;

    try {
      const user = await firstValueFrom(this.user$);
      if (!user?.uid) {
        this.notification.warning('Please log in to set alerts');
        return;
      }

      const alertPrice = Number(result.alertPrice);
      if (!Number.isFinite(alertPrice) || alertPrice <= 0) {
        this.notification.error('Invalid alert price');
        return;
      }

      const currentPrice = Number(this.card?.livePrice || 0);
      const type = alertPrice < currentPrice ? 'below' : 'above';

      await this.priceAlerts.create({
        cryptoCurrencyId: this.selectedCrypto.id,
        userId: user.uid,
        alertPrice,
        description: String(result.description || ''),
        type,
        isActive: true,
        createdAt: new Date() as any
      } as any);

      this.notification.success('Alert created');
    } catch (err: any) {
      console.error('confirmSetAlert failed', err);
      this.notification.error(err?.message || 'Failed to create alert');
    }
  }

  private async confirmInvest(result: InvestDialogResult): Promise<void> {
    if (!this.selectedCrypto) return;
    if (this.investing) return;
    this.investing = true;

    try {
      const user = await firstValueFrom(this.user$);
      if (!user?.uid) {
        this.notification.warning('Please log in to invest');
        return;
      }

      const amount = Number(result.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        this.notification.error('Invalid amount');
        return;
      }

      const balance = Number(user.preferences.websiteCurrencyBalance || 0);
      if (balance < amount) {
        this.notification.error('Insufficient balance');
        return;
      }

      const currentPrice = Number(this.card?.livePrice || 0);
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        this.notification.error('Current price unavailable');
        return;
      }

      // subtract first (atomicity is limited without transactions; keep it simple)
      await this.users.subtractCurrencyFromBalance(user.uid, amount);

      const id = await this.investments.create({
        cryptoCurrencyId: this.selectedCrypto.id,
        userId: user.uid,
        amount,
        buyingPrice: currentPrice,
        sellingPrice: null,
        isSold: false,
        description: result.description,
        soldAt: null
      } as any);

      const newInv: Investment = {
        id,
        cryptoCurrencyId: this.selectedCrypto.id,
        userId: user.uid,
        amount,
        buyingPrice: currentPrice,
        sellingPrice: null,
        isSold: false,
        description: result.description,
        soldAt: null as any,
        createdAt: new Date() as any
      };
      this.activeInvestments.push(newInv);

      this.notification.success('Investment created');
    } catch (err: any) {
      console.error('confirmInvest failed', err);
      this.notification.error(err?.message || 'Failed to invest');
    } finally {
      this.investing = false;
    }
  }

  async sellActiveInvestment(investmentId?: string): Promise<void> {
    if (this.selling) return;
    this.selling = true;

    try {
      const user = await firstValueFrom(this.user$);
      if (!user?.uid) throw new Error('User not found');

      const currentPrice = Number(this.card?.livePrice || 0);
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) throw new Error('Current price unavailable');

      let inv: Investment | undefined;
      if (investmentId) {
        inv = this.activeInvestments.find(i => i.id === investmentId);
      } else if (this.activeInvestments.length === 1) {
        inv = this.activeInvestments[0];
      } else {
        throw new Error('Select an investment to sell');
      }

      if (!inv) throw new Error('Investment not found');

      const buy = Number(inv.buyingPrice || 0);
      const amountPaid = Number(inv.amount || 0);
      if (!buy || !amountPaid) throw new Error('Invalid investment');

      const payout = amountPaid * (currentPrice / buy);

      await this.investments.updateById(inv.id, {
        sellingPrice: currentPrice,
        isSold: true,
        soldAt: new Date() as any
      } as any);

      await this.users.addCurrencyToBalance(user.uid, payout);
      this.notification.success('Investment sold');

      // remove from local list
      this.activeInvestments = this.activeInvestments.filter(i => i.id !== inv!.id);
    } catch (err: any) {
      console.error('sellActiveInvestment failed', err);
      this.notification.error(err?.message || 'Failed to sell');
    } finally {
      this.selling = false;
    }
  }
}