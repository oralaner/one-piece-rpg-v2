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
  // 2. LANCER (CORRIGÉ & SÉCURISÉ)
  // --------------------------------------------------------
async startActivity(userId: string, activityId: string) {
    console.log(`\n🔴 [START DEBUG] Tentative lancement: ${activityId} pour User: ${userId}`);
    
    try {
        // ETAPE 1 : Chargement Joueur
        const joueur = await this.prisma.joueurs.findUnique({
            where: { id: userId },
            include: { localisation: true }
        });
        console.log("✅ 1. Joueur trouvé:", joueur ? "OUI" : "NON");

        if (!joueur) throw new BadRequestException("Joueur introuvable");
        if (!joueur.localisation) throw new BadRequestException("Position inconnue");
        if (joueur.activite_actuelle) throw new BadRequestException("Déjà occupé !");

        // ETAPE 2 : Chargement Config
        const config = (ACTIVITIES_CONFIG as any)[activityId];
        console.log("✅ 2. Config Activité:", config ? config.nom : "INCONNUE");
        if (!config) throw new BadRequestException("Activité inconnue.");

        // ETAPE 3 : Vérification Lieux
        let facilities: string[] = (joueur.localisation.facilities as unknown as string[]) || [];
        if (facilities.length === 0) facilities = ['SAUVAGE'];
        
        const hasFacility = config.facilities_req.some((f: string) => facilities.includes(f));
        console.log(`✅ 3. Lieu OK ? ${hasFacility} (Installations: ${facilities.join(', ')})`);
        
        if (!hasFacility) throw new BadRequestException("Mauvais endroit.");

        // ETAPE 4 : Vérification Coûts (C'EST SOUVENT ICI QUE ÇA PLANTE AVEC LES BERRYS)
        const playerBerrys = Number(joueur.berrys || 0); // Conversion BigInt -> Number pour comparer
        const costBerrys = config.cout_berrys || 0;
        const currentEnergy = joueur.energie_actuelle || 0;
        const costEnergy = config.energie || 0;

        console.log(`💰 [ECONOMY CHECK] Joueur: ${playerBerrys}฿ / Coût: ${costBerrys}฿`);
        console.log(`⚡ [ENERGY CHECK] Joueur: ${currentEnergy}⚡ / Coût: ${costEnergy}⚡`);

        if (currentEnergy < costEnergy) throw new BadRequestException("Pas assez d'énergie.");
        if (playerBerrys < costBerrys) throw new BadRequestException("Pas assez de Berrys.");

        // ETAPE 5 : Préparation de la mise à jour BDD
        const now = new Date();
        const fin = new Date(now.getTime() + config.duree * 1000);

        const updateData: any = {
            activite_actuelle: activityId,
            activite_debut: now,
            activite_fin: fin
        };

        // Gestion Énergie
        if (costEnergy > 0) {
            updateData.energie_actuelle = { decrement: costEnergy };
        }
        
        // Gestion Berrys (Le point critique)
        if (costBerrys > 0) {
            // On s'assure que c'est bien un entier JS transformé en BigInt
            const bigIntCost = BigInt(Math.floor(costBerrys));
            console.log(`📉 [PRISMA PREP] Decrement Berrys de: ${bigIntCost.toString()} (Type: ${typeof bigIntCost})`);
            updateData.berrys = { decrement: bigIntCost };
        }

        // Log de l'objet final (sans faire planter le console.log avec les BigInt)
        console.log("💾 [PRISMA UPDATE DATA]:", JSON.stringify(updateData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // ETAPE 6 : Exécution Prisma
        await this.prisma.joueurs.update({
            where: { id: userId },
            data: updateData
        });

        console.log("✅ [SUCCESS] Activité lancée !");
        return { success: true, message: `Début : ${config.nom}`, fin };

    } catch (error) {
        console.error("❌❌❌ [ERREUR CRITIQUE START] ❌❌❌");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        
        // Si c'est une erreur Prisma spécifique, on essaie de l'afficher mieux
        if (error.code) {
            console.error("Prisma Error Code:", error.code);
            console.error("Prisma Meta:", error.meta);
        }

        if (error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException(error.message || "Erreur interne au lancement");
    }
  }

  // --------------------------------------------------------
  // 3. RÉCLAMER (DÉJÀ CORRIGÉ)
  // --------------------------------------------------------
  async claimActivity(userId: string) {
    try {
        const joueur = await this.prisma.joueurs.findUnique({
            where: { id: userId },
            include: { localisation: true }
        });

        if (!joueur) throw new BadRequestException("Joueur introuvable");
        if (!joueur.activite_actuelle) throw new BadRequestException("Aucune activité en cours.");
        
        if (!joueur.activite_fin) throw new BadRequestException("Erreur de date.");
        const now = new Date();
        if (now < new Date(joueur.activite_fin)) throw new BadRequestException("Patience, ce n'est pas fini !");

        const actId = joueur.activite_actuelle;
        const config = (ACTIVITIES_CONFIG as any)[actId];

        if (!config) {
            await this.prisma.joueurs.update({
                where: { id: userId },
                data: { activite_actuelle: null, activite_debut: null, activite_fin: null }
            });
            throw new BadRequestException("Activité obsolète. Reset.");
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

        let gainBerrys = BigInt(0);
        if (config.gain_berrys_base) {
            const bonus = islandLevel * 10; 
            gainBerrys = BigInt(Math.floor(config.gain_berrys_base + bonus));
        }
        
        const gainXp = config.xp_gain || 0;

        // --- UPDATE ---
        let lootMessage: string[] = [];
        let structuredItems: any[] = []; // 🔥 Pour le RewardModal
        
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
                
                // 🔥 On prépare l'objet pour le RewardModal
                structuredItems.push({
                    nom: item.nom,
                    quantite: 1,
                    image_url: item.image_url,
                    rarity: item.rarete // Assure-toi que c'est 'rarete' ou 'rarity' selon ton schema
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
        if (gainBerrys > BigInt(0)) finalUpdate.berrys = { increment: gainBerrys };

        await this.prisma.joueurs.update({
            where: { id: userId },
            data: finalUpdate
        });

        if (gainXp > 0) lootMessage.push(`+${gainXp} XP`);
        if (gainBerrys > BigInt(0)) lootMessage.push(`+${gainBerrys.toString()} ฿`);
        
        console.log("📤 Retour Client (Rewards):", structuredItems);

        return { 
            success: true, 
            message: "Activité terminée !", 
            // 🔥 NOUVEAU FORMAT DE RÉPONSE
            result: {
                title: "Rapport d'Activité",
                message: `Vous avez terminé : ${config.nom}`,
                xp: gainXp,
                berrys: Number(gainBerrys), // Conversion sécurisée pour le JSON
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