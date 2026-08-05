import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { NotificationService } from '../../../services/notification.service';
import { CryptoCurrency, Investment, User, UserMe } from '../../../const/models';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { TableColumn, RowAction, TableAction } from '../../shared/data-table/data-table-utilities';
import { WatchlistSubscriptionsService } from '../../../services/watchlist-subscriptions.service';
import { InvestmentsService } from '../../../services/investments.service';
import { PriceAlertsService } from '../../../services/price-alerts.service';
import { PriceAlert } from '../../../const/models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, DataTableComponent],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  user$: Observable<UserMe | null | undefined>;
  addAmount: number = 0;

  // Admin tables
  isAdmin = false;
  cryptoCurrencies: CryptoCurrency[] = [];
  users: User[] = [];
  adminLoading = false;

  // Columns and actions for admin tables
  cryptoColumns: TableColumn<CryptoCurrency>[] = [
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'exchange_currency', label: 'Quote' }
  ];

  userColumns: TableColumn<User>[] = [
    { key: 'username', label: 'User name' },
    { key: 'email', label: 'Email' },
    { key: 'is_admin', label: 'Admin', type: 'boolean' }
  ];

  cryptoRowActions: RowAction<CryptoCurrency>[] = [
    { label: 'Edit', icon: 'edit', callback: (row) => this.editCryptoCurrency(row) },
    { label: 'Delete', icon: 'delete', color: 'warn', callback: (row) => this.deleteCryptoCurrency(row) }
  ];

  userRowActions: RowAction<User>[] = [
    { label: 'Ban/Unban', icon: 'block', color: 'warn', callback: (row) => this.deleteUser(row) }
  ];

  cryptoActionBar: TableAction[] = [];

  watchlistColumns: TableColumn<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'exchangeCurrency', label: 'Quote' }
  ];
  watchlistRows: Array<{ cryptoCurrencyId: string; name: string; symbol: string; exchangeCurrency: string }> = [];
  watchlistRowActions: RowAction<any>[] = [
    { label: 'Delete', icon: 'delete', color: 'warn', callback: (row) => void this.deleteWatchlistSubscription(row) }
  ];

  investmentsColumns: TableColumn<any>[] = [
    { key: 'currencyName', label: 'Currency' },
    { key: 'exchange', label: 'Exchange' },
    { key: 'amount', label: 'Amount', type: 'currency' as any },
    { key: 'soldAt', label: 'Sold at', type: 'date' },
    { key: 'createdAt', label: 'Created at', type: 'date' }
  ];
  investmentsRows: Array<{ id: string; cryptoCurrencyId: string; currencyName: string; exchange: string; amount: number; soldAt: any; createdAt: any }> = [];
  investmentsRowActions: RowAction<any>[] = [
    { label: 'View', icon: 'visibility', callback: (row) => this.router.navigate(['/crypto', row.cryptoCurrencyId]) }
  ];

  alertsColumns: TableColumn<any>[] = [
    { key: 'currencyName', label: 'Currency' },
    { key: 'type', label: 'Type' },
    { key: 'alertPrice', label: 'Target', type: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
    { key: 'createdAt', label: 'Created at', type: 'date' }
  ];
  alertsRows: Array<{ id: string; cryptoCurrencyId: string; currencyName: string; type: string; alertPrice: number; description: string; isActive: boolean; createdAt: any }> = [];
  alertsRowActions: RowAction<any>[] = [
    { label: 'Delete', icon: 'delete', color: 'warn', callback: (row) => void this.deleteAlert(row) }
  ];

  private alertsSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private cryptoCurrenciesService: CryptoCurrenciesService,
    private watchlistSubscriptionsService: WatchlistSubscriptionsService,
    private investmentsService: InvestmentsService,
    private priceAlertsService: PriceAlertsService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {
    this.user$ = this.authService.currentUserData$;
    this.cryptoActionBar = [
      { label: 'Add', icon: 'add', callback: () => this.addCryptoCurrency() }
    ];
  }

  ngOnInit() {
    // bind once
    void this.bindAlertsTable();

    this.user$.subscribe(user => {
      this.isAdmin = !!user?.is_admin;

      if (this.isAdmin) {
        void this.loadAdminTables();
      }

      // load watchlist table for all users
      void this.loadWatchlistTable();

      // load investments table
      void this.loadInvestmentsTable();
    });
  }

  ngOnDestroy(): void {
    try { this.alertsSub?.unsubscribe(); } catch {}
    this.alertsSub = undefined;
  }

  private async bindAlertsTable(): Promise<void> {
    // Keep a live view of alerts for the current user.
    // PriceAlertsService already tracks current user in the background.
    try { this.alertsSub?.unsubscribe(); } catch {}
    this.alertsSub = this.priceAlertsService.alerts$.subscribe(async (alerts) => {
      try {
        const cryptos = await this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[]);
        const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));

        this.alertsRows = (alerts || []).map((a: PriceAlert) => {
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
        });
      } catch (err) {
        console.error('Error binding alerts table', err);
        this.alertsRows = [];
      }
    });
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

  private async loadInvestmentsTable(): Promise<void> {
    try {
      const user = await firstValueFrom(this.user$);
      if (!user?.id) {
        this.investmentsRows = [];
        return;
      }

      const [investments, cryptos] = await Promise.all([
        this.investmentsService.getByUserId().catch(() => [] as Investment[]),
        this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[])
      ]);

      const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));
      this.investmentsRows = investments.map(inv => {
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
      });
    } catch (err) {
      console.error('Error loading investments', err);
      this.investmentsRows = [];
    }
  }

  private async loadWatchlistTable(): Promise<void> {
    try {
      const user = await firstValueFrom(this.user$);
      if (!user?.id) {
        this.watchlistRows = [];
        return;
      }

      const [subs, cryptos] = await Promise.all([
        this.watchlistSubscriptionsService.getMe().catch(() => []),
        this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[])
      ]);
      const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));

      this.watchlistRows = subs.map(s => {
        const crypto = cryptoById.get(s.crypto_currency_id);
        return {
          cryptoCurrencyId: s.crypto_currency_id,
          name: crypto?.name ?? s.crypto_currency_id,
          symbol: crypto?.symbol ?? '',
          exchangeCurrency: crypto?.exchange_currency ?? ''
        };
      });
    } catch (err) {
      console.error('Error loading watchlist', err);
      this.watchlistRows = [];
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
      await this.loadWatchlistTable();
    } catch (err) {
      console.error('Error deleting watchlist subscription', err);
      this.notification.error('Failed to remove from watchlist');
    }
  }

  private async loadAdminTables(): Promise<void> {
    this.adminLoading = true;
    try {
      const [cryptos, users] = await Promise.all([
        this.cryptoCurrenciesService.getAll(),
        this.usersService.getAll()
      ]);
      this.cryptoCurrencies = cryptos;
      this.users = users;
    } catch (err) {
      console.error('Error loading admin tables:', err);
      this.notification.error('Error loading admin tables');
    } finally {
      this.adminLoading = false;
    }
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }

  addCryptoCurrency(): void {
    this.router.navigate(['/admin/crypto-currencies/new']);
  }

  editCryptoCurrency(item: CryptoCurrency): void {
    this.router.navigate(['/admin/crypto-currencies', item.id, 'edit']);
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

  async addCurrency() {
    if (this.addAmount > 0) {
      try {
        await this.usersService.addCurrencyToBalance(this.addAmount);
        this.addAmount = 0; // Reset form
        this.notification.success('Currency added successfully!');
      } catch (error) {
        console.error('Error adding currency:', error);
        this.notification.error('Error adding currency. Please try again.');
      }
    }
  }
}
