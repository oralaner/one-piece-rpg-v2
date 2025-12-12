import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EquipItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  inventaireId: number;
}