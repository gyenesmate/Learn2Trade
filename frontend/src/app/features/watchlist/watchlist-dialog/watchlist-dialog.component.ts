import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { CryptoCurrency } from '@core/models/models';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';
import { NotificationService } from '@core/services/notification.service';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { MarketTicker } from '@core/binance/binance.types';
import { toBinancePair } from '@core/binance/binance.utils';
import { BaseDialogComponent } from '@shared/components/base-dialog/base-dialog.component';
import {
  WatchlistDialogListState,
  WatchlistDialogRow,
} from './watchlist-dialog.types';

@Component({
  selector: 'app-watchlist-dialog',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BaseDialogComponent,
  ],
  templateUrl: './watchlist-dialog.component.html',
  styleUrl: './watchlist-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<WatchlistDialogComponent>);
  private readonly watchlist = inject(WatchlistSubscriptionsService);
  private readonly cryptoService = inject(CryptoCurrenciesService);
  private readonly marketData = inject(BinanceMarketDataService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly cryptos = signal<CryptoCurrency[]>([]);
  private readonly tickers = signal(new Map<string, MarketTicker>());
  private readonly loading = signal(true);
  private tickerSubs: Subscription[] = [];

  readonly listState = computed<WatchlistDialogListState>(() => {
    if (this.loading()) return 'loading';
    return this.rows().length === 0 ? 'empty' : 'ready';
  });

  readonly rows = computed<WatchlistDialogRow[]>(() => {
    const ids = this.watchlist.ids();
    const tickers = this.tickers();
    return this.cryptos()
      .filter((c) => ids.has(c.id))
      .map((crypto) => {
        const pair = toBinancePair(crypto.symbol, crypto.exchange_currency);
        const ticker = pair ? tickers.get(pair) : undefined;
        return {
          crypto,
          price: ticker?.price,
          change24hPct: ticker?.change24hPct,
        };
      });
  });

  constructor() {
    void this.bootstrap();
  }

  ngOnDestroy(): void {
    this.releaseTickers();
  }

  close(): void {
    this.dialogRef.close();
  }

  async remove(cryptoId: string): Promise<void> {
    try {
      await this.watchlist.deleteByCryptoCurrencyId(cryptoId);
      this.notification.info('Removed from watchlist');
      this.wireTickers();
    } catch {
      this.notification.error('Failed to remove from watchlist');
    }
  }

  view(cryptoId: string): void {
    this.dialogRef.close();
    void this.router.navigate(['/app/crypto', cryptoId]);
  }

  private async bootstrap(): Promise<void> {
    this.loading.set(true);
    try {
      await this.watchlist.refresh();
      const all = await this.cryptoService.getAll();
      this.cryptos.set(Array.isArray(all) ? all : []);
      this.wireTickers();
    } catch {
      this.cryptos.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private wireTickers(): void {
    this.releaseTickers();
    const ids = this.watchlist.ids();
    const watched = this.cryptos().filter((c) => ids.has(c.id));
    for (const crypto of watched) {
      const pair = toBinancePair(crypto.symbol, crypto.exchange_currency);
      if (!pair) continue;
      const sub = this.marketData.watchMiniTicker(pair).subscribe((ticker) => {
        const next = new Map(this.tickers());
        next.set(pair, ticker);
        this.tickers.set(next);
      });
      this.tickerSubs.push(sub);
    }
  }

  private releaseTickers(): void {
    for (const sub of this.tickerSubs) {
      sub.unsubscribe();
    }
    this.tickerSubs = [];
  }
}
