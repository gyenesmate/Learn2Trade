import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumn } from '../../shared/data-table/data-table-utilities';
import { AnalyticsCardComponent } from '../../shared/analytics-card/analytics-card.component';
import { CryptoCurrency, Investment } from '../../../const/models';
import { AuthService } from '../../../services/auth.service';
import { InvestmentsService } from '../../../services/investments.service';
import { CryptoCurrenciesService } from '../../../services/crypto-currencies.service';
import { NotificationService } from '../../../services/notification.service';
import { isInvestmentSold } from '../../../core/investment.util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AnalyticsCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  portfolio: {
    totalValue: number;
    totalChange: number;
    totalInvested: number;
    totalPnL: number;
    bestPerformer: { name: string; change: number };
  } | null = null;

  holdings: Array<{
    name: string;
    symbol: string;
    icon?: string;
    amount: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    change: number;
  }> = [];

  holdingsColumns: TableColumn<any>[] = [
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'name', label: 'Asset', type: 'text' },
    { key: 'symbol', label: 'Symbol', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'avgPrice', label: 'Avg. Price', type: 'currency' },
    { key: 'currentPrice', label: 'Current Price', type: 'currency' },
    { key: 'pnl', label: 'P&L', type: 'currency' },
    { key: 'change', label: '% Change', type: 'number' },
  ];

  metrics: {
    sharpeRatio: number;
    volatility: number;
    maxDrawdown: number;
    winRate: number;
    avgReturn: number;
    riskReward: number;
  } | null = null;

  investments: Investment[] = [];
  isLoading = true;

  constructor(
    private auth: AuthService,
    private investmentsService: InvestmentsService,
    private cryptosService: CryptoCurrenciesService,
    private notification: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const user = await firstValueFrom(this.auth.currentUserData$);
      if (!user?.id) {
        this.isLoading = false;
        return;
      }

      const [investments, cryptos] = await Promise.all([
        this.investmentsService.getByUserId(),
        this.cryptosService.getAll()
      ]);

      this.investments = investments ?? [];

      const pricesByCryptoId = await this.fetchPricesByCryptoId(this.investments, cryptos ?? []);
      this.holdings = this.buildHoldings(this.investments, cryptos ?? [], pricesByCryptoId);
      this.portfolio = this.buildPortfolio(this.holdings);
      this.metrics = this.buildMetrics(this.investments);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      this.notification.error('Failed to load dashboard data');
    } finally {
      this.isLoading = false;
    }
  }

  private buildHoldings(
    investments: Investment[],
    cryptos: CryptoCurrency[],
    pricesByCryptoId: Map<string, number>
  ) {
    const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));
    const active = investments.filter(i => !isInvestmentSold(i));
    const grouped = new Map<string, { amount: number; invested: number }>();

    for (const inv of active) {
      const prev = grouped.get(inv.crypto_currency_id) ?? { amount: 0, invested: 0 };
      const amount = Number(inv.amount || 0);
      const invested = amount * Number(inv.buying_price || 0);
      grouped.set(inv.crypto_currency_id, {
        amount: prev.amount + amount,
        invested: prev.invested + invested
      });
    }

    return Array.from(grouped.entries()).map(([cryptoId, agg]) => {
      const crypto = cryptoById.get(cryptoId);
      const avgPrice = agg.amount > 0 ? agg.invested / agg.amount : 0;
      const livePrice = pricesByCryptoId.get(cryptoId);
      const currentPrice = Number.isFinite(livePrice as any) && (livePrice as number) > 0 ? (livePrice as number) : avgPrice;
      const pnl = (currentPrice - avgPrice) * agg.amount;
      const change = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

      return {
        name: crypto?.name ?? cryptoId,
        symbol: crypto?.symbol ?? '',
        icon: '',
        amount: Number(agg.amount.toFixed(6)),
        avgPrice: Number(avgPrice.toFixed(2)),
        currentPrice: Number(currentPrice.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        change: Number(change.toFixed(2))
      };
    });
  }

  private buildPortfolio(holdings: Array<{ amount: number; avgPrice: number; currentPrice: number; pnl: number; change: number; name: string }>) {
    const totalInvested = holdings.reduce((sum, h) => sum + h.amount * h.avgPrice, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.amount * h.currentPrice, 0);
    const totalPnL = totalValue - totalInvested;
    const totalChange = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const best = holdings.reduce(
      (prev, curr) => (curr.change > prev.change ? curr : prev),
      { name: holdings[0]?.name ?? 'N/A', change: holdings[0]?.change ?? 0 } as any
    );

    return {
      totalValue: Number(totalValue.toFixed(2)),
      totalChange: Number(totalChange.toFixed(2)),
      totalInvested: Number(totalInvested.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      bestPerformer: { name: best.name, change: Number(best.change.toFixed(2)) }
    };
  }

  private async fetchPricesByCryptoId(investments: Investment[], cryptos: CryptoCurrency[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const cryptoById = new Map(cryptos.map(c => [c.id, c] as const));

    const active = investments.filter(i => !isInvestmentSold(i));
    const ids = Array.from(new Set(active.map(i => i.crypto_currency_id)));
    if (!ids.length) return prices;

    await Promise.all(ids.map(async (id) => {
      const crypto = cryptoById.get(id);
      const pair = this.mapSymbolToBinancePair(crypto);
      if (!pair) return;
      const p = await this.fetchBinanceSpotPrice(pair);
      if (Number.isFinite(p) && p > 0) prices.set(id, p);
    }));

    return prices;
  }

  private mapSymbolToBinancePair(coin?: CryptoCurrency): string | null {
    if (!coin?.symbol) return null;
    const base = String(coin.symbol).trim().toLowerCase();
    if (!base) return null;

    const quoteRaw = String(coin.exchange_currency ?? '').trim().toLowerCase();
    const quote = quoteRaw === 'usd' ? 'usdt' : (quoteRaw || 'usdt');

    const safeBase = base.replace(/[^a-z0-9]/g, '');
    const safeQuote = quote.replace(/[^a-z0-9]/g, '');
    if (!safeBase || !safeQuote) return null;
    return `${safeBase}${safeQuote}`;
  }

  private async fetchBinanceSpotPrice(pair: string): Promise<number> {
    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(pair.toUpperCase())}`;
      const data = await fetch(url).then(r => r.json());
      const price = Number(data?.price);
      return Number.isFinite(price) ? price : NaN;
    } catch {
      return NaN;
    }
  }

  private buildMetrics(investments: Investment[]) {
    const sold = investments.filter(i => isInvestmentSold(i));
    const returns = sold.map(i => {
      const buy = Number(i.buying_price || 0);
      const sell = Number(i.selling_price || 0);
      if (buy <= 0 || !sell) return 0;
      return ((sell - buy) / buy) * 100;
    }).filter(r => Number.isFinite(r));

    const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const winRate = returns.length ? (returns.filter(r => r > 0).length / returns.length) * 100 : 0;

    return {
      sharpeRatio: Number((avgReturn / 100).toFixed(2)),
      volatility: Number(this.standardDeviation(returns).toFixed(2)),
      maxDrawdown: Number(Math.min(0, ...returns).toFixed(2)),
      winRate: Number(winRate.toFixed(2)),
      avgReturn: Number(avgReturn.toFixed(2)),
      riskReward: Number(this.riskReward(returns).toFixed(2))
    };
  }

  private standardDeviation(values: number[]): number {
    if (!values.length) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private riskReward(values: number[]): number {
    const gains = values.filter(v => v > 0);
    const losses = values.filter(v => v < 0);
    const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
    if (!avgLoss) return avgGain ? 1 : 0;
    return avgGain / avgLoss;
  }
}