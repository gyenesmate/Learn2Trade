import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

/** Persistent shell for main application routes. */
@Component({
  selector: 'app-base-layout',
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayoutComponent implements OnInit, OnDestroy {
  readonly isMobile = signal(false);
  /** Expanded shows labels; collapsed keeps an icon rail visible. */
  readonly sidebarExpanded = signal(true);

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
      this.sidebarExpanded.set(false);
    }
  }

  toggleSidenav(): void {
    this.sidebarExpanded.update((expanded) => !expanded);
  }

  onSidebarNavigated(): void {
    if (this.isMobile()) {
      this.sidebarExpanded.set(false);
    }
  }
}
