export class MarketSellDto {
  userId: string;
  inventaireId: number; // L'ID de l'objet dans ton sac
  prix: number;         // Le prix que tu fixes
  quantite: number;
}