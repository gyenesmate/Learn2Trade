import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
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
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

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
  ],
  templateUrl: './navigation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly document = inject<Document>(DOCUMENT);

  readonly user = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  readonly isMobile = signal(false);
  readonly currentRoute = signal('');

  private readonly subscriptions: Subscription[] = [];
  private readonly onResize = () => this.checkScreenSize();

  constructor() {
    effect(() => {
      const user = this.user();
      if (user === undefined) return;
      this.applyTheme(user?.theme || 'light');
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.onResize);

    this.subscriptions.push(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.currentRoute.set(event.url);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    window.removeEventListener('resize', this.onResize);
  }

  private applyTheme(theme: string): void {
    const body = this.document.body;
    body.classList.remove('theme-light', 'theme-dark');
    if (theme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-light');
    }
  }

  checkScreenSize(): void {
    this.isMobile.set(window.innerWidth <= 768);
  }

  navigateTo(route: string): void {
    void this.router.navigate([route]);
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
