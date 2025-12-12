export class PlayCasinoDto {
  userId: string;
  jeu: 'DES' | 'PFC' | 'QUITTE';
  mise: number;
  choix?: string; // Pour PFC ('PIERRE'...) ou Quitte ('LANCER', 'STOP')
}