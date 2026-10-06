import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MarketMoverMode, MarketMoverRow } from './market-movers.types';

const MOVER_LIMIT = 8;

@Component({
  selector: 'app-market-movers',
  imports: [DecimalPipe, RouterLink, MatButtonToggleModule],
  templateUrl: './market-movers.component.html',
  styleUrl: './market-movers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketMoversComponent {
  readonly rows = input.required<MarketMoverRow[]>();
  /** Shown when the list is empty (catalog empty vs waiting for tickers). */
  readonly emptyMessage = input('Waiting for live market data…');
  readonly mode = signal<MarketMoverMode>('gainers');

  readonly visibleRows = computed(() => {
    const mode = this.mode();
    const sorted = [...this.rows()];
    if (mode === 'gainers') {
      sorted.sort((a, b) => b.change24hPct - a.change24hPct);
    } else if (mode === 'losers') {
      sorted.sort((a, b) => a.change24hPct - b.change24hPct);
    } else {
      sorted.sort((a, b) => b.quoteVolume - a.quoteVolume);
    }
    return sorted.slice(0, MOVER_LIMIT);
  });

  setMode(mode: MarketMoverMode): void {
    this.mode.set(mode);
  }
}
