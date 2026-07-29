import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { NotificationService } from '../../../services/notification.service';
import { CryptoCurrency, Investment, User } from '../../../const/models';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { TableColumn, RowAction, TableAction } from '../../shared/data-table/data-table-utilities';
import { WatchlistSubscriptionsService } from '../../../services/watchlist-subscriptions.service';
import { WatchlistSubscription } from '../../../const/models';
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
  user$: Observable<User | null>;
  addAmount: number = 0;
  avatarDisplayUrl: string | null = null;

  // Admin tables
  isAdmin = false;
  cryptoCurrencies: CryptoCurrency[] = [];
  users: User[] = [];
  adminLoading = false;
  
  // Columns and actions for admin tables
  cryptoColumns: TableColumn<CryptoCurrency>[] = [
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'exchangeCurrency', label: 'Quote' }
  ];

  userColumns: TableColumn<User>[] = [
    { key: 'userName', label: 'User name' },
    { key: 'email', label: 'Email' },
    { key: 'isAdmin', label: 'Admin' }
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
  watchlistRows: Array<{ subscriptionId: string; cryptoCurrencyId: string; name: string; symbol: string; exchangeCurrency: string }> = [];
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
      this.isAdmin = !!user?.isAdmin;

      if (user?.avatarUrl) {
        this.usersService.getAvatarUrl(user.avatarUrl).then(url => {
          this.avatarDisplayUrl = url;
        }).catch(error => {
          console.error('Error fetching avatar URL:', error);
          this.avatarDisplayUrl = null;
        });
      } else {
        this.avatarDisplayUrl = null;
      }

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
          const crypto = cryptoById.get(a.cryptoCurrencyId);
          const createdAt = (a.createdAt as any)?.toDate?.() ?? a.createdAt;
          return {
            id: a.id,
            cryptoCurrencyId: a.cryptoCurrencyId,
            currencyName: crypto?.name ?? a.cryptoCurrencyId,
            type: a.type,
            alertPrice: Number(a.alertPrice || 0),
            description: String(a.description || ''),
            isActive: !!a.isActive,
            createdAt: createdAt || null
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
      if (!user?.uid) {
        this.investmentsRows = [];
        return;
      }

      const [investments, cryptos] = await Promise.all([
        this.investmentsService.getByUserId(user.uid).catch(() => [] as Investment[]),
        this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[])
      ]);

      const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));
      this.investmentsRows = investments.map(inv => {
        const crypto = cryptoById.get(inv.cryptoCurrencyId);
        const createdAt = (inv.createdAt as any)?.toDate?.() ?? inv.createdAt;
        const soldAt = (inv.soldAt as any)?.toDate?.() ?? inv.soldAt;
        return {
          id: inv.id,
          cryptoCurrencyId: inv.cryptoCurrencyId,
          currencyName: crypto?.name ?? inv.cryptoCurrencyId,
          exchange: crypto?.exchangeCurrency ?? '',
          amount: Number((inv as any).amount || 0),
          soldAt: soldAt || null,
          createdAt: createdAt || null
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
      const subs = (user?.preferences.watchlistSubscriptions ?? []) || [];
      const cryptos = await this.cryptoCurrenciesService.getAll().catch(() => [] as CryptoCurrency[]);
      const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));

      this.watchlistRows = subs
        .map(s => {
          const crypto = cryptoById.get(s.cryptoCurrencyId);
          return {
            subscriptionId: s.id,
            cryptoCurrencyId: s.cryptoCurrencyId,
            name: crypto?.name ?? s.cryptoCurrencyId,
            symbol: crypto?.symbol ?? '',
            exchangeCurrency: crypto?.exchangeCurrency ?? ''
          };
        });
    } catch (err) {
      console.error('Error loading watchlist', err);
      this.watchlistRows = [];
    }
  }

  async deleteWatchlistSubscription(row: { subscriptionId: string; cryptoCurrencyId: string }): Promise<void> {
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
      const user = await firstValueFrom(this.user$);
      if (!user?.uid) throw new Error('User not found');

      await this.watchlistSubscriptionsService.deleteById(row.subscriptionId);

      const existing = (user.preferences.watchlistSubscriptions ?? []) || [];
      const updated = existing.filter(s => s.id !== row.subscriptionId);
      await this.usersService.updateProfile(user.uid, {
        preferences: {
          ...user.preferences,
          watchlistSubscriptions: updated
        }
      });

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
    const action = user.isBanned ? 'Unban' : 'Ban';
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} user`,
        message: `${action} user ${user.userName} (${user.email})?`,
        confirmText: action,
        cancelText: 'Cancel'
      }
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      if (user.isBanned) {
        await this.usersService.unbanByUid(user.uid);
        this.notification.success('User unbanned');
      } else {
        await this.usersService.banByUid(user.uid);
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
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.uid) {
        try {
          await this.usersService.addCurrencyToBalance(currentUser.uid, this.addAmount);
          this.addAmount = 0; // Reset form
          this.notification.success('Currency added successfully!');
        } catch (error) {
          console.error('Error adding currency:', error);
          this.notification.error('Error adding currency. Please try again.');
        }
      }
    }
  }
}