import { IsNotEmpty, IsString } from 'class-validator';

export class UnequipItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  slot: string; // "Arme", "Tête", "Corps", etc.
}