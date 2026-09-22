import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  DOCUMENT,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { UsersService } from '@services/users.service';

@Component({
  selector: 'app-navigation',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './navigation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly document = inject<Document>(DOCUMENT);

  readonly user = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  readonly isMobile = signal(false);
  readonly sidenavOpen = signal(true);
  readonly currentRoute = signal('');
  readonly theme = signal<'light' | 'dark'>('dark');

  readonly isDark = computed(() => this.theme() === 'dark');

  private readonly subscriptions: Subscription[] = [];
  private readonly onResize = () => this.checkScreenSize();

  constructor() {
    effect(() => {
      const user = this.user();
      if (user === undefined) return;
      const next = (user?.theme === 'light' ? 'light' : 'dark') as 'light' | 'dark';
      this.theme.set(next);
      this.applyTheme(next);
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.onResize);

    if (!this.document.body.classList.contains('theme-light') &&
        !this.document.body.classList.contains('theme-dark')) {
      this.applyTheme('dark');
    }

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
    window.removeEventListener('resize', this.onResize);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = this.document.body;
    const root = this.document.documentElement;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    root.setAttribute('data-theme', theme);
  }

  checkScreenSize(): void {
    const mobile = window.innerWidth <= 768;
    this.isMobile.set(mobile);
    if (mobile) {
      this.sidenavOpen.set(false);
    } else if (!this.sidenavOpen()) {
      this.sidenavOpen.set(true);
    }
  }

  toggleSidenav(): void {
    this.sidenavOpen.update((open) => !open);
  }

  isActive(path: string): boolean {
    const route = this.currentRoute();
    return route === path || route.startsWith(`${path}/`);
  }

  navigateTo(route: string): void {
    void this.router.navigate([route]);
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  async toggleTheme(): Promise<void> {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);

    const user = this.user();
    if (user && this.isLoggedIn()) {
      try {
        await this.usersService.updateProfile({ theme: next });
      } catch {
        // Theme still applied locally if persist fails.
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      void this.router.navigate(['/home']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
