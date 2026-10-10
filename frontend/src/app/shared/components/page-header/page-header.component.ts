import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SIDEBAR_REACHABLE_ROUTES } from './page-header.const';
import { PageHeaderAction } from './page-header.types';
import { isSidebarReachablePath } from './page-header.utils';

@Component({
  selector: 'app-page-header',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly title = input.required<string>();
  readonly actions = input<PageHeaderAction[]>([]);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly showBack = computed(
    () => !isSidebarReachablePath(this.currentUrl(), SIDEBAR_REACHABLE_ROUTES)
  );

  goBack(): void {
    this.location.back();
  }
}
