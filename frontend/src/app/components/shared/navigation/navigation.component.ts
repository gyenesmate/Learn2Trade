import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { UserMe } from '../../../const/models';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy {
  user$!: Observable<UserMe | null | undefined>;
  isLoggedIn$!: Observable<boolean>;

  isMobile = false;
  currentRoute = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.user$ = this.authService.currentUserData$;
    this.isLoggedIn$ = this.user$.pipe(map((user) => !!user));
  }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      })
    );

    this.subscriptions.push(
      this.user$.subscribe(user => {
        const theme = user?.theme || 'light';
        this.applyTheme(theme);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  private applyTheme(theme: string) {
    const body = this.document.body;
    body.classList.remove('theme-light', 'theme-dark');
    if (theme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-light');
    }
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
