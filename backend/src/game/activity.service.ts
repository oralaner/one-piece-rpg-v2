import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; 
import { ACTIVITIES_CONFIG } from './activities.config';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  // ... (Garde getAvailableActivities tel quel) ...
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

  // ... (Garde startActivity tel quel) ...
  async startActivity(userId: string, activityId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId }, include: { localisation: true } });
    if (!joueur || !joueur.localisation) throw new BadRequestException("Joueur/Loc introuvable");
    if (joueur.activite_actuelle) throw new BadRequestException("Occupé");
    
    const config = (ACTIVITIES_CONFIG as any)[activityId];
    if (!config) throw new BadRequestException("Activité inconnue");

    let facilities: string[] = (joueur.localisation.facilities as unknown as string[]) || [];
    if (facilities.length === 0) facilities = ['SAUVAGE'];
    if (!config.facilities_req.some((f: string) => facilities.includes(f))) throw new BadRequestException("Mauvais lieu");

    const now = new Date();
    const fin = new Date(now.getTime() + config.duree * 1000);
    const updateData: any = {
        energie_actuelle: { decrement: config.energie },
        activite_actuelle: activityId,
        activite_debut: now,
        activite_fin: fin
    };
    if (config.cout_berrys) updateData.berrys = { decrement: BigInt(config.cout_berrys) };

    await this.prisma.joueurs.update({ where: { id: userId }, data: updateData });
    return { success: true, message: `Début : ${config.nom}`, fin };
  }

  // --------------------------------------------------------
  // 🔥 CLAIM ACTIVITY : VERSION DEBUG EXTRÊME 🔥
  // --------------------------------------------------------
  async claimActivity(userId: string) {
    console.log("🚀 [DEBUG] Début claimActivity pour", userId);
    try {
        const joueur = await this.prisma.joueurs.findUnique({
            where: { id: userId },
            include: { localisation: true }
        });

        if (!joueur) throw new Error("Joueur introuvable en BDD");
        if (!joueur.activite_actuelle) throw new Error("Pas d'activité en cours dans la BDD");
        
        console.log("ℹ️ [DEBUG] Activité trouvée:", joueur.activite_actuelle);

        const actId = joueur.activite_actuelle;
        const config = (ACTIVITIES_CONFIG as any)[actId];

        // Sécurité config
        if (!config) {
            console.warn("⚠️ [DEBUG] Config perdue, reset forcé.");
            await this.prisma.joueurs.update({
                where: { id: userId },
                data: { activite_actuelle: null, activite_debut: null, activite_fin: null }
            });
            throw new Error("Activité obsolète (Reset effectué)");
        }

        const islandLevel = joueur.localisation?.niveau_requis || 1; 

        // --- CALCUL BUTIN ---
        let itemsGiven: string[] = [];
        
        if (config.loots && config.loots.length > 0) {
            for (const possibleLoot of config.loots) {
                if (islandLevel >= possibleLoot.min_lvl && islandLevel <= possibleLoot.max_lvl) {
                    const roll = Math.random() * 100;
                    if (roll <= possibleLoot.chance) itemsGiven.push(possibleLoot.item);
                }
            }
        }
        console.log("🎲 [DEBUG] Items gagnés (théorique):", itemsGiven);

        // Berrys
        let gainBerrys = BigInt(0);
        if (config.gain_berrys_base) {
            const bonus = islandLevel * 10; 
            gainBerrys = BigInt(Math.floor(config.gain_berrys_base + bonus));
        }
        
        // XP
        const gainXp = config.xp_gain || 0;

        // --- UPDATE BDD ITEMS ---
        let lootMessage: string[] = [];
        
        if (itemsGiven.length > 0) {
            console.log("🔍 [DEBUG] Recherche des items en BDD...");
            const itemsDb = await this.prisma.objets.findMany({
                where: { nom: { in: itemsGiven } }
            });
            console.log(`📦 [DEBUG] Items trouvés en BDD: ${itemsDb.length} / ${itemsGiven.length}`);

            for (const item of itemsDb) {
                // Upsert manuel sécurisé
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

        // --- UPDATE BDD JOUEUR ---
        console.log("💾 [DEBUG] Mise à jour du joueur (XP/Berrys/Reset)...");
        
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

        // Messages de fin
        if (gainXp > 0) lootMessage.push(`+${gainXp} XP`);
        if (gainBerrys > BigInt(0)) lootMessage.push(`+${gainBerrys.toString()} ฿`);
        if (lootMessage.length === 0) lootMessage.push("Rien trouvé cette fois...");

        console.log("✅ [DEBUG] Succès !");
        
        return { 
            success: true, 
            message: "Activité terminée !", 
            loots: lootMessage,
            cooldownEnds: nextAvailable
        };

    } catch (error) {
        console.error("❌ [ERREUR FATALE] DÉTAILS:", error);
        // ON RENVOIE L'ERREUR EXACTE AU FRONTEND POUR QUE TU PUISSES LA LIRE
        throw new InternalServerErrorException(error.message || "Erreur inconnue");
    }
  }
}