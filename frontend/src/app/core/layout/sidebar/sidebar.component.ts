import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { WatchlistDialogComponent } from '@features/watchlist/watchlist-dialog/watchlist-dialog.component';
import { SidebarLink } from './sidebar-link.types';
import { isSidebarLinkVisible } from './sidebar-link.utils';
import { SIDEBAR_LINKS } from './sidebar.const';

@Component({
  selector: 'app-sidebar',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sidebar--collapsed]': 'collapsed()',
  },
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private watchlistDialogRef: MatDialogRef<WatchlistDialogComponent> | null = null;

  readonly collapsed = input(false);
  readonly navigated = output<void>();

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isAdmin = computed(() => this.authService.currentUser()?.is_admin === true);
  readonly currentRoute = signal('');

  readonly mainLinks = computed(() =>
    this.visibleLinks().filter((link) => (link.section ?? 'main') === 'main')
  );

  readonly adminLinks = computed(() =>
    this.visibleLinks().filter((link) => link.section === 'admin')
  );

  readonly footerLinks = computed(() =>
    this.visibleLinks().filter((link) => link.section === 'footer')
  );

  private readonly subscriptions: Subscription[] = [];

  private readonly visibleLinks = computed(() => {
    const loggedIn = this.isLoggedIn();
    const admin = this.isAdmin();
    return SIDEBAR_LINKS.filter((link) => isSidebarLinkVisible(link, loggedIn, admin));
  });

  ngOnInit(): void {
    this.currentRoute.set(this.router.url);
    this.subscriptions.push(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.currentRoute.set(event.urlAfterRedirects || event.url);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.watchlistDialogRef?.close();
    this.watchlistDialogRef = null;
  }

  isActive(link: SidebarLink): boolean {
    const route = link.route;
    if (!route) {
      return false;
    }
    const current = this.currentRoute();
    return current === route || current.startsWith(`${route}/`);
  }

  isDisabled(link: SidebarLink): boolean {
    if (link.disabled === true) {
      return true;
    }
    return link.visibility === 'admin' && !this.isAdmin();
  }

  navigateTo(link: SidebarLink): void {
    if (this.isDisabled(link)) {
      return;
    }
    if (link.id === 'watchlist') {
      this.toggleWatchlistDialog();
      this.navigated.emit();
      return;
    }
    if (!link.route) {
      return;
    }
    void this.router.navigate([link.route]);
    this.navigated.emit();
  }

  private toggleWatchlistDialog(): void {
    if (this.watchlistDialogRef) {
      this.watchlistDialogRef.close();
      this.watchlistDialogRef = null;
      return;
    }

    this.watchlistDialogRef = this.dialog.open(WatchlistDialogComponent, {
      width: '26rem',
      maxHeight: '85vh',
      autoFocus: 'dialog',
    });
    this.watchlistDialogRef.afterClosed().subscribe(() => {
      this.watchlistDialogRef = null;
    });
  }
}
