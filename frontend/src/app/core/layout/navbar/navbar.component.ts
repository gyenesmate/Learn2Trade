import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  DOCUMENT,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly document = inject<Document>(DOCUMENT);

  readonly isMobile = input(false);
  readonly menuToggle = output<void>();

  readonly user = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly currentRoute = signal('');
  readonly theme = signal<'light' | 'dark'>('dark');
  readonly isDark = computed(() => this.theme() === 'dark');

  private readonly subscriptions: Subscription[] = [];

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
    if (
      !this.document.body.classList.contains('theme-light') &&
      !this.document.body.classList.contains('theme-dark')
    ) {
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
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = this.document.body;
    const root = this.document.documentElement;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    root.setAttribute('data-theme', theme);
  }

  isActive(path: string): boolean {
    const route = this.currentRoute();
    return route === path || route.startsWith(`${path}/`);
  }

  navigateTo(route: string): void {
    void this.router.navigate([route]);
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
