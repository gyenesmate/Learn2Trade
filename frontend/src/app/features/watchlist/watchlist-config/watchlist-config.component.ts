import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

/**
 * Watchlist configuration placeholder.
 *
 * TODO: Group watchlist cryptocurrencies (lists / folders).
 * TODO: Per-asset alert rules (e.g. notify when price moves +2%).
 * TODO: Other watchlist preferences (sort, default view, notification channels).
 */
@Component({
  selector: 'app-watchlist-config',
  imports: [PageHeaderComponent],
  templateUrl: './watchlist-config.component.html',
  styleUrl: './watchlist-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistConfigComponent {
  readonly title = 'Watchlist configuration';
}
