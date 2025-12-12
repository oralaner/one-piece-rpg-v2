import { IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class SellItemDto {
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  inventaireId: number;

  // 👇 AJOUT INDISPENSABLE
  @IsNumber()
  @IsPositive()
  @IsOptional() // Optionnel pour la rétrocompatibilité (par défaut 1)
  quantite?: number;
}