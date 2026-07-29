export interface CryptoCardData {
  name: string;
  symbol: string;
  price: number;
  exchange: string;
  change24h?: number;
  lastUpdated?: number;
  high?: number;
  low?: number;
  volume?: number;
  // Add more fields as needed
}
