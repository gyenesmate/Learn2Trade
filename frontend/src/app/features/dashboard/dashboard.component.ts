import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PageHeaderAction } from '@shared/components/page-header/page-header.types';
import { AnalyticsCardComponent } from '@features/dashboard/components/analytics-card/analytics-card.component';
import { CryptoCurrency, Investment } from '@core/models/models';
import { AuthService } from '@core/services/auth.service';
import { InvestmentsService } from '@core/services/investments.service';
import { CryptoCurrenciesService } from '@core/services/crypto-currencies.service';
import { NotificationService } from '@core/services/notification.service';
import { BinanceRestService } from '@core/binance/binance-rest.service';
import { toBinancePair } from '@core/binance/binance.utils';
import { isInvestmentSold } from '@core/utils/investment.util';
import {
  DASHBOARD_HEADER_ACTIONS,
  DASHBOARD_HOLDINGS_COLUMNS,
  DASHBOARD_PAGE_TITLE,
  DashboardHoldingRow,
} from './dashboard.const';

@Component({
  selector: 'app-dashboard',
  imports: [
    AnalyticsCardComponent,
    PageHeaderComponent,
    DataTableComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly investmentsService = inject(InvestmentsService);
  private readonly cryptosService = inject(CryptoCurrenciesService);
  private readonly notification = inject(NotificationService);
  private readonly binanceRest = inject(BinanceRestService);
  private readonly router = inject(Router);

  readonly pageTitle = DASHBOARD_PAGE_TITLE;
  readonly holdingsColumns = DASHBOARD_HOLDINGS_COLUMNS;
  readonly headerActions: PageHeaderAction[] = [
    {
      ...DASHBOARD_HEADER_ACTIONS.browseMarkets,
      callback: () => void this.router.navigate(['/app/markets']),
    },
  ];

  readonly portfolio = signal<{
    totalValue: number;
    totalChange: number;
    totalInvested: number;
    totalPnL: number;
    bestPerformer: { name: string; change: number };
  } | null>(null);

  readonly holdings = signal<DashboardHoldingRow[]>([]);
  readonly investments = signal<Investment[]>([]);
  readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      if (!user?.id) {
        this.isLoading.set(false);
        return;
      }

      const [investments, cryptos] = await Promise.all([
        this.investmentsService.getByUserId(),
        this.cryptosService.getAll(),
      ]);

      this.investments.set(investments ?? []);

      const pricesByCryptoId = await this.fetchPricesByCryptoId(
        this.investments(),
        cryptos ?? []
      );
      const nextHoldings = this.buildHoldings(
        this.investments(),
        cryptos ?? [],
        pricesByCryptoId
      );
      this.holdings.set(nextHoldings);
      this.portfolio.set(
        nextHoldings.length ? this.buildPortfolio(nextHoldings) : null
      );
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      this.notification.error('Failed to load dashboard data');
    } finally {
      this.isLoading.set(false);
    }
  }

  private buildHoldings(
    investments: Investment[],
    cryptos: CryptoCurrency[],
    pricesByCryptoId: Map<string, number>
  ): DashboardHoldingRow[] {
    const cryptoById = new Map(cryptos.map((c) => [c.id, c] as const));
    const active = investments.filter((i) => !isInvestmentSold(i));
    const grouped = new Map<string, { amount: number; invested: number }>();

    for (const inv of active) {
      const prev = grouped.get(inv.crypto_currency_id) ?? { amount: 0, invested: 0 };
      const amount = Number(inv.amount || 0);
      const invested = amount * Number(inv.buying_price || 0);
      grouped.set(inv.crypto_currency_id, {
        amount: prev.amount + amount,
        invested: prev.invested + invested,
      });
    }

    return Array.from(grouped.entries()).map(([cryptoId, agg]) => {
      const crypto = cryptoById.get(cryptoId);
      const avgPrice = agg.amount > 0 ? agg.invested / agg.amount : 0;
      const livePrice = pricesByCryptoId.get(cryptoId);
      const currentPrice =
        Number.isFinite(livePrice) && (livePrice as number) > 0
          ? (livePrice as number)
          : avgPrice;
      const pnl = (currentPrice - avgPrice) * agg.amount;
      const change = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

      return {
        id: cryptoId,
        name: crypto?.name ?? cryptoId,
        symbol: crypto?.symbol ?? '',
        amount: Number(agg.amount.toFixed(6)),
        avgPrice: Number(avgPrice.toFixed(2)),
        currentPrice: Number(currentPrice.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        change: Number(change.toFixed(2)),
      };
    });
  }

  private buildPortfolio(holdings: DashboardHoldingRow[]) {
    const totalInvested = holdings.reduce((sum, h) => sum + h.amount * h.avgPrice, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.amount * h.currentPrice, 0);
    const totalPnL = totalValue - totalInvested;
    const totalChange = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const best = holdings.reduce(
      (prev, curr) => (curr.change > prev.change ? curr : prev),
      holdings[0]
    );

    return {
      totalValue: Number(totalValue.toFixed(2)),
      totalChange: Number(totalChange.toFixed(2)),
      totalInvested: Number(totalInvested.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      bestPerformer: {
        name: best?.name ?? 'N/A',
        change: Number((best?.change ?? 0).toFixed(2)),
      },
    };
  }

  private async fetchPricesByCryptoId(
    investments: Investment[],
    cryptos: CryptoCurrency[]
  ): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const cryptoById = new Map(cryptos.map((c) => [c.id, c] as const));

    const active = investments.filter((i) => !isInvestmentSold(i));
    const ids = Array.from(new Set(active.map((i) => i.crypto_currency_id)));
    if (!ids.length) return prices;

    await Promise.all(
      ids.map(async (id) => {
        const crypto = cryptoById.get(id);
        const pair = toBinancePair(crypto?.symbol, crypto?.exchange_currency);
        if (!pair) return;
        const p = await this.binanceRest.getTickerPrice(pair);
        if (Number.isFinite(p) && p > 0) prices.set(id, p);
      })
    );

    return prices;
  }
}
