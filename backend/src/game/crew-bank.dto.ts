export class CrewBankDto {
  userId: string;
  montant: number;
  action: 'DEPOSER' | 'RETIRER';
}