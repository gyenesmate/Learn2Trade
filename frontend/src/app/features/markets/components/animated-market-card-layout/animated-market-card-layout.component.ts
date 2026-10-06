import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
} from '@angular/core';
import { MarketTicker } from '@core/binance/binance.types';
import { toBinancePair } from '@core/binance/binance.utils';
import { CryptoCurrency } from '@core/models/models';
import { CryptoCardComponent } from '@shared/components/crypto-card/crypto-card.component';
import {
  MARKET_CARD_POSITIONS,
  MarketCardPosition,
  MarketCardSlot,
} from './animated-market-card-layout.types';

/**
 * Owns the five Markets card slots + compact↔featured swap.
 * Animation hooks can layer on later without touching crypto-card.
 */
@Component({
  selector: 'app-animated-market-card-layout',
  imports: [CryptoCardComponent],
  templateUrl: './animated-market-card-layout.component.html',
  styleUrl: './animated-market-card-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimatedMarketCardLayoutComponent {
  /** Up to five assets for the current page (order = featured first). */
  readonly assets = input.required<CryptoCurrency[]>();
  /** Live miniTickers owned by Markets (cards do not open their own watches). */
  readonly tickers = input<ReadonlyMap<string, MarketTicker>>(new Map());

  /** Slot map resets when the page asset set changes; writable for expand swaps. */
  readonly slots = linkedSignal<CryptoCurrency[], MarketCardSlot[]>({
    source: this.assets,
    computation: (assets) =>
      MARKET_CARD_POSITIONS.map((position, index) => ({
        position,
        assetId: assets[index]?.id ?? '',
      })),
  });

  readonly slotViews = computed(() => {
    const byId = new Map(this.assets().map((a) => [a.id, a]));
    const tickers = this.tickers();
    return this.slots()
      .map((slot) => {
        const asset = byId.get(slot.assetId);
        if (!asset) return null;
        const pair = toBinancePair(asset.symbol, asset.exchange_currency);
        return {
          position: slot.position,
          asset,
          ticker: pair ? (tickers.get(pair) ?? null) : null,
        };
      })
      .filter(
        (s): s is { position: MarketCardPosition; asset: CryptoCurrency; ticker: MarketTicker | null } =>
          !!s
      );
  });

  promote(asset: CryptoCurrency): void {
    const current = this.slots();
    const featured = current.find((s) => s.position === 'featured');
    const from = current.find((s) => s.assetId === asset.id);
    if (!featured || !from || from.position === 'featured') return;

    this.slots.set(
      current.map((slot) => {
        if (slot.position === 'featured') {
          return { ...slot, assetId: asset.id };
        }
        if (slot.position === from.position) {
          return { ...slot, assetId: featured.assetId };
        }
        return slot;
      })
    );
  }
}
