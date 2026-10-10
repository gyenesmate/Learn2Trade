import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { NotificationService } from '@core/services/notification.service';
import { CryptoCurrency, Investment, PriceAlert, User, UserMe } from '@core/models/models';
import { firstValueFrom } from 'rxjs';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { RowAction, TableAction } from '@shared/components/data-table/data-table.types';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PageHeaderAction } from '@shared/components/page-header/page-header.types';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';
import { InvestmentsService } from '@core/services/investments.service';
import { PriceAlertsService } from '@core/services/price-alerts.service';
import { formatMoney } from '@core/utils/number.util';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  PORTFOLIO_ALERTS_COLUMNS,
  PORTFOLIO_CRYPTO_COLUMNS,
  PORTFOLIO_HEADER_ACTIONS,
  PORTFOLIO_INVESTMENTS_COLUMNS,
  PORTFOLIO_TABLE_ACTIONS,
  PORTFOLIO_USER_COLUMNS,
  PORTFOLIO_WATCHLIST_COLUMNS,
} from './portfolio.const';

@Component({
  selector: 'app-portfolio',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DataTableComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './portfolio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly cryptoCurrenciesService = inject(CryptoCurrenciesService);
  private readonly watchlistSubscriptionsService = inject(WatchlistSubscriptionsService);
  private readonly investmentsService = inject(InvestmentsService);
  private readonly priceAlertsService = inject(PriceAlertsService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly headerActions: PageHeaderAction[];

  private readonly t = (key: string, params?: Record<string, unknown>): string =>
    String(this.translate.instant(key, params));

  readonly user = this.authService.currentUser;
  readonly isAdmin = computed(() => !!this.user()?.is_admin);

  readonly fundsForm = this.fb.nonNullable.group({
    amount: [0 as number, [Validators.required, Validators.min(1)]],
  });

  readonly cryptoCurrencies = signal<CryptoCurrency[]>([]);
  readonly users = signal<User[]>([]);
  readonly adminLoading = signal(false);

  /** Keys only — data-table / page-header translate via `| translate` on language change. */
  readonly cryptoColumns = PORTFOLIO_CRYPTO_COLUMNS;
  readonly userColumns = PORTFOLIO_USER_COLUMNS;
  readonly watchlistColumns = PORTFOLIO_WATCHLIST_COLUMNS;
  readonly investmentsColumns = PORTFOLIO_INVESTMENTS_COLUMNS;
  readonly alertsColumns = PORTFOLIO_ALERTS_COLUMNS;

  readonly cryptoRowActions: RowAction<CryptoCurrency>[] = [
    {
      ...PORTFOLIO_TABLE_ACTIONS.edit,
      callback: (row) => this.editCryptoCurrency(row),
    },
    {
      ...PORTFOLIO_TABLE_ACTIONS.delete,
      callback: (row) => this.deleteCryptoCurrency(row),
    },
  ];

  readonly userRowActions: RowAction<User>[] = [
    {
      ...PORTFOLIO_TABLE_ACTIONS.ban,
      callback: (row) => this.deleteUser(row),
    },
  ];

  readonly cryptoActionBar: TableAction[] = [
    {
      ...PORTFOLIO_TABLE_ACTIONS.addCrypto,
      callback: () => this.addCryptoCurrency(),
    },
  ];

  readonly watchlistRows = signal<Array<{ id: string; cryptoCurrencyId: string; name: string; symbol: string; exchangeCurrency: string }>>([]);
  readonly watchlistRowActions: RowAction<any>[] = [
    {
      ...PORTFOLIO_TABLE_ACTIONS.delete,
      callback: (row) => void this.deleteWatchlistSubscription(row),
    },
  ];

  readonly investmentsRows = signal<Array<{ id: string; cryptoCurrencyId: string; currencyName: string; exchange: string; amount: number; soldAt: any; createdAt: any }>>([]);
  readonly investmentsRowActions: RowAction<any>[] = [
    {
      ...PORTFOLIO_TABLE_ACTIONS.view,
      callback: (row) => this.router.navigate(['/app/crypto', row.cryptoCurrencyId]),
    },
  ];

  readonly alertsRows = signal<Array<{ id: string; cryptoCurrencyId: string; currencyName: string; type: string; alertPrice: number; description: string; isActive: boolean; createdAt: any }>>([]);
  readonly alertsRowActions: RowAction<any>[] = [
    {
      ...PORTFOLIO_TABLE_ACTIONS.delete,
      callback: (row) => void this.deleteAlert(row),
    },
  ];

  private readonly cryptoByIdCache = signal(new Map<string, CryptoCurrency>());

  constructor() {
    this.headerActions = [
      {
        ...PORTFOLIO_HEADER_ACTIONS.editProfile,
        callback: () => this.editProfile(),
      },
    ];

    effect(() => {
      const user = this.user();
      if (user === undefined) return;

      untracked(() => {
        if (user?.is_admin) {
          void this.loadAdminTables();
        }
        void this.loadWatchlistTable(user);
        void this.loadInvestmentsTable(user);
      });
    });

    effect(() => {
      const alerts = this.priceAlertsService.alerts();
      const cryptoById = this.cryptoByIdCache();
      untracked(() => this.bindAlertsTable(alerts, cryptoById));
    });

    void this.prefetchCryptos();
  }

  private async prefetchCryptos(): Promise<void> {
    try {
      const cryptos = await this.cryptoCurrenciesService.getAll();
      this.cryptoByIdCache.set(new Map(cryptos.map((c) => [c.id, c] as const)));
    } catch {
      // ignore; alert rows will fall back to ids
    }
  }

  private bindAlertsTable(
    alerts: PriceAlert[],
    cryptoById: Map<string, CryptoCurrency>
  ): void {
    try {
      this.alertsRows.set(
        (alerts || []).map((a) => {
          const crypto = cryptoById.get(a.crypto_currency_id);
          return {
            id: a.id,
            cryptoCurrencyId: a.crypto_currency_id,
            currencyName: crypto?.name ?? a.crypto_currency_id,
            type: a.alert_type,
            alertPrice: Number(a.alert_price || 0),
            description: String(a.description || ''),
            isActive: !!a.is_active,
            createdAt: a.created_at || null
          };
        })
      );
    } catch (err) {
      console.error('Error binding alerts table', err);
      this.alertsRows.set([]);
    }
  }

  private async deleteAlert(row: { id: string }): Promise<void> {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: this.t('PORTFOLIO.CONFIRM_DELETE_ALERT_TITLE'),
        message: this.t('PORTFOLIO.CONFIRM_DELETE_ALERT_MESSAGE'),
        confirmText: this.t('COMMON.DELETE'),
        cancelText: this.t('COMMON.CANCEL'),
      },
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.priceAlertsService.deleteById(row.id);
      this.notification.success(this.t('PORTFOLIO.NOTIFY_ALERT_DELETED'));
    } catch (err) {
      console.error('Error deleting alert', err);
      this.notification.error(this.t('PORTFOLIO.NOTIFY_ALERT_DELETE_FAILED'));
    }
  }

  private async loadInvestmentsTable(user: UserMe | null): Promise<void> {
    try {
      if (!user?.id) {
        this.investmentsRows.set([]);
        return;
      }

      const [investments, cryptos] = await Promise.all([
        this.investmentsService.getByUserId().catch(() => [] as Investment[]),
        this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[])
      ]);

      const cryptoById = new Map(cryptos.map((c) => [c.id, c] as const));
      this.investmentsRows.set(
        investments.map((inv) => {
          const crypto = cryptoById.get(inv.crypto_currency_id);
          return {
            id: inv.id,
            cryptoCurrencyId: inv.crypto_currency_id,
            currencyName: crypto?.name ?? inv.crypto_currency_id,
            exchange: crypto?.exchange_currency ?? '',
            amount: Number(inv.amount || 0),
            soldAt: inv.sold_at || null,
            createdAt: inv.created_at || null
          };
        })
      );
    } catch (err) {
      console.error('Error loading investments', err);
      this.investmentsRows.set([]);
    }
  }

  private async loadWatchlistTable(user: UserMe | null): Promise<void> {
    try {
      if (!user?.id) {
        this.watchlistRows.set([]);
        return;
      }

      const [subs, cryptos] = await Promise.all([
        this.watchlistSubscriptionsService.getMe().catch(() => []),
        this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[])
      ]);
      const cryptoById = new Map(cryptos.map((c) => [c.id, c] as const));

      this.watchlistRows.set(
        subs.map((s) => {
          const crypto = cryptoById.get(s.crypto_currency_id);
          return {
            id: s.crypto_currency_id,
            cryptoCurrencyId: s.crypto_currency_id,
            name: crypto?.name ?? s.crypto_currency_id,
            symbol: crypto?.symbol ?? '',
            exchangeCurrency: crypto?.exchange_currency ?? ''
          };
        })
      );
    } catch (err) {
      console.error('Error loading watchlist', err);
      this.watchlistRows.set([]);
    }
  }

  async deleteWatchlistSubscription(row: { cryptoCurrencyId: string }): Promise<void> {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: this.t('PORTFOLIO.CONFIRM_DELETE_WATCHLIST_TITLE'),
        message: this.t('PORTFOLIO.CONFIRM_DELETE_WATCHLIST_MESSAGE'),
        confirmText: this.t('COMMON.DELETE'),
        cancelText: this.t('COMMON.CANCEL'),
      },
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.watchlistSubscriptionsService.deleteByCryptoCurrencyId(row.cryptoCurrencyId);
      this.notification.success(this.t('PORTFOLIO.NOTIFY_REMOVED_FROM_WATCHLIST'));
      await this.loadWatchlistTable(this.user() ?? null);
    } catch (err) {
      console.error('Error deleting watchlist subscription', err);
      this.notification.error(this.t('PORTFOLIO.NOTIFY_REMOVE_WATCHLIST_FAILED'));
    }
  }

  private async loadAdminTables(): Promise<void> {
    this.adminLoading.set(true);
    try {
      const [cryptos, users] = await Promise.all([
        this.cryptoCurrenciesService.getAll(),
        this.usersService.getAll()
      ]);
      this.cryptoCurrencies.set(cryptos);
      this.users.set(users);
      this.cryptoByIdCache.set(new Map(cryptos.map((c) => [c.id, c] as const)));
    } catch (err) {
      console.error('Error loading admin tables:', err);
      this.notification.error(this.t('PORTFOLIO.NOTIFY_ADMIN_TABLES_LOAD_ERROR'));
    } finally {
      this.adminLoading.set(false);
    }
  }

  editProfile(): void {
    void this.router.navigate(['/app/edit-profile']);
  }

  addCryptoCurrency(): void {
    void this.router.navigate(['/app/admin/crypto-currencies/new']);
  }

  editCryptoCurrency(item: CryptoCurrency): void {
    void this.router.navigate(['/app/admin/crypto-currencies', item.id, 'edit']);
  }

  async deleteCryptoCurrency(item: CryptoCurrency): Promise<void> {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: this.t('PORTFOLIO.CONFIRM_DELETE_CRYPTO_TITLE'),
        message: this.t('PORTFOLIO.CONFIRM_DELETE_CRYPTO_MESSAGE', { name: item.name }),
        confirmText: this.t('COMMON.DELETE'),
        cancelText: this.t('COMMON.CANCEL'),
      },
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.cryptoCurrenciesService.delete(item.id);
      this.notification.success(this.t('PORTFOLIO.NOTIFY_CRYPTO_DELETED'));
      await this.loadAdminTables();
    } catch (err) {
      console.error('Error deleting crypto currency:', err);
      this.notification.error(this.t('PORTFOLIO.NOTIFY_CRYPTO_DELETE_ERROR'));
    }
  }

  async deleteUser(user: User): Promise<void> {
    const actionKey = user.is_banned ? 'PORTFOLIO.ACTION_UNBAN' : 'PORTFOLIO.ACTION_BAN';
    const action = this.t(actionKey);
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: this.t('PORTFOLIO.CONFIRM_BAN_USER_TITLE', { action }),
        message: this.t('PORTFOLIO.CONFIRM_BAN_USER_MESSAGE', {
          action,
          username: user.username,
          email: user.email,
        }),
        confirmText: action,
        cancelText: this.t('COMMON.CANCEL'),
      },
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      if (user.is_banned) {
        await this.usersService.unbanByUid(user.id);
        this.notification.success(this.t('PORTFOLIO.NOTIFY_USER_UNBANNED'));
      } else {
        await this.usersService.banByUid(user.id);
        this.notification.success(this.t('PORTFOLIO.NOTIFY_USER_BANNED'));
      }
      await this.loadAdminTables();
    } catch (err) {
      console.error('Error updating user ban status:', err);
      this.notification.error(this.t('PORTFOLIO.NOTIFY_BAN_STATUS_ERROR'));
    }
  }

  formatBalance(value: number): string {
    return formatMoney(Number(value || 0));
  }

  themeLabelKey(theme: string | null | undefined): string {
    switch (theme) {
      case 'light':
        return 'PROFILE.THEME_LIGHT';
      case 'system':
        return 'PROFILE.THEME_SYSTEM';
      default:
        return 'PROFILE.THEME_DARK';
    }
  }

  async addCurrency(): Promise<void> {
    this.fundsForm.markAllAsTouched();
    if (this.fundsForm.invalid) return;
    const amount = Number(this.fundsForm.controls.amount.value);
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      await this.usersService.addCurrencyToBalance(amount);
      this.fundsForm.reset({ amount: 0 });
      this.notification.success(this.t('PORTFOLIO.NOTIFY_CURRENCY_ADDED'));
    } catch (error) {
      console.error('Error adding currency:', error);
      this.notification.error(this.t('PORTFOLIO.NOTIFY_CURRENCY_ADD_ERROR'));
    }
  }
}
