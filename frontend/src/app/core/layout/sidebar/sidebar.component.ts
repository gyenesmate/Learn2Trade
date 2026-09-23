import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [MatSidenavModule, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly navigated = output<void>();

  readonly user = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly currentRoute = signal('');

  private readonly subscriptions: Subscription[] = [];

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

  isActive(path: string): boolean {
    const route = this.currentRoute();
    return route === path || route.startsWith(`${path}/`);
  }

  navigateTo(route: string): void {
    void this.router.navigate([route]);
    this.navigated.emit();
  }
}
