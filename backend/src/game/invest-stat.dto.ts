export class InvestStatDto {
  userId: string;
  stat: 'force' | 'defense' | 'intelligence' | 'vitalite' | 'agilite' | 'sagesse' | 'chance';
}