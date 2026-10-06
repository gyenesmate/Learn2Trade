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
import { TableColumn, RowAction, TableAction } from '@shared/components/data-table/data-table.types';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PageHeaderAction } from '@shared/components/page-header/page-header.types';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';
import { InvestmentsService } from '@core/services/investments.service';
import { PriceAlertsService } from '@core/services/price-alerts.service';
import { formatMoney } from '@core/utils/number.util';
import { PORTFOLIO_HEADER_ACTIONS, PORTFOLIO_PAGE_TITLE, PORTFOLIO_TABLE_ACTIONS } from './portfolio.const';

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
  ],
  templateUrl: './portfolio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./portfolio.component.scss'],
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

  readonly pageTitle = PORTFOLIO_PAGE_TITLE;
  readonly headerActions: PageHeaderAction[] = [
    {
      ...PORTFOLIO_HEADER_ACTIONS.editProfile,
      callback: () => this.editProfile(),
    },
  ];

  readonly user = this.authService.currentUser;
  readonly isAdmin = computed(() => !!this.user()?.is_admin);

  readonly fundsForm = this.fb.nonNullable.group({
    amount: [0 as number, [Validators.required, Validators.min(1)]],
  });

  readonly cryptoCurrencies = signal<CryptoCurrency[]>([]);
  readonly users = signal<User[]>([]);
  readonly adminLoading = signal(false);

  cryptoColumns: TableColumn<CryptoCurrency>[] = [
    { key: 'name', label: 'Name', filterable: true },
    { key: 'symbol', label: 'Symbol', filterable: true },
    { key: 'exchange_currency', label: 'Quote', filterable: true }
  ];

  userColumns: TableColumn<User>[] = [
    { key: 'username', label: 'User name', filterable: true },
    { key: 'email', label: 'Email', filterable: true },
    { key: 'is_admin', label: 'Admin', type: 'boolean' }
  ];

  cryptoRowActions: RowAction<CryptoCurrency>[] = [
    { ...PORTFOLIO_TABLE_ACTIONS.edit, callback: (row) => this.editCryptoCurrency(row) },
    { ...PORTFOLIO_TABLE_ACTIONS.delete, callback: (row) => this.deleteCryptoCurrency(row) }
  ];

  userRowActions: RowAction<User>[] = [
    { ...PORTFOLIO_TABLE_ACTIONS.ban, callback: (row) => this.deleteUser(row) }
  ];

  cryptoActionBar: TableAction[] = [
    { ...PORTFOLIO_TABLE_ACTIONS.addCrypto, callback: () => this.addCryptoCurrency() }
  ];

  watchlistColumns: TableColumn<any>[] = [
    { key: 'name', label: 'Name', filterable: true },
    { key: 'symbol', label: 'Symbol', filterable: true },
    { key: 'exchangeCurrency', label: 'Quote', filterable: true }
  ];
  readonly watchlistRows = signal<Array<{ id: string; cryptoCurrencyId: string; name: string; symbol: string; exchangeCurrency: string }>>([]);
  watchlistRowActions: RowAction<any>[] = [
    { ...PORTFOLIO_TABLE_ACTIONS.delete, callback: (row) => void this.deleteWatchlistSubscription(row) }
  ];

  investmentsColumns: TableColumn<any>[] = [
    { key: 'currencyName', label: 'Currency', filterable: true },
    { key: 'exchange', label: 'Exchange', filterable: true },
    { key: 'amount', label: 'Amount', type: 'currency' as any },
    { key: 'soldAt', label: 'Sold at', type: 'date' },
    { key: 'createdAt', label: 'Created at', type: 'date' }
  ];
  readonly investmentsRows = signal<Array<{ id: string; cryptoCurrencyId: string; currencyName: string; exchange: string; amount: number; soldAt: any; createdAt: any }>>([]);
  investmentsRowActions: RowAction<any>[] = [
    { ...PORTFOLIO_TABLE_ACTIONS.view, callback: (row) => this.router.navigate(['/crypto', row.cryptoCurrencyId]) }
  ];

  alertsColumns: TableColumn<any>[] = [
    { key: 'currencyName', label: 'Currency', filterable: true },
    { key: 'type', label: 'Type', filterable: true },
    { key: 'alertPrice', label: 'Target', type: 'number' },
    { key: 'description', label: 'Description', filterable: true },
    { key: 'isActive', label: 'Active', type: 'boolean' },
    { key: 'createdAt', label: 'Created at', type: 'date' }
  ];
  readonly alertsRows = signal<Array<{ id: string; cryptoCurrencyId: string; currencyName: string; type: string; alertPrice: number; description: string; isActive: boolean; createdAt: any }>>([]);
  alertsRowActions: RowAction<any>[] = [
    { ...PORTFOLIO_TABLE_ACTIONS.delete, callback: (row) => void this.deleteAlert(row) }
  ];

  private readonly cryptoByIdCache = signal(new Map<string, CryptoCurrency>());

  constructor() {
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
        title: 'Delete alert',
        message: 'Delete this alert?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.priceAlertsService.deleteById(row.id);
      this.notification.success('Alert deleted');
    } catch (err) {
      console.error('Error deleting alert', err);
      this.notification.error('Failed to delete alert');
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
        title: 'Delete watchlist subscription',
        message: 'Remove this item from your watchlist? ',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.watchlistSubscriptionsService.deleteByCryptoCurrencyId(row.cryptoCurrencyId);
      this.notification.success('Removed from watchlist');
      await this.loadWatchlistTable(this.user() ?? null);
    } catch (err) {
      console.error('Error deleting watchlist subscription', err);
      this.notification.error('Failed to remove from watchlist');
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
      this.notification.error('Error loading admin tables');
    } finally {
      this.adminLoading.set(false);
    }
  }

  editProfile(): void {
    void this.router.navigate(['/edit-profile']);
  }

  addCryptoCurrency(): void {
    void this.router.navigate(['/admin/crypto-currencies/new']);
  }

  editCryptoCurrency(item: CryptoCurrency): void {
    void this.router.navigate(['/admin/crypto-currencies', item.id, 'edit']);
  }

  async deleteCryptoCurrency(item: CryptoCurrency): Promise<void> {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete crypto currency',
        message: `Delete ${item.name}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.cryptoCurrenciesService.delete(item.id);
      this.notification.success('Crypto currency deleted');
      await this.loadAdminTables();
    } catch (err) {
      console.error('Error deleting crypto currency:', err);
      this.notification.error('Error deleting crypto currency');
    }
  }

  async deleteUser(user: User): Promise<void> {
    const action = user.is_banned ? 'Unban' : 'Ban';
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} user`,
        message: `${action} user ${user.username} (${user.email})?`,
        confirmText: action,
        cancelText: 'Cancel'
      }
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      if (user.is_banned) {
        await this.usersService.unbanByUid(user.id);
        this.notification.success('User unbanned');
      } else {
        await this.usersService.banByUid(user.id);
        this.notification.success('User banned');
      }
      await this.loadAdminTables();
    } catch (err) {
      console.error('Error updating user ban status:', err);
      this.notification.error('Error updating user ban status');
    }
  }

  formatBalance(value: number): string {
    return formatMoney(Number(value || 0));
  }

  async addCurrency(): Promise<void> {
    this.fundsForm.markAllAsTouched();
    if (this.fundsForm.invalid) return;
    const amount = Number(this.fundsForm.controls.amount.value);
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      await this.usersService.addCurrencyToBalance(amount);
      this.fundsForm.reset({ amount: 0 });
      this.notification.success('Currency added successfully!');
    } catch (error) {
      console.error('Error adding currency:', error);
      this.notification.error('Error adding currency. Please try again.');
    }
  }
}
