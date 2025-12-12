import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoryService {
  constructor(private prisma: PrismaService) {}

  private formatFaction(faction: string): string {
      return faction
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase();
  }
// Rappel de la fonction helper (à mettre à la fin de la classe StoryService)
  private async giveQuestItem(userId: string, itemName: string, quantity: number) {
    const item = await this.prisma.objets.findFirst({ where: { nom: itemName } });
    
    if (item) {
        // On vérifie si le joueur l'a déjà pour éviter les doublons d'équipements uniques
        const existing = await this.prisma.inventaire.findFirst({ 
            where: { joueur_id: userId, objet_id: item.id } 
        });

        // Si c'est un équipement (BAGUE/ANNEAU) et qu'on l'a déjà, on ne redonne pas
        const type = item.type_equipement || "";
        const isEquip = ["BAGUE", "ANNEAU", "ACCESSOIRE_1", "ACCESSOIRE_2"].includes(type) || item.categorie === "Équipement";
        
        if (existing && isEquip) return;

        if (existing) {
            await this.prisma.inventaire.update({
                where: { id: existing.id },
                data: { quantite: { increment: quantity } }
            });
        } else {
            await this.prisma.inventaire.create({
                data: { 
                    joueur_id: userId, 
                    objet_id: item.id, 
                    quantite: quantity, 
                    est_equipe: false 
                }
            });
        }
    } else {
        console.error(`[ERREUR] Objet de quête introuvable : ${itemName}`);
    }
  }
  // 1. RÉCUPÉRER L'ÉTAPE EN COURS
  async getCurrentProgress(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur) throw new BadRequestException("Joueur introuvable");

    const faction = this.formatFaction(joueur.faction || 'PIRATE');
    
    const chapitre = await this.prisma.histoire_chapitres.findFirst({
        where: { faction: faction, numero: joueur.chapitre_actuel },
        include: { etapes: { orderBy: { ordre: 'asc' } } }
    });

    if (!chapitre) {
        console.warn(`[STORY] Chapitre introuvable pour ${faction} (Num: ${joueur.chapitre_actuel})`);
        return { completed: true, message: "Aventure à suivre..." };
    }

    const etape = chapitre.etapes.find(e => e.ordre === joueur.etape_actuelle);

    if (!etape) {
        return { chapterFinished: true, chapitre };
    }

    return {
        chapitreTitre: chapitre.titre,
        chapitreDesc: chapitre.description,
        etape: etape,
        totalEtapes: chapitre.etapes.length
    };
  }

  // 2. VALIDER L'ÉTAPE ACTUELLE
  async validateStep(userId: string) {
    const progress: any = await this.getCurrentProgress(userId);
    if (progress.completed || progress.chapterFinished) throw new BadRequestException("Chapitre déjà terminé.");

    const { etape, totalEtapes } = progress;
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: userId }, 
        include: { inventaire: { include: { objets: true } } } 
    });
    if (!joueur) throw new BadRequestException("Joueur introuvable.");

    // =========================================================
    // 🌍 GESTION DU VOYAGE (SIMPLIFIÉE - TÉLÉPORTATION)
    // =========================================================
    if (etape.type === 'VOYAGE') {
        const nomIleCible = etape.target_nom;
        const ile = await this.prisma.destinations.findFirst({ where: { nom: nomIleCible } });
        
        if (ile) {
            // Au lieu de bloquer, on met à jour la position du joueur automatiquement
            await this.prisma.joueurs.update({
                where: { id: userId },
                data: { localisation_id: ile.id }
            });
            // Et on valide l'étape juste après (le return à la fin de la fonction)
        } else {
            console.warn(`[STORY] Île cible '${nomIleCible}' introuvable en BDD.`);
            // On laisse passer quand même pour ne pas bloquer le joueur sur un bug de seed
        }
    }

    // =========================================================
    // 🔒 VÉRIFICATIONS STRICTES (CHAPITRE 1 - TUTO)
    // =========================================================
    if (joueur.chapitre_actuel === 1) {
        if (etape.ordre === 3 && (joueur.points_carac ?? 0) >= 5) {
            throw new BadRequestException("Tu n'as pas distribué tes points ! Va dans l'onglet STATS.");
        }
        if (etape.ordre === 5) {
            const nomArme = "Pistolet basique";
            const arme = joueur.inventaire.find(i => i.objets.nom === nomArme);
            if (!arme) throw new BadRequestException(`Tu as perdu ton ${nomArme} ?!`);
            if (!arme.est_equipe) throw new BadRequestException(`Tu dois aller dans ton SAC et cliquer sur "Équiper" sur ton ${nomArme} !`);
        }
        if (etape.ordre === 7) {
            const deck = (joueur.deck_combat as number[]) || [];
            if (deck.length === 0) throw new BadRequestException("Ton deck est vide ! Va dans SKILLS, achète une attaque et équipe-la.");
        }
        if (etape.ordre === 6) await this.prisma.joueurs.update({ where: { id: userId }, data: { berrys: { increment: 1000 } } });
        if (etape.ordre === 9) {
             const pain = await this.prisma.objets.findFirst({ where: { nom: "Pain de campagne" } });
             if (pain) {
                 const existingStack = await this.prisma.inventaire.findFirst({ where: { joueur_id: userId, objet_id: pain.id } });
                 
                 // 👇 CORRECTION : On ne donne rien si le joueur en a déjà (évite le x2)
                 if (!existingStack) {
                     await this.prisma.inventaire.create({ 
                         data: { joueur_id: userId, objet_id: pain.id, quantite: 1, est_equipe: false } 
                     });}
             }
        }
    }

    // =========================================================
    // 🎁 CHAPITRE 2 (POTION)
    // =========================================================
    if (joueur.chapitre_actuel === 2) {
        if (etape.ordre === 3) {
            await this.prisma.joueurs.update({ where: { id: userId }, data: { berrys: { increment: 50000 } } });
        }
        if (etape.ordre === 5) {
            const pvActuel = joueur.pv_actuel ?? 0;
            const pvMax = joueur.pv_max_base ?? 100;
            
            // Si le joueur n'a pas utilisé la potion (pv bas), on bloque
            if (pvActuel < pvMax * 0.2) {
                throw new BadRequestException("Tu es encore trop blessé ! Bois ta potion (Inventaire -> Consommer).");
            }
        }
    }
    
    // =========================================================
    // 1. GESTION DES ITEMS
    // =========================================================
    if (etape.type === 'LIVRAISON' && etape.target_nom) {
        const itemNom = etape.target_nom;
        const itemObj = await this.prisma.objets.findUnique({ where: { nom: itemNom } });
        
        if (itemObj) {
            const hasItem = joueur.inventaire.some(i => i.objet_id === itemObj.id);
            if (!hasItem && itemNom !== 'Potion mineure') {
                await this.prisma.inventaire.create({ data: { joueur_id: userId, objet_id: itemObj.id, quantite: 1, est_equipe: false } });
            } else if (!hasItem && itemNom === 'Potion mineure') {
                throw new BadRequestException("Tu n'as pas la Potion ! Va l'acheter au Shop.");
            }
        }
    }

    // =========================================================
    // 2. GESTION DU COMBAT (Vérification Victoire RÉCENTE)
    // =========================================================
    if (etape.type === 'COMBAT_PVE') {
        const botName = etape.target_nom;
        const bot = await this.prisma.joueurs.findFirst({ where: { pseudo: botName, is_bot: true } });
        
        if (!bot) {
            console.warn(`[STORY] Bot ${botName} introuvable !`);
        } else {
            // 🕒 CRITÈRE DE TEMPS : La victoire doit dater de moins de 10 minutes
            // Cela évite de valider avec un vieux combat d'il y a 3 jours.
            const timeLimit = new Date(Date.now() - 10 * 60 * 1000); 

            const lastWin = await this.prisma.combats.findFirst({
                where: {
                    joueur_id: userId,
                    adversaire_id: bot.id,
                    est_termine: true,
                    vainqueur_id: userId,
                    // 👇 AJOUT CRUCIAL : On vérifie la date !
                    // (Assure-toi que ton modèle Combats a bien 'created_at' ou 'date_combat')
                    created_at: { gte: timeLimit } 
                },
                orderBy: { id: 'desc' }
            });

            if (!lastWin) {
                // Message d'erreur clair pour déclencher le combat côté Frontend
                throw new BadRequestException("Tu dois vaincre l'ennemi maintenant ! (Aucune victoire récente trouvée)");
            }
        }
    }
// =========================================================
    // ⚔️ LOGIQUE CHAPITRE 3 (HDV, Casino, Arène)
    // =========================================================
    if (joueur.chapitre_actuel === 3) {
        
        // ÉTAPE 3 : HDV (ACTION)
        if (etape.ordre === 3 && etape.type === 'ACTION') {
            // Clics simples, pas de vérification complexe pour l'HDV.
        }

        // ÉTAPE 4 : Casino (ACTION)
        if (etape.ordre === 4 && etape.type === 'ACTION') {
             // Pour vérifier le Casino, le plus simple est de vérifier
             // si le joueur a un cooldown de jeu récent (si vous l'avez implémenté)
             // Pour l'instant, on laisse passer au clic simple.
        }

        // ÉTAPE 5 : Arène (ACTION)
        if (etape.ordre === 5 && etape.type === 'ACTION') {
            // Le joueur DOIT avoir fait un combat PVP (ou PVE si non filtré)
            // On vérifie une victoire récente (PVP)
            const timeLimit = new Date(Date.now() - 10 * 60 * 1000); 
            const recentCombat = await this.prisma.combats.findFirst({
                where: {
                    joueur_id: userId,
                    est_termine: true,
                    vainqueur_id: userId,
                    // On peut cibler seulement les PVP si votre système les différencie
                    // is_pvp: true, 
                    created_at: { gte: timeLimit } 
                },
                orderBy: { created_at: 'desc' }
            });

            if (!recentCombat) {
                // Le message guide le joueur
                throw new BadRequestException("Tu dois lancer un duel dans l'onglet ARÈNE (PVP) !");
            }
        }
        
        // ÉTAPE 6 : Action répétitive (Motiver Marines / Voler Cartes / Distribuer Tracts)
        if (etape.ordre === 6 && etape.type === 'ACTION' && etape.quantite > 1) {
            // La vérification se fait côté Frontend (clickCount), ici on laisse passer la validation.
        }

        // ÉTAPE 7 : Combat PVE (La vérification est gérée par le bloc général PVE plus bas)
    }

    // =========================================================
    // 🔨 LOGIQUE CHAPITRE 4 (CRAFT & UTILISATION D'OBJET)
    // =========================================================
    if (joueur.chapitre_actuel === 4) {
        
        // ÉTAPE 3 : Récolte (Chanvre) + Don des Outils
        if (etape.ordre === 3 && etape.type === 'ACTION') {
            const chanvreObj = await this.prisma.objets.findFirst({ where: { nom: 'Chanvre' } });
            // Sécurité
            if (!chanvreObj) throw new BadRequestException("Objet Chanvre introuvable en BDD !");

            const inventaireChanvre = joueur.inventaire.find(i => i.objets.nom === 'Chanvre');
            const quantiteActuelle = inventaireChanvre?.quantite ?? 0;

            // 1. GESTION CHANVRE (Comme avant : on donne si manque)
            if (quantiteActuelle < etape.quantite) {
                const manque = etape.quantite - quantiteActuelle;
                if (inventaireChanvre) {
                    await this.prisma.inventaire.update({ where: { id: inventaireChanvre.id }, data: { quantite: { increment: manque } } });
                } else {
                    await this.prisma.inventaire.create({ data: { joueur_id: userId, objet_id: chanvreObj.id, quantite: manque, est_equipe: false } });
                }
            }

            // 👇 2. AJOUT : DON DES OUTILS (Indispensable pour l'étape 4)
            // On vérifie si le joueur a déjà des outils, sinon on lui donne.
            const outilsObj = await this.prisma.objets.findFirst({ where: { nom: 'Outils' } });
            
            if (outilsObj) {
                const aOutils = joueur.inventaire.some(i => i.objet_id === outilsObj.id);
                if (!aOutils) {
                    await this.prisma.inventaire.create({
                        data: {
                            joueur_id: userId,
                            objet_id: outilsObj.id,
                            quantite: 1,
                            est_equipe: false
                        }
                    });
                    // Petit log serveur pour confirmer
                    console.log(`[STORY] Outils donnés à ${joueur.pseudo} pour le craft.`);
                }
            }
        }

        // ÉTAPE 5 : Utilisation de l'objet (Vérification de la consommation)
        if (etape.ordre === 5 && etape.type === 'ACTION') {
            const itemNom = etape.target_nom; // "Utiliser la Corde"
            
            // On vérifie que le joueur a L'OBJET (la Corde)
            const cordeInventaire = joueur.inventaire.find(i => i.objets.nom.includes('Corde'));
            
            if (cordeInventaire) {
                // Pour "utiliser", on va consommer l'objet pour simuler l'action.
                if ((cordeInventaire.quantite ?? 0) >= 1) {
                    await this.prisma.inventaire.update({
                        where: { id: cordeInventaire.id },
                        data: { quantite: { decrement: 1 } }
                    });
                }
            } else {
                 throw new BadRequestException("Tu n'as pas la Corde ! Tu dois la crafter et l'avoir sur toi.");
            }
        }

        // ÉTAPE 6 : Récompense Finale (50k Berrys + Anneau Faction)
    if (etape.ordre === 6 && etape.type === 'DIALOGUE') {
        
        // 1. Donner 50 000 Berrys
        await this.prisma.joueurs.update({
            where: { id: userId },
            data: { berrys: { increment: 50000 } }
        });

        // 2. Donner l'Anneau selon la Faction
        let anneauNom = "";
        
        // On normalise la faction pour être sûr (ex: "MARINE" ou "Marine")
        const faction = (joueur.faction || "").toUpperCase();

        if (faction === 'MARINE') {
            anneauNom = "Anneau du Marine";
        } else if (faction === 'PIRATE') {
            anneauNom = "Anneau du Pirate";
        } else if (faction === 'REVOLUTIONNAIRE' || faction === 'RÉVOLUTIONNAIRE') {
            anneauNom = "Anneau du Révolutionnaire";
        }

        if (anneauNom) {
            await this.giveQuestItem(userId, anneauNom, 1);
            console.log(`[STORY] Récompense Chap 4 : ${anneauNom} donné à ${joueur.pseudo}`);
        } else {
            console.warn(`[STORY] Faction inconnue pour récompense anneau : ${faction}`);
        }
    }
    }
    // =========================================================
    // PASSAGE SUIVANT
    // =========================================================
    let nextEtape = joueur.etape_actuelle + 1;
    let nextChapitre = joueur.chapitre_actuel;
    let chapterJustFinished = false;

    if (nextEtape > totalEtapes) {
        nextEtape = 1;
        nextChapitre++;
        chapterJustFinished = true;
    }

    const updateData: any = { etape_actuelle: nextEtape, chapitre_actuel: nextChapitre };

    if (chapterJustFinished) {
        const faction = this.formatFaction(joueur.faction || 'PIRATE');
        const chapitre = await this.prisma.histoire_chapitres.findFirst({
            where: { faction: faction, numero: joueur.chapitre_actuel }
        });

        if (chapitre) {
            // On ajoute les Berrys (Via increment, ça c'est sûr)
            updateData.berrys = { increment: chapitre.recompense_berrys };

            // 🧮 CALCUL DU LEVEL UP
            let currentXp = (joueur.xp ?? 0) + chapitre.recompense_xp;
            let currentLevel = joueur.niveau ?? 1;
            const originalLevel = currentLevel;
            
            // On récupère les points actuels (0 si null)
            let currentPoints = joueur.points_carac ?? 0; 

            // Formule XP : Niveau * 100
            let xpMax = currentLevel * 100; 

            // Tant qu'on a assez d'XP pour monter de niveau
            while (currentXp >= xpMax) {
                currentXp -= xpMax;      // On retire le coût
                currentLevel++;          // On monte de niveau
                currentPoints += 5;      // ✅ ON AJOUTE DIRECTEMENT AUX POINTS TOTAUX
                
                xpMax = currentLevel * 100; // Prochain palier
            }

            // Application des valeurs FINALES (Pas d'increment, on force la valeur)
            updateData.xp = currentXp;
            updateData.niveau = currentLevel;
            
            // On met à jour les points seulement si on a monté de niveau
            if (currentLevel > originalLevel) {
                updateData.points_carac = currentPoints; // Valeur cumulée (fix précédent)
                
                // 👇 CORRECTION SOIN COMPLET (Level Up)
                // On recalcule le Max théorique pour être sûr : Base 100 + (Vitalité * 5)
                const vit = Number(joueur.vitalite ?? 0);
                const pvMaxTheorique = 100 + (vit * 5); 
                
                // Si pv_max_base en BDD est plus grand (grâce aux items/bonus), on le prend, sinon on prend le calcul
                const pvMaxFinal = Math.max(Number(joueur.pv_max_base ?? 100), pvMaxTheorique);

                updateData.pv_actuel = pvMaxFinal; 
                updateData.energie_actuelle = 10;
            }
        }
    }

    // Mise à jour finale en base de données
    await this.prisma.joueurs.update({ where: { id: userId }, data: updateData });

    // On retourne le nouveau niveau pour le pop-up
    const newLevel = updateData.niveau && updateData.niveau > (joueur.niveau ?? 1) ? updateData.niveau : null;
    return { 
        success: true, 
        message: etape.type === 'LIVRAISON' ? `Objet validé !` : "Étape validée !", 
        chapterFinished: chapterJustFinished,
        newLevel: newLevel // Le frontend l'utilisera pour le pop-up
    };
  }

  async getDestinationsWithStatus(userId: string) {
      // (Reste inchangé, sert pour l'onglet Expédition)
      const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
      if (!joueur) throw new BadRequestException("Joueur introuvable");
      const destinations = await this.prisma.destinations.findMany({ orderBy: { id: 'asc' } });
      const unlockedIds = await this.getUnlockedIslands(userId);
      const faction = this.formatFaction(joueur.faction || 'PIRATE');
      const chapitreEnCours = await this.prisma.histoire_chapitres.findFirst({ where: { faction: faction, numero: joueur.chapitre_actuel || 1 } });
      const targetIslandId = chapitreEnCours?.unlock_island_id || null;
      return destinations.map(d => ({
          ...d,
          est_verrouillee: !unlockedIds.includes(d.id) && d.id !== targetIslandId,
          is_story_objective: d.id === targetIslandId
      }));
  }

  async getUnlockedIslands(userId: string): Promise<number[]> {
      // (Reste inchangé)
      const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
      if (!joueur) return [1];
      const faction = this.formatFaction(joueur.faction || 'PIRATE');
      const currentChap = joueur.chapitre_actuel || 1;
      const chapitres = await this.prisma.histoire_chapitres.findMany({ where: { faction: faction, numero: { lte: currentChap } }, select: { unlock_island_id: true } });
      const unlockedIds = chapitres.map(c => c.unlock_island_id).filter((id): id is number => id !== null);
      if (!unlockedIds.includes(1)) unlockedIds.push(1);
      return unlockedIds;
  }
}