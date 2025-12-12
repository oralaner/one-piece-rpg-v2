import { IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class BuyItemDto {
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  objetId: number;

  // 👇 AJOUT INDISPENSABLE POUR LA QUANTITÉ
  @IsNumber()
  @IsPositive()
  @IsOptional() // Optionnel (par défaut 1) pour ne pas casser les anciens appels
  amount?: number;
}