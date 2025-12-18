import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // ⚠️ Vérifie si c'est '../prisma.service' ou '../prisma/prisma.service' selon ton dossier
import { ACTIVITIES_CONFIG } from './activities.config';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------------------------------
  // 1. LISTER LES ACTIVITÉS DISPONIBLES (ET LEUR ÉTAT)
  // --------------------------------------------------------
  async getAvailableActivities(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({
      where: { id: userId },
      include: { localisation: true }
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable");

    // Si on est en mer ou sans localisation, aucune activité n'est dispo
    if (joueur.statut_voyage === 'EN_MER' || !joueur.localisation) {
      return { in_progress: null, available: [] };
    }

    const loc = joueur.localisation;
    
    // 🔥 MODIFICATION : Fallback "SAUVAGE" si l'île est vide
    // On force le typage en any/string[] pour manipuler le tableau
    let facilities: string[] = (loc.facilities as unknown as string[]) || []; 
    if (facilities.length === 0) {
        facilities = ['SAUVAGE'];
    }
    
    const cooldowns: any = (joueur.cooldowns as any) || {};
    const now = new Date();

    // On transforme la Config en liste adaptée au Frontend
    const activitiesList = Object.values(ACTIVITIES_CONFIG).map((act: any) => {
      
      // 1. Vérification des prérequis (Lieu & Faction)
      const hasFacility = act.facilities_req.some((f: string) => facilities.includes(f));
      const hasFaction = act.faction_req ? act.faction_req === joueur.faction : true;
      
      // Si l'activité n'est pas possible ici, on ne l'affiche même pas
      if (!hasFacility || !hasFaction) return null;

      // 2. Gestion du Cooldown
      const cdFin = cooldowns[act.id] ? new Date(cooldowns[act.id]) : null;
      const isOnCooldown = cdFin && cdFin > now;
      const timeLeft = isOnCooldown ? Math.ceil((cdFin.getTime() - now.getTime()) / 1000) : 0;

      return {
        id: act.id,
        nom: act.nom,
        description: act.description,
        emoji: act.emoji,
        energie: act.energie,
        cout_berrys: act.cout_berrys || 0,
        duree: act.duree,
        isOnCooldown,
        cooldownSeconds: timeLeft
      };
    }).filter(a => a !== null);

    // Info sur l'activité en cours
    let currentStatus: any = null;
    
    if (joueur.activite_actuelle && joueur.activite_debut && joueur.activite_fin) {
      const fin = new Date(joueur.activite_fin);
      const debut = new Date(joueur.activite_debut);
      const totalDuration = (fin.getTime() - debut.getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil((fin.getTime() - now.getTime()) / 1000));
      
      currentStatus = {
        id: joueur.activite_actuelle,
        isFinished: remaining <= 0,
        remainingSeconds: remaining,
        totalDuration: totalDuration
      };
    }

    return {
      in_progress: currentStatus,
      available: activitiesList
    };
  }

  // --------------------------------------------------------
  // 2. LANCER UNE ACTIVITÉ
  // --------------------------------------------------------
  async startActivity(userId: string, activityId: string) {
    const joueur = await this.prisma.joueurs.findUnique({
      where: { id: userId },
      include: { localisation: true }
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable");
    if (!joueur.localisation) throw new BadRequestException("Position inconnue");

    // A. Vérifications basiques
    if (joueur.activite_actuelle) throw new BadRequestException("Vous êtes déjà occupé !");
    if (joueur.statut_voyage === 'EN_MER') throw new BadRequestException("Impossible en mer.");

    const config = (ACTIVITIES_CONFIG as any)[activityId];
    if (!config) throw new BadRequestException("Activité inconnue.");

    // B. Vérifications Prérequis (Lieu, Faction, Cooldown)
    // 🔥 MODIFICATION : Fallback "SAUVAGE" ici aussi
    let facilities: string[] = (joueur.localisation.facilities as unknown as string[]) || [];
    if (facilities.length === 0) {
        facilities = ['SAUVAGE'];
    }
    
    const hasFacility = config.facilities_req.some((f: string) => facilities.includes(f));
    
    if (!hasFacility) throw new BadRequestException("Mauvais endroit pour faire ça.");
    
    if (config.faction_req && config.faction_req !== joueur.faction) {
        throw new BadRequestException(`Réservé aux ${config.faction_req}s.`);
    }

    const cooldowns: any = (joueur.cooldowns as any) || {};
    if (cooldowns[activityId] && new Date(cooldowns[activityId]) > new Date()) {
        throw new BadRequestException("Activité en récupération.");
    }

    // C. Vérification Ressources
    const playerBerrys = Number(joueur.berrys || 0);
    const costBerrys = config.cout_berrys || 0;

    if ((joueur.energie_actuelle || 0) < config.energie) throw new BadRequestException("Pas assez d'énergie.");
    if (playerBerrys < costBerrys) throw new BadRequestException("Pas assez de Berrys.");

    // D. Application (Paiement + Lancement Timer)
    const now = new Date();
    const fin = new Date(now.getTime() + config.duree * 1000);

    const updateData: any = {
        energie_actuelle: { decrement: config.energie },
        activite_actuelle: activityId,
        activite_debut: now,
        activite_fin: fin
    };

    if (costBerrys > 0) {
        updateData.berrys = { decrement: BigInt(costBerrys) };
    }

    await this.prisma.joueurs.update({
      where: { id: userId },
      data: updateData
    });

    return { success: true, message: `Début : ${config.nom}`, fin };
  }

  // --------------------------------------------------------
  // 3. RÉCLAMER LA RÉCOMPENSE (CLAIM)
  // --------------------------------------------------------
  async claimActivity(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({
      where: { id: userId },
      include: { localisation: true }
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable");
    if (!joueur.localisation) throw new BadRequestException("Position inconnue");

    if (!joueur.activite_actuelle) throw new BadRequestException("Aucune activité en cours.");
    
    if (!joueur.activite_fin) throw new BadRequestException("Erreur de date.");
    if (new Date() < new Date(joueur.activite_fin)) throw new BadRequestException("Patience, ce n'est pas fini !");

    const actId = joueur.activite_actuelle;
    const config = (ACTIVITIES_CONFIG as any)[actId];
    const islandLevel = joueur.localisation.niveau_requis || 1; 

    // --- GÉNÉRATION DU BUTIN (SCALING) ---
    let lootMessage: string[] = [];
    let itemsGiven: string[] = [];
    
    // 1. Items
    if (config.loots && config.loots.length > 0) {
        for (const possibleLoot of config.loots) {
            if (islandLevel >= possibleLoot.min_lvl && islandLevel <= possibleLoot.max_lvl) {
                const roll = Math.random() * 100;
                if (roll <= possibleLoot.chance) {
                    itemsGiven.push(possibleLoot.item);
                }
            }
        }
    }

    // 2. Berrys (Base + Bonus niveau)
    let gainBerrys = BigInt(0);
    if (config.gain_berrys_base) {
        const bonus = islandLevel * 10; 
        gainBerrys = BigInt(config.gain_berrys_base + bonus);
    }

    // 3. XP Joueur
    const gainXp = config.xp_gain || 0;

    // --- MISE À JOUR BDD ---
    
    // Ajout des items dans l'inventaire
    if (itemsGiven.length > 0) {
        const itemsDb = await this.prisma.objets.findMany({
            where: { nom: { in: itemsGiven } }
        });

        for (const item of itemsDb) {
            const existingInv = await this.prisma.inventaire.findFirst({
                where: { joueur_id: userId, objet_id: item.id }
            });

            if (existingInv) {
                await this.prisma.inventaire.update({
                    where: { id: existingInv.id },
                    data: { quantite: { increment: 1 } }
                });
            } else {
                await this.prisma.inventaire.create({
                    data: { joueur_id: userId, objet_id: item.id, quantite: 1 }
                });
            }
            lootMessage.push(`+1 ${item.nom}`);
        }
    }

    // Mise à jour du Cooldown + Reset Activité + Gains
    const cooldowns: any = (joueur.cooldowns as any) || {};
    const nextAvailable = new Date(new Date().getTime() + config.cooldown * 1000);
    
    const newCooldowns = { ...cooldowns, [actId]: nextAvailable };

    const finalUpdate: any = {
        activite_actuelle: null,
        activite_debut: null,
        activite_fin: null,
        cooldowns: newCooldowns,
    };

    if (gainXp > 0) finalUpdate.experience = { increment: gainXp };
    if (gainBerrys > BigInt(0)) finalUpdate.berrys = { increment: gainBerrys };

    await this.prisma.joueurs.update({
        where: { id: userId },
        data: finalUpdate
    });

    if (gainXp > 0) lootMessage.push(`+${gainXp} XP`);
    if (gainBerrys > BigInt(0)) lootMessage.push(`+${gainBerrys.toString()} ฿`);
    if (itemsGiven.length === 0 && gainBerrys === BigInt(0) && gainXp === 0) lootMessage.push("Rien trouvé cette fois...");

    return { 
        success: true, 
        message: "Activité terminée !", 
        loots: lootMessage,
        cooldownEnds: nextAvailable
    };
  }
}