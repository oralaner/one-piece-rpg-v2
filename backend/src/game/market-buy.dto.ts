export class MarketBuyDto {
  userId: string;
  marketId: string; // <--- CORRECTION : string (UUID) au lieu de number
}