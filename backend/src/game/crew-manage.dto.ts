// 1. Pour rejoindre
export class JoinCrewDto {
  userId: string;
  crewId: string;
}

// 2. Pour accepter/refuser
export class RecruitDto {
  userId: string;        // ID du Capitaine (pour vérifier les droits)
  applicationId: string; // ID de la demande (dans la table demandes_adhesion)
  accept: boolean;       // true = accepter, false = refuser
}

// 3. Pour virer
export class KickDto {
  userId: string;   // ID du Capitaine
  targetId: string; // ID du membre à virer
}

// ... (tes autres classes Join, Recruit, Kick)

export class UpdateCrewDto {
  userId: string;
  nom: string;
  description: string;
}

export class OpenChestDto {
  userId: string;
  inventaireId: number;
}