export type MarketCardPosition =
  | 'featured'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface MarketCardSlot {
  position: MarketCardPosition;
  assetId: string;
}

export const MARKET_CARD_POSITIONS: readonly MarketCardPosition[] = [
  'featured',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;
