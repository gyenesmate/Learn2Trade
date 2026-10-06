import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CryptoCurrency, Investment, PriceAlert } from '@core/models/models';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { CryptoCardComponent } from '@shared/components/crypto-card/crypto-card.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { DataTableRow, RowAction, TableAction } from '@shared/components/data-table/data-table.types';
import { InvestDialogComponent } from '@features/trading/components/invest-dialog/invest-dialog.component';
import { InvestDialogResult } from '@features/trading/components/invest-dialog/invest-dialog.types';
import { AuthService } from '@core/services/auth.service';
import { InvestmentsService } from '@core/services/investments.service';
import { NotificationService } from '@core/services/notification.service';
import { SetPriceAlertDialogComponent } from '@features/trading/components/set-price-alert-dialog/set-price-alert-dialog.component';
import { SetPriceAlertDialogResult } from '@features/trading/components/set-price-alert-dialog/set-price-alert-dialog.types';
import { PriceAlertsService } from '@core/services/price-alerts.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import {
  TRADING_ALERT_COLUMNS,
  TRADING_INVESTMENT_COLUMNS,
  TRADING_PAGE_TITLE_FALLBACK,
  TRADING_TABLE_ACTIONS,
} from './trading.const';

type InvestmentRow = DataTableRow & {
  amount: number;
  buyingPrice: number;
  currentPrice: number;
  estPayout: number;
  description: string;
};

type AlertRow = DataTableRow & {
  type: string;
  alertPrice: number;
  description: string;
  isActive: boolean;
};

