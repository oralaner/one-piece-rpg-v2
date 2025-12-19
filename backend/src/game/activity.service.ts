import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; 
import { ACTIVITIES_CONFIG } from './activities.config';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------------------------------
  // 1. LISTER
  // --------------------------------------------------------
  async getAvailableActivities(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({
      where: { id: userId },
      include: { localisation: true }
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable");
    if (joueur.statut_voyage === 'EN_MER' || !joueur.localisation) return { in_progress: null, available: [] };

    const loc = joueur.localisation;
    let facilities: string[] = (loc.facilities as unknown as string[]) || []; 
    if (facilities.length === 0) facilities = ['SAUVAGE'];
    
    const cooldowns: any = (joueur.cooldowns as any) || {};
    const now = new Date();

    const activitiesList = Object.values(ACTIVITIES_CONFIG).map((act: any) => {
  // 🛡️ SÉCURITÉ : Si ce n'est pas une activité (pas d'ID ou pas de facilities_req), on l'ignore
  if (!act.id || !act.facilities_req) return null;

  const hasFacility = act.facilities_req.some((f: string) => facilities.includes(f));
  const hasFaction = act.faction_req ? act.faction_req === joueur.faction : true;
  
  if (!hasFacility || !hasFaction) return null;
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
    return { in_progress: currentStatus, available: activitiesList };
  }

  // --------------------------------------------------------
  // 2. LANCER (CORRECTION : RETRAIT DU BIGINT)
  // --------------------------------------------------------
  async startActivity(userId: string, activityId: string) {
    console.log(`🚀 [START] Lancement activité: ${activityId}`);
    try {
        const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId }, include: { localisation: true } });
        
        if (!joueur) throw new BadRequestException("Joueur introuvable");
        if (!joueur.localisation) throw new BadRequestException("Position inconnue");
        if (joueur.activite_actuelle) throw new BadRequestException("Occupé !");
        
        const config = (ACTIVITIES_CONFIG as any)[activityId];
        if (!config) throw new BadRequestException("Activité inconnue.");

        let facilities: string[] = (joueur.localisation.facilities as unknown as string[]) || [];
        if (facilities.length === 0) facilities = ['SAUVAGE'];
        
        if (!config.facilities_req.some((f: string) => facilities.includes(f))) throw new BadRequestException("Mauvais endroit.");
        if (config.faction_req && config.faction_req !== joueur.faction) throw new BadRequestException(`Réservé aux ${config.faction_req}s.`);

        const cooldowns: any = (joueur.cooldowns as any) || {};
        if (cooldowns[activityId] && new Date(cooldowns[activityId]) > new Date()) throw new BadRequestException("En récupération.");

        // 🛠️ CORRECTION : Tout en Number (Int)
        const playerBerrys = Number(joueur.berrys || 0);
        const costBerrys = Number(config.cout_berrys || 0);
        const currentEnergy = joueur.energie_actuelle || 0;
        const costEnergy = config.energie || 0;

        if (currentEnergy < costEnergy) throw new BadRequestException("Pas assez d'énergie.");
        if (playerBerrys < costBerrys) throw new BadRequestException("Pas assez de Berrys.");

        const now = new Date();
        const fin = new Date(now.getTime() + config.duree * 1000);

        const updateData: any = {
            activite_actuelle: activityId,
            activite_debut: now,
            activite_fin: fin
        };

        if (costEnergy > 0) {
            updateData.energie_actuelle = { decrement: costEnergy };
        }
        
        if (costBerrys > 0) {
            // 🛠️ CORRECTION : On envoie un Int standard, pas un BigInt
            updateData.berrys = { decrement: Math.floor(costBerrys) };
        }

        await this.prisma.joueurs.update({
            where: { id: userId },
            data: updateData
        });

        return { success: true, message: `Début : ${config.nom}`, fin };

    } catch (error) {
        console.error("❌ ERREUR START :", error);
        if (error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException(error.message);
    }
  }

  // --------------------------------------------------------
  // 3. RÉCLAMER (CORRECTION : RETRAIT DU BIGINT)
  // --------------------------------------------------------
  async claimActivity(userId: string) {
    try {
        const joueur = await this.prisma.joueurs.findUnique({
            where: { id: userId },
            include: { localisation: true }
        });

        if (!joueur) throw new BadRequestException("Joueur introuvable");
        if (!joueur.activite_actuelle) throw new BadRequestException("Aucune activité.");
        
        if (!joueur.activite_fin) throw new BadRequestException("Date invalide.");
        const now = new Date();
        if (now < new Date(joueur.activite_fin)) throw new BadRequestException("Patience !");

        const actId = joueur.activite_actuelle;
        const config = (ACTIVITIES_CONFIG as any)[actId];

        if (!config) {
            await this.prisma.joueurs.update({
                where: { id: userId },
                data: { activite_actuelle: null, activite_debut: null, activite_fin: null }
            });
            throw new BadRequestException("Activité reset (obsolète).");
        }

        const islandLevel = joueur.localisation?.niveau_requis || 1; 

        // --- BUTIN ---
        let itemsGivenNames: string[] = [];
        if (config.loots && config.loots.length > 0) {
            for (const possibleLoot of config.loots) {
                if (islandLevel >= possibleLoot.min_lvl && islandLevel <= possibleLoot.max_lvl) {
                    const roll = Math.random() * 100;
                    if (roll <= possibleLoot.chance) itemsGivenNames.push(possibleLoot.item);
                }
            }
        }

        // 🛠️ CORRECTION : Berrys en Number
        let gainBerrys = 0;
        if (config.gain_berrys_base) {
            const bonus = islandLevel * 10; 
            gainBerrys = Math.floor(config.gain_berrys_base + bonus);
        }
        
        const gainXp = config.xp_gain || 0;

        // --- UPDATE ---
        let lootMessage: string[] = [];
        let structuredItems: any[] = [];
        
        if (itemsGivenNames.length > 0) {
            const itemsDb = await this.prisma.objets.findMany({ where: { nom: { in: itemsGivenNames } } });
            
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
                
                structuredItems.push({
                    nom: item.nom,
                    quantite: 1,
                    image_url: item.image_url,
                    rarity: item.rarete 
                });
            }
        }

        const cooldowns: any = (joueur.cooldowns as any) || {};
        const nextAvailable = new Date(new Date().getTime() + config.cooldown * 1000);
        const newCooldowns = { ...cooldowns, [actId]: nextAvailable };

        const finalUpdate: any = {
            activite_actuelle: null,
            activite_debut: null,
            activite_fin: null,
            cooldowns: newCooldowns,
        };

        if (gainXp > 0) finalUpdate.xp = { increment: gainXp };
        // 🛠️ CORRECTION : increment avec un Int classique
        if (gainBerrys > 0) finalUpdate.berrys = { increment: gainBerrys };

        await this.prisma.joueurs.update({
            where: { id: userId },
            data: finalUpdate
        });

        if (gainXp > 0) lootMessage.push(`+${gainXp} XP`);
        if (gainBerrys > 0) lootMessage.push(`+${gainBerrys} ฿`);
        
        console.log("📤 Retour Client (Rewards):", structuredItems);

        return { 
            success: true, 
            message: "Activité terminée !", 
            result: {
                title: "Rapport d'Activité",
                message: `Vous avez terminé : ${config.nom}`,
                xp: gainXp,
                berrys: gainBerrys,
                items: structuredItems
            },
            cooldownEnds: nextAvailable
        };

    } catch (error) {
        console.error("❌ ERREUR CLAIM :", error);
        if (error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException(error.message);
    }
  }
}