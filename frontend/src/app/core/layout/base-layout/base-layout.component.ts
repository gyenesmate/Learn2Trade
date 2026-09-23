import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { FiredAlertsWidgetComponent } from '@shared/components/fired-alerts-widget/fired-alerts-widget.component';

/**
 * Persistent shell for main application routes.
 *
 * Hosts {@link FiredAlertsWidgetComponent} as layout-level UI infrastructure.
 * TODO: Replace FiredAlertsWidgetComponent with a Material-based popup
 * (e.g. MatSnackBar / dialog) instead of the custom floating widget.
 */
@Component({
  selector: 'app-base-layout',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    SidebarComponent,
    NavbarComponent,
    FiredAlertsWidgetComponent,
  ],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayoutComponent implements OnInit, OnDestroy {
  readonly isMobile = signal(false);
  readonly sidenavOpen = signal(true);

  private readonly onResize = () => this.checkScreenSize();

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
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

  onSidebarNavigated(): void {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }
}
