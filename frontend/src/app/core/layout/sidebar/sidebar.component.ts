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
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { SidebarLink } from './sidebar-link.model';

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

  readonly collapsed = input(false);
  readonly navigated = output<void>();

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isAdmin = computed(() => this.authService.currentUser()?.is_admin === true);
  readonly currentRoute = signal('');

  /** Site definitions — add/remove entries here to change navigation. */
  private readonly links: readonly SidebarLink[] = [
    {
      id: 'dashboard',
      route: '/dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      visibility: 'authenticated',
      section: 'main',
    },
    {
      id: 'markets',
      route: '/home',
      label: 'Markets',
      icon: 'home',
      visibility: 'always',
      section: 'main',
    },
    {
      id: 'portfolio',
      route: '/profile',
      label: 'Portfolio',
      icon: 'account_balance_wallet',
      visibility: 'authenticated',
      section: 'main',
    },
    {
      id: 'admin-users',
      label: 'Users',
      icon: 'group',
      visibility: 'admin',
      section: 'admin',
    },
    {
      id: 'admin-crypto',
      label: 'Crypto admin',
      icon: 'currency_bitcoin',
      visibility: 'admin',
      section: 'admin',
    },
    {
      id: 'admin-settings',
      label: 'Admin settings',
      icon: 'admin_panel_settings',
      visibility: 'admin',
      section: 'admin',
    },
    {
      id: 'login',
      route: '/login',
      label: 'Login',
      icon: 'login',
      visibility: 'anonymous',
      section: 'footer',
    },
    {
      id: 'register',
      route: '/register',
      label: 'Register',
      icon: 'person_add',
      visibility: 'anonymous',
      section: 'footer',
    },
  ];

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
    return this.links.filter((link) => this.isLinkVisible(link, loggedIn, admin));
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
    // Admin entries are never shown to non-admins; keep enabled when visible.
    return link.visibility === 'admin' && !this.isAdmin();
  }

  navigateTo(link: SidebarLink): void {
    if (this.isDisabled(link) || !link.route) {
      return;
    }
    void this.router.navigate([link.route]);
    this.navigated.emit();
  }

  private isLinkVisible(link: SidebarLink, loggedIn: boolean, admin: boolean): boolean {
    switch (link.visibility) {
      case 'always':
        return true;
      case 'authenticated':
        return loggedIn;
      case 'anonymous':
        return !loggedIn;
      case 'admin':
        return admin;
      default:
        return true;
    }
  }
}