@Component({
  selector: 'app-trading',
  imports: [
    RouterModule,
    CryptoCardComponent,
    MatDialogModule,
    MatButtonModule,
    PageHeaderComponent,
    DataTableComponent,
  ],
  templateUrl: './trading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./trading.component.scss'],
})
export class TradingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly cryptoService = inject(CryptoCurrenciesService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly investments = inject(InvestmentsService);
  private readonly priceAlerts = inject(PriceAlertsService);
  private readonly notification = inject(NotificationService);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') }
  );

  readonly selectedId = computed(() => this.routeId());
  readonly selectedCrypto = signal<CryptoCurrency | null>(null);
  readonly activeInvestments = signal<Investment[]>([]);
  readonly cryptoAlerts = signal<PriceAlert[]>([]);
  readonly investing = signal(false);
  readonly selling = signal(false);
  /** Latest price from the detailed card chart (via livePriceChange). */
  readonly livePrice = signal(0);

  readonly pageTitle = computed(
    () => this.selectedCrypto()?.name ?? TRADING_PAGE_TITLE_FALLBACK
  );

  readonly investmentColumns = TRADING_INVESTMENT_COLUMNS;
  readonly alertColumns = TRADING_ALERT_COLUMNS;

  readonly investmentRows = computed<InvestmentRow[]>(() => {
    const price = this.livePrice();
    return this.activeInvestments().map((inv) => {
      const units = inv.buying_price > 0 ? inv.amount / inv.buying_price : 0;
      return {
        id: inv.id,
        amount: inv.amount,
        buyingPrice: inv.buying_price,
        currentPrice: price,
        estPayout: units * price,
        description: inv.description ?? '',
      };
    });
  });

  readonly alertRows = computed<AlertRow[]>(() =>
    this.cryptoAlerts().map((a) => ({
      id: a.id,
      type: a.alert_type,
      alertPrice: a.alert_price,
      description: a.description ?? '',
      isActive: a.is_active,
    }))
  );

  readonly investmentActionBar: TableAction[] = [
    {
      ...TRADING_TABLE_ACTIONS.invest,
      callback: () => this.openInvest(),
    },
  ];

  readonly alertActionBar: TableAction[] = [
    {
      ...TRADING_TABLE_ACTIONS.setAlert,
      callback: () => this.openSetAlert(),
    },
  ];

  readonly investmentRowActions: RowAction<InvestmentRow>[] = [
    {
      ...TRADING_TABLE_ACTIONS.sell,
      callback: (row) => void this.sellActiveInvestment(row.id),
    },
  ];

  readonly alertRowActions: RowAction<AlertRow>[] = [
    {
      ...TRADING_TABLE_ACTIONS.deleteAlert,
      callback: (row) => void this.deleteAlert(row.id),
    },
  ];

  constructor() {
    effect(() => {
      const id = this.routeId();
      untracked(() => void this.loadSelectedCrypto(id));
    });
  }

  onCardLivePrice(price: number): void {
    this.livePrice.set(Number.isFinite(price) ? price : 0);
  }

  private async loadSelectedCrypto(id: string | null): Promise<void> {
    if (!id) {
      this.selectedCrypto.set(null);
      this.activeInvestments.set([]);
      this.cryptoAlerts.set([]);
      this.livePrice.set(0);
      return;
    }

    this.livePrice.set(0);

    try {
      const fromDb = await this.cryptoService.getById(id);
      if (fromDb) {
        this.selectedCrypto.set(fromDb);
        await Promise.all([this.loadActiveInvestments(), this.loadCryptoAlerts()]);
        return;
      }
    } catch {
      // fall through to not-found
    }

    this.selectedCrypto.set(null);
    this.activeInvestments.set([]);
    this.cryptoAlerts.set([]);
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

  private async loadCryptoAlerts(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      const crypto = this.selectedCrypto();
      if (!user?.id || !crypto?.id) {
        this.cryptoAlerts.set([]);
        return;
      }
      const all = await this.priceAlerts.getByUserId(user.id);
      this.cryptoAlerts.set(all.filter((a) => a.crypto_currency_id === crypto.id));
    } catch {
      this.cryptoAlerts.set([]);
    }
  }

  openInvest(): void {
    const crypto = this.selectedCrypto();
    if (!crypto) return;
    const currentPrice = this.livePrice();
    const ref = this.dialog.open(InvestDialogComponent, {
      data: {
        crypto,
        currentPrice,
        availableBalance: Number(this.auth.currentUser()?.balance || 0),
      },
    });

    ref.afterClosed().subscribe((result: InvestDialogResult | null) => {
      if (!result) return;
      void this.confirmInvest(result);
    });
  }

  openSetAlert(): void {
    const crypto = this.selectedCrypto();
    if (!crypto) return;
    const currentPrice = this.livePrice();

    const ref = this.dialog.open(SetPriceAlertDialogComponent, {
      data: { crypto, currentPrice },
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

      const currentPrice = this.livePrice();
      const alertType: 'above' | 'below' = alertPrice < currentPrice ? 'below' : 'above';

      await this.priceAlerts.create({
        crypto_currency_id: crypto.id,
        alert_price: alertPrice,
        description: String(result.description || ''),
        alert_type: alertType,
        is_active: true,
      });

      this.notification.success('Alert created');
      await this.loadCryptoAlerts();
    } catch (err: unknown) {
      console.error('confirmSetAlert failed', err);
      this.notification.error((err as Error)?.message || 'Failed to create alert');
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

      const currentPrice = this.livePrice();
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        this.notification.error('Current price unavailable');
        return;
      }

      const newInv = await this.investments.create({
        crypto_currency_id: crypto.id,
        amount,
        buying_price: currentPrice,
        description: result.description,
      });

      this.activeInvestments.update((list) => [...list, newInv]);
      this.notification.success('Investment created');
    } catch (err: unknown) {
      console.error('confirmInvest failed', err);
      this.notification.error((err as Error)?.message || 'Failed to invest');
    } finally {
      this.investing.set(false);
    }
  }

  async sellActiveInvestment(investmentId?: string): Promise<void> {
    if (this.selling()) return;

    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: 'Sell investment',
            message: 'Sell this investment at the current market price?',
            confirmText: 'Sell',
            cancelText: 'Cancel',
          },
        })
        .afterClosed()
    );
    if (!confirmed) return;

    this.selling.set(true);

    try {
      const currentPrice = this.livePrice();
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        throw new Error('Current price unavailable');
      }

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
    } catch (err: unknown) {
      console.error('sellActiveInvestment failed', err);
      this.notification.error((err as Error)?.message || 'Failed to sell');
    } finally {
      this.selling.set(false);
    }
  }

  async deleteAlert(id: string): Promise<void> {
    try {
      await this.priceAlerts.deleteById(id);
      this.cryptoAlerts.update((list) => list.filter((a) => a.id !== id));
      this.notification.info('Alert deleted');
    } catch (err: unknown) {
      console.error('deleteAlert failed', err);
      this.notification.error((err as Error)?.message || 'Failed to delete alert');
    }
  }
}
