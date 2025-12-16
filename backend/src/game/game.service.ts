import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma.service';
import { InvestStatDto } from './invest-stat.dto';
import { BuyItemDto } from './buy-item.dto';
import { EquipItemDto } from './equip-item.dto';
import { UnequipItemDto } from './unequip-item.dto';
import { SellItemDto } from './sell-item.dto';
import { StartFightDto } from './start-fight.dto';
import { PlayTurnDto } from './play-turn.dto';
import { PlayCasinoDto } from './play-casino.dto';
import { TravelDto } from './travel.dto';
import { CraftDto } from './craft.dto';
import { BuySkillDto } from './buy-skill.dto'; 
import { EquipDeckDto } from './equip-deck.dto';
import { MarketSellDto } from './market-sell.dto';
import { MarketBuyDto } from './market-buy.dto';
import { CreateCrewDto } from './crew-create.dto';
import { CrewBankDto } from './crew-bank.dto';
import { JoinCrewDto, RecruitDto, KickDto } from './crew-manage.dto';
import { UpdateCrewDto } from './crew-manage.dto';
import { UseItemDto } from './use-item.dto';
import { OpenChestDto } from './crew-manage.dto';
import { Prisma } from '@prisma/client';
import { StoryService } from './story.service';

// ====================================================================
// 💰 DÉFINITIONS DES TABLES DE LOOT
// ====================================================================

const LOOT_TABLES = {
    COMMUN: {
        berrys_min: 50, berrys_max: 200,
        loots: [
            { rarity: 'Commun', chance: 100, min: 1, max: 5 },
            { rarity: 'Rare', chance: 50, min: 1, max: 2 },
            { rarity: 'Épique', chance: 5, min: 1, max: 1 },
            { rarity: 'Légendaire', chance: 0, min: 0, max: 0 },
            { rarity: 'Mythique', chance: 0, min: 0, max: 0 },
        ]
    },
    RARE: {
        berrys_min: 200, berrys_max: 500,
        loots: [
            { rarity: 'Commun', chance: 100, min: 3, max: 5 },
            { rarity: 'Commun', chance: 100, min: 3, max: 5 }, // n°2
            { rarity: 'Rare', chance: 75, min: 1, max: 3 },
            { rarity: 'Épique', chance: 10, min: 1, max: 2 },
            { rarity: 'Légendaire', chance: 1, min: 1, max: 1 },
            { rarity: 'Mythique', chance: 0, min: 0, max: 0 },
        ]
    },
    ÉPIQUE: {
        berrys_min: 500, berrys_max: 1500,
        loots: [
            { rarity: 'Commun', chance: 100, min: 5, max: 10 },
            { rarity: 'Commun', chance: 100, min: 5, max: 10 }, // n°2
            { rarity: 'Rare', chance: 100, min: 3, max: 5 },
            { rarity: 'Rare', chance: 100, min: 3, max: 5 }, // n°2
            { rarity: 'Épique', chance: 75, min: 1, max: 5 },
            { rarity: 'Légendaire', chance: 25, min: 1, max: 2 },
            { rarity: 'Mythique', chance: 1, min: 1, max: 1 },
        ]
    },
    LÉGENDAIRE: {
        berrys_min: 1500, berrys_max: 4000,
        loots: [
            { rarity: 'Commun', chance: 100, min: 10, max: 15 },
            { rarity: 'Commun', chance: 100, min: 10, max: 15 }, // n°2
            { rarity: 'Commun', chance: 100, min: 10, max: 15 }, // n°3
            { rarity: 'Rare', chance: 100, min: 5, max: 10 },
            { rarity: 'Rare', chance: 100, min: 5, max: 10 }, // n°2
            { rarity: 'Épique', chance: 100, min: 3, max: 5 },
            { rarity: 'Épique', chance: 100, min: 3, max: 5 }, // n°2
            { rarity: 'Légendaire', chance: 75, min: 2, max: 5 },
            { rarity: 'Mythique', chance: 10, min: 1, max: 2 },
        ]
    },
    MYTHIQUE: {
        berrys_min: 4000, berrys_max: 10000,
        loots: [
            { rarity: 'Commun', chance: 100, min: 15, max: 25 },
            { rarity: 'Commun', chance: 100, min: 15, max: 25 }, // n°2
            { rarity: 'Commun', chance: 100, min: 15, max: 25 }, // n°3
            { rarity: 'Rare', chance: 100, min: 10, max: 15 },
            { rarity: 'Rare', chance: 100, min: 10, max: 15 }, // n°2
            { rarity: 'Rare', chance: 100, min: 10, max: 15 }, // n°3
            { rarity: 'Épique', chance: 100, min: 5, max: 8 },
            { rarity: 'Épique', chance: 100, min: 5, max: 8 }, // n°2
            { rarity: 'Épique', chance: 100, min: 5, max: 8 }, // n°3
            { rarity: 'Légendaire', chance: 100, min: 3, max: 5 },
            { rarity: 'Légendaire', chance: 100, min: 3, max: 5 }, // n°2
            { rarity: 'Mythique', chance: 100, min: 2, max: 3 },
        ]
    },
};

const LOOT_ACTIVITY_TABLE = [
    { rarity: 'Commun', chance: 50, min: 1, max: 3 },
    { rarity: 'Commun', chance: 25, min: 1, max: 3 }, // n°2
    { rarity: 'Rare', chance: 5, min: 1, max: 1 },
    { rarity: 'Épique', chance: 0, min: 0, max: 0 },
    { rarity: 'Légendaire', chance: 0, min: 0, max: 0 },
    { rarity: 'Mythique', chance: 0, min: 0, max: 0 },
];

const LOOT_VOYAGE_TABLES = {
    LOW: [
        { rarity: 'Commun', chance: 50, min: 1, max: 3 },
        { rarity: 'Commun', chance: 25, min: 1, max: 3 },
        { rarity: 'Rare', chance: 5, min: 1, max: 1 },
    ],
    MEDIUM: [
        { rarity: 'Commun', chance: 100, min: 3, max: 5 },
        { rarity: 'Commun', chance: 75, min: 3, max: 5 },
        { rarity: 'Rare', chance: 25, min: 1, max: 3 },
        { rarity: 'Épique', chance: 5, min: 1, max: 1 },
    ],
    HIGH: [
        { rarity: 'Commun', chance: 100, min: 6, max: 10 },
        { rarity: 'Commun', chance: 100, min: 6, max: 10 },
        { rarity: 'Rare', chance: 100, min: 3, max: 5 },
        { rarity: 'Rare', chance: 75, min: 3, max: 5 },
        { rarity: 'Épique', chance: 25, min: 1, max: 3 },
        { rarity: 'Légendaire', chance: 5, min: 1, max: 1 },
    ],
    EXPERT: [
        { rarity: 'Rare', chance: 100, min: 6, max: 10 },
        { rarity: 'Rare', chance: 100, min: 6, max: 10 },
        { rarity: 'Épique', chance: 100, min: 3, max: 5 },
        { rarity: 'Épique', chance: 75, min: 3, max: 5 },
        { rarity: 'Légendaire', chance: 25, min: 1, max: 3 },
        { rarity: 'Mythique', chance: 5, min: 1, max: 1 },
    ],
    LEGENDARY: [
        { rarity: 'Épique', chance: 100, min: 6, max: 10 },
        { rarity: 'Épique', chance: 100, min: 6, max: 10 },
        { rarity: 'Légendaire', chance: 100, min: 3, max: 5 },
        { rarity: 'Légendaire', chance: 50, min: 3, max: 5 },
        { rarity: 'Mythique', chance: 25, min: 1, max: 1 },
    ],
};

const CHEST_RARITY_MAP = {
    'Coffre Commun': 'COMMUN',
    'Coffre Rare': 'RARE',
    'Coffre Épique': 'ÉPIQUE',
    'Coffre Légendaire': 'LÉGENDAIRE',
    'Coffre Mythique': 'MYTHIQUE',
};

const FORBIDDEN_LOOT_TYPES = [
    'Fruit', 
    'Fruit du Démon', 
    'Arme', 
    'Tête', 
    'Corps', 
    'Bottes', 
    'Bague', 
    'Collier', 
    'Navire', 
    'Coffre',
    'Équipement' // Ajout explicite
];

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private storyService: StoryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // ====================================================================
  // 🧹 UTILITAIRES & HELPERS
  // ====================================================================

  private async clearCache(userId: string) {
    await this.cacheManager.del(`player_profile_v2:${userId}`);
  }

  // 🔥 Calcule une quantité aléatoire entre min et max (inclus) - CORRIGÉE
  private getRandomQuantity(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 🎲 Calcule des stats fixes à partir de fourchettes
  private calculateRandomStats(statsBonus: any) {
    if (!statsBonus || typeof statsBonus !== 'object') return {};
    const finalStats = {};
    for (const [stat, value] of Object.entries(statsBonus)) {
        if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
            const min = Number((value as any).min);
            const max = Number((value as any).max);
            const rolledValue = Math.floor(Math.random() * (max - min + 1)) + min;
            finalStats[stat] = rolledValue;
        } else if (typeof value === 'number') {
            finalStats[stat] = value;
        }
    }
    return finalStats;
  }

  // 💎 HELPER LOOT ROBUSTE : Sélectionne un item aléatoire (Méthode ID-Picking)
    private async findRandomItemInRarity(rarity: string, tx: any) {
        // Liste stricte des catégories à exclure
        const EXCLUDED_CATEGORIES = [
            'Coffre', 'Équipement', 'Fruit du Démon', 'Navire'
        ];

        // Critères de recherche
        const baseWhere = {
            rarete: rarity, // Doit correspondre exactement à la string en BDD (ex: "Commun")
            categorie: { notIn: EXCLUDED_CATEGORIES },
            type_equipement: null // Sécurité supplémentaire : on ne veut pas d'équipement
        };

        // 1. On récupère les IDs valides
        const validItems = await tx.objets.findMany({
            where: baseWhere,
            select: { id: true }
        });

        if (validItems.length === 0) {
            console.warn(`⚠️ Loot Warning: Aucun item '${rarity}' trouvé (hors exclusions).`);
            return null;
        }

        // 2. On en pioche un au hasard en JS (plus fiable que SKIP SQL sur petits volumes)
        const randomIndex = Math.floor(Math.random() * validItems.length);
        const selectedId = validItems[randomIndex].id;

        return await tx.objets.findUnique({ where: { id: selectedId } });
    }

  // 🔥 HELPER LOOT : Génère la liste des récompenses (Multi-roll)
  private async generateLoot(chestRarityKey: keyof typeof LOOT_TABLES, tx: any) {
    const table = LOOT_TABLES[chestRarityKey];
    if (!table) return { berrys: 0, items: [] };

    const berrysGain = this.getRandomQuantity(table.berrys_min, table.berrys_max);
    const rewards: any[] = [];

    // On parcourt TOUTES les lignes de probabilité (ex: Commun n°1, Commun n°2...)
    for (const drop of table.loots) {
        const roll = this.getRandomQuantity(0, 100);
        
        // Si le jet est réussi (ex: 45 <= 100)
        if (roll <= drop.chance) {
            const quantity = this.getRandomQuantity(drop.min, drop.max);

            if (quantity > 0) {
                // On cherche un item de la rareté demandée
                const randomItem = await this.findRandomItemInRarity(drop.rarity, tx);

                if (randomItem) {
                    rewards.push({
                        objet_data: randomItem,
                        quantite: quantity,
                    });
                }
            }
        }
    }

    return { berrys: berrysGain, items: rewards };
}

// 🔥 HELPER LOOT ACTIVITÉ : Génère le butin (Multi-roll + Secure)
  // Utilise maintenant 'tx' et 'findRandomItemInRarity' comme les coffres
  private async generateActivityLoot(lootTable: any[], tx: any) {
    if (!lootTable || lootTable.length === 0) return { items: [] };
    
    const rewards: any[] = [];

    for (const rule of lootTable) {
        // Le jet est réussi si le nombre aléatoire (0-100) est <= à la chance
        if (this.getRandomQuantity(0, 100) <= rule.chance) {
            
            const quantity = this.getRandomQuantity(rule.min, rule.max);
            
            if (quantity > 0) {
                // ✅ On utilise la fonction robuste (celle des coffres)
                // Elle garantit : Pas d'équipement, Pas de Fruit, Pas de Coffre
                const randomItem = await this.findRandomItemInRarity(rule.rarity, tx);
                
                if (randomItem) {
                    rewards.push({
                        objet_data: randomItem, // On garde l'objet complet
                        quantite: quantity,
                    });
                }
            }
        }
    }
    return { items: rewards };
  }
  // =================================================================
  // 📜 CONFIGURATION DES QUÊTES QUOTIDIENNES
  // =================================================================

  // =================================================================
  // 📜 SYSTÈME DE QUÊTES QUOTIDIENNES
  // =================================================================

  // 1. CONFIGURATION DES TEMPLATES
  private readonly QUEST_TEMPLATES = [
      { type: 'ARENA_FIGHT', desc: "Combattre {x} fois dans l'arène", min: 3, max: 3, xp: 300, berrys: 1500 },
      { type: 'VOYAGE', desc: "Terminer {x} voyages", min: 2, max: 2, xp: 400, berrys: 2000 },
      { type: 'CASINO_PLAY', desc: "Jouer {x} fois au casino", min: 5, max: 5, xp: 100, berrys: 500 },
      { type: 'ACTIVITY', desc: "Faire {x} activités", min: 3, max: 3, xp: 200, berrys: 800 },
  ];

  // 2. GÉNÉRER LES QUÊTES
async getDailyQuests(userId: string) {
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Chercher existantes
      const existingQuests = await this.prisma.quetes_journalieres.findMany({
          where: { 
              joueur_id: userId,
              date_creation: { gte: startOfDay }
          },
          orderBy: { est_recupere: 'asc' }
      });


      // 2. Si déjà 4, on renvoie
      if (existingQuests.length >= 4) {
          return existingQuests;
      }


      // 3. Nettoyage et Génération
      await this.prisma.quetes_journalieres.deleteMany({ where: { joueur_id: userId } });

      const newQuests: any[] = []; 
      
      // Vérification que les templates existent
      if (!this.QUEST_TEMPLATES || this.QUEST_TEMPLATES.length === 0) {
          console.error(`[ERREUR] QUEST_TEMPLATES est vide ou indéfini !`);
          return [];
      }

      for (const t of this.QUEST_TEMPLATES) {
          const objectif = t.min;
          const description = t.desc.replace('{x}', objectif.toString());
          
          newQuests.push({
              joueur_id: userId,
              type: t.type,
              description: description,
              objectif: objectif,
              avancement: 0,
              xp_reward: t.xp,
              berrys_reward: t.berrys
          });
      }


      await this.prisma.quetes_journalieres.createMany({ data: newQuests });

      const finalResult = await this.prisma.quetes_journalieres.findMany({ where: { joueur_id: userId } });
      
      return finalResult;
  }

  // 3. METTRE À JOUR L'AVANCEMENT (C'est cette fonction qui manquait !)
  async updateQuestProgress(userId: string, type: string, amount: number = 1) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // On cherche les quêtes actives de ce type créées aujourd'hui
      const quests = await this.prisma.quetes_journalieres.findMany({
          where: {
              joueur_id: userId,
              type: type,
              est_termine: false,
              est_recupere: false,
              date_creation: { gte: startOfDay }
          }
      });

      for (const q of quests) {
          const newProgress = Math.min(q.objectif, q.avancement + amount);
          const isFinished = newProgress >= q.objectif;

          if (q.avancement !== newProgress) {
              await this.prisma.quetes_journalieres.update({
                  where: { id: q.id },
                  data: { 
                      avancement: newProgress,
                      est_termine: isFinished
                  }
              });
          }
      }
  }

  // 4. RÉCLAMER LA RÉCOMPENSE
  async claimQuestReward(userId: string, questId: string) {
      const quest = await this.prisma.quetes_journalieres.findUnique({ where: { id: questId } });

      if (!quest || quest.joueur_id !== userId) throw new BadRequestException("Quête introuvable.");
      if (!quest.est_termine) throw new BadRequestException("Quête non terminée.");
      if (quest.est_recupere) throw new BadRequestException("Récompense déjà récupérée.");

      await this.prisma.$transaction(async (tx) => {
          // Marquer comme récupéré
          await tx.quetes_journalieres.update({
              where: { id: questId },
              data: { est_recupere: true }
          });

          // Donner la récompense
          const joueur = await tx.joueurs.findUnique({ where: { id: userId } });
          
          // Note: Idéalement, on utiliserait calculateLevelUp ici aussi, 
          // mais pour éviter les conflits de 'this' dans la transaction, on fait simple pour l'instant :
          await tx.joueurs.update({
              where: { id: userId },
              data: { 
                  berrys: { increment: quest.berrys_reward },
                  xp: { increment: quest.xp_reward } 
              }
          });
      });
      
      // On force un recalcul du cache pour que le joueur voit son niveau/xp à jour
      // Si l'XP dépasse le max, le prochain combat ou activité déclenchera le Level Up visuel proprement.
      await this.clearCache(userId);
      
      return { success: true, message: `Récompense : +${quest.xp_reward} XP, +${quest.berrys_reward} ฿` };
  }

// =================================================================
  // 1. CHARGEMENT DU PROFIL (VERSION FINALE : ENERGIE & REGEN)
  // =================================================================
  async getPlayerData(userId: string, discordPseudo?: string, discordAvatar?: string) {
    const now = new Date();

    // 1. Recherche du joueur
    let [joueur, allNavires] = await Promise.all([
        this.prisma.joueurs.findUnique({
            where: { id: userId },
            include: {
                inventaire: { include: { objets: true } },
                equipage: true,
                joueur_titres: { include: { titres_ref: true } },
                // On inclut l'équipement pour les stats
                equip_arme: true, equip_tete: true, equip_corps: true, 
                equip_bottes: true, equip_bague: true, equip_collier: true
            }
        }),
        this.prisma.navires_ref.findMany({ 
            include: { cout_items: { include: { objet: true } } }
        })
    ]);

    // 2. CRÉATION AUTOMATIQUE
    if (!joueur) {
        console.log(`✨ CRÉATION AUTO: ${discordPseudo}`);
        const finalPseudo = discordPseudo || `Pirate_${userId.substring(0, 5)}`;
        joueur = await this.prisma.joueurs.create({
            data: {
                id: userId,
                pseudo: finalPseudo, 
                avatar_url: discordAvatar || null,
                faction: null,
                points_carac: 5,
                pv_actuel: 100,
                energie_actuelle: 10,
                combats_journaliers: 0,
                dernier_reset_combats: now,
                xp: 0,
                niveau: 1
            }
        }) as any;
    }

    if (!joueur) throw new InternalServerErrorException("Joueur introuvable.");

    // --- 3. LOGIQUE "LAZY UPDATE" (Mise à jour visuelle sans écriture BDD systématique) ---
    
    // A. RESET JOURNALIER (Pour les stats/quêtes, pas pour bloquer)
    const lastReset = joueur.dernier_reset_combats ? new Date(joueur.dernier_reset_combats) : new Date(0);
    const isSameDay = lastReset.getDate() === now.getDate() && 
                      lastReset.getMonth() === now.getMonth() && 
                      lastReset.getFullYear() === now.getFullYear();

    // Si on a changé de jour, on remet le compteur de combats faits aujourd'hui à 0
    if (!isSameDay) {
        // On update en tâche de fond (fire & forget) ou on attend
        // Ici on le fait juste visuellement pour l'instant, l'écriture se fera à la prochaine action
        joueur.combats_journaliers = 0; 
        
        // Optionnel : Forcer l'update en BDD maintenant pour être clean
        await this.prisma.joueurs.update({
            where: { id: userId },
            data: { combats_journaliers: 0, dernier_reset_combats: now }
        });
    }

    // B. REGEN PV (10 PV / Heure)
    const stats = this.calculatePlayerStats(joueur);
    const lastPvUpdate = joueur.last_pv_update ? new Date(joueur.last_pv_update) : now;
    const hoursElapsedPv = (now.getTime() - lastPvUpdate.getTime()) / 3600000; // Heures décimales
    let virtualPv = joueur.pv_actuel ?? 0;
    
    // On ne regen que si blessé et si assez de temps passé (ex: > 6 min)
    if (hoursElapsedPv >= 0.1 && virtualPv < stats.pv_max_total) {
        const healAmount = Math.floor(hoursElapsedPv * 10); 
        virtualPv = Math.min(virtualPv + healAmount, stats.pv_max_total);
    }

    // C. REGEN ENERGIE (1 Energie / Heure)
    const MAX_ENERGIE = (joueur as any).energie_max || 10;
    const REGEN_TIME_MS = 3600000; // 1 heure en ms (3 600 000)
    
    const lastEnergieUpdate = joueur.last_energie_update ? new Date(joueur.last_energie_update) : now;
    const currentStoredEnergie = joueur.energie_actuelle ?? MAX_ENERGIE;
    
    let virtualEnergie = currentStoredEnergie;
    let timeUntilNextRegenMs = 0;

    if (currentStoredEnergie < MAX_ENERGIE) {
        const msElapsed = now.getTime() - lastEnergieUpdate.getTime();
        const energyGained = Math.floor(msElapsed / REGEN_TIME_MS);
        
        virtualEnergie = Math.min(currentStoredEnergie + energyGained, MAX_ENERGIE);
        
        // Calcul du temps restant pour le prochain point
        const msUsedForGain = energyGained * REGEN_TIME_MS;
        const msRestant = msElapsed - msUsedForGain;
        timeUntilNextRegenMs = Math.max(0, REGEN_TIME_MS - msRestant);
        
        if (virtualEnergie >= MAX_ENERGIE) timeUntilNextRegenMs = 0;
    }

    // --- 4. RECONSTRUCTION EQUIPEMENT & NAVIRE ---
    const equipementMap: any = { arme: null, tete: null, corps: null, bottes: null, bague: null, collier: null, navire: null };
    
    // 🔥 CORRECTION : On parcourt l'inventaire pour trouver ce qui est équipé
    // C'est la méthode la plus fiable car elle correspond à la logique de playTurn
    if (joueur.inventaire) {
        joueur.inventaire.forEach(invItem => {
            if (invItem.est_equipe && invItem.objets) {
                const type = invItem.objets.type_equipement;
                
                if (type === 'MAIN_DROITE') equipementMap.arme = invItem;
                else if (type === 'TETE') equipementMap.tete = invItem;
                else if (type === 'CORPS') equipementMap.corps = invItem;
                else if (type === 'PIEDS') equipementMap.bottes = invItem;
                else if (type === 'ACCESSOIRE_1') equipementMap.bague = invItem;
                else if (type === 'ACCESSOIRE_2') equipementMap.collier = invItem;
                // Gestion spéciale pour le Navire (soit type NAVIRE, soit catégorie Navire)
                else if (type === 'NAVIRE' || invItem.objets.categorie === 'Navire') equipementMap.navire = invItem;
            }
        });
    }

    // Info Prochain Navire
    let nextNavireData: any = null;
    let niveauNavireActuel = 1;
    if (equipementMap.navire) {
        const currentRef = allNavires.find(n => n.nom === equipementMap.navire.objets.nom);
        if (currentRef) niveauNavireActuel = currentRef.niveau;
    }
    const nextShipRef = allNavires.find(n => n.niveau === niveauNavireActuel + 1);
    if (nextShipRef) {
        nextNavireData = {
            niveau: nextShipRef.niveau,
            nom: nextShipRef.nom,
            cout_berrys: Number(nextShipRef.prix_berrys),
            listeMateriaux: nextShipRef.cout_items.map(cout => ({
                id: cout.objet.id, nom: cout.objet.nom, qte_requise: cout.quantite
            }))
        };
    }

    // --- 5. RETOUR DONNÉES ---
    return {
        ...joueur,
        pv_actuel: virtualPv,
        energie_actuelle: virtualEnergie, // On renvoie l'énergie calculée
        statsTotales: stats,
        
        max_energie: MAX_ENERGIE,
        next_energie_in_ms: timeUntilNextRegenMs, // Pour le chrono frontend
        
        equipement: equipementMap,
        nextNavire: nextNavireData
    };
  }

  async chooseFaction(userId: string, faction: string) {
    const validFactions = ['Pirate', 'Marine', 'Révolutionnaire'];
    if (!validFactions.includes(faction)) {
        throw new BadRequestException("Faction invalide.");
    }

    // Ici on update juste, le joueur a déjà été créé par getPlayerData
    await this.prisma.joueurs.update({
        where: { id: userId },
        data: { faction: faction }
    });

    return { success: true, message: `Vous avez rejoint les ${faction}s !` };
  }
  // ====================================================================
  // 🎁 FONCTION PRINCIPALE : OUVRIR COFFRE
  // ====================================================================

  async openChest(dto: OpenChestDto) {
    // 1. Récupération et Vérifications
    const item = await this.prisma.inventaire.findUnique({
        where: { id: dto.inventaireId },
        include: { objets: true }
    });

    if (!item || item.joueur_id !== dto.userId || item.objets.categorie !== 'Coffre') {
        throw new BadRequestException("Ceci n'est pas un coffre valide.");
    }

    // 2. DÉTECTION RARETÉ FIABLE (Via la colonne BDD, pas le nom)
    // item.objets.rarete est "Commun", "Rare", "Épique"...
    // On met en majuscule pour matcher les clés de LOOT_TABLES (COMMUN, RARE...)
    const chestRarityKey = item.objets.rarete.toUpperCase() as keyof typeof LOOT_TABLES;

    // Sécurité : Si la clé n'existe pas dans la table, fallback sur COMMUN
    if (!LOOT_TABLES[chestRarityKey]) {
        console.error(`❌ Erreur config loot: La rareté '${chestRarityKey}' n'existe pas dans LOOT_TABLES.`);
        throw new InternalServerErrorException("Configuration de loot invalide.");
    }

    let berrysGain: number = 0;
    const rewardItems: any[] = [];

    await this.prisma.$transaction(async (tx) => {
        // A. Générer le loot
        const loot = await this.generateLoot(chestRarityKey, tx);
        berrysGain = loot.berrys;
        const itemRewards = loot.items;

        // B. Supprimer/Décrémenter le coffre
        if ((item.quantite ?? 1) > 1) {
            await tx.inventaire.update({ where: { id: item.id }, data: { quantite: { decrement: 1 } } });
        } else {
            await tx.inventaire.delete({ where: { id: item.id } });
        }

        // C. Donner l'argent
        await tx.joueurs.update({
            where: { id: dto.userId },
            data: { berrys: { increment: berrysGain } } 
        });

        // D. Donner les objets (et gérer le stacking)
        for (const reward of itemRewards) {
            const objet = reward.objet_data;
            const quantite = reward.quantite;

            // On vérifie si le joueur a déjà cet item pour l'empiler
            const existingItem = await tx.inventaire.findFirst({
                where: { joueur_id: dto.userId, objet_id: objet.id }
            });

            if (existingItem) {
                await tx.inventaire.update({
                    where: { id: existingItem.id },
                    data: { quantite: { increment: quantite } }
                });
            } else {
                await tx.inventaire.create({
                    data: {
                        joueur_id: dto.userId,
                        objet_id: objet.id,
                        quantite: quantite,
                        stats_perso: Prisma.DbNull // Pas de stats pour les ressources
                    }
                });
            }

            // Ajout au tableau de retour pour l'affichage
            rewardItems.push({
                nom: objet.nom,
                quantite: quantite,
                rarity: objet.rarete,
                image_url: objet.image_url,
                stats_perso: null
            });
        }
    });

    await this.clearCache(dto.userId);

    return {
        success: true,
        message: `Ouverture de ${item.objets.nom} réussie !`,
        gain_berrys: berrysGain,
        items: rewardItems
    };
}
// =================================================================
  // 🔢 CALCUL DU COÛT DES STATS (Paliers)
  // =================================================================
  private getStatCost(stat: string, valeurActuelle: number): number {
      // Cas spécial : La Vitalité coûte souvent toujours 1 point pour ne pas pénaliser les tanks.
      // Si tu veux que la vitalité coûte aussi plus cher (2 pour 1, etc.), supprime ces 3 lignes :
      if (stat === 'vitalite') {
          return 1; 
      }

      // PALIERS (Type Dofus/RPG Classique)
      if (valeurActuelle < 50) return 1;   // 0 à 49   : Coût 1
      if (valeurActuelle < 100) return 2;  // 50 à 99  : Coût 2
      if (valeurActuelle < 150) return 3;  // 100 à 149: Coût 3
      if (valeurActuelle < 200) return 4;  // 150 à 199: Coût 4
      return 5;                            // 200+     : Coût 5
  }

  // =================================================================
  // 📈 INVESTIR DES POINTS (Version Corrigée Paliers)
  // =================================================================
  async investStat(dto: InvestStatDto) {
    const joueur: any = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    
    if (!joueur) throw new BadRequestException("Joueur introuvable");

    const statsAutorisees = ['force', 'defense', 'vitalite', 'sagesse', 'chance', 'agilite', 'intelligence'];
    const statKey = dto.stat.toLowerCase();

    if (!statsAutorisees.includes(statKey)) {
        throw new BadRequestException(`Statistique invalide : ${dto.stat}`);
    }

    const valeurActuelle = Number(joueur[statKey] ?? 0);
    const nouvelleValeur = valeurActuelle + 1;

    // 1. CALCUL DU COÛT RÉEL
    const cout = this.getStatCost(statKey, valeurActuelle);

    // 2. VÉRIFICATION DU SOLDE (Correction du Bug)
    // On vérifie si on a assez de points pour payer LE COÛT (et pas juste > 0)
    if ((joueur.points_carac ?? 0) < cout) {
        throw new BadRequestException(`Pas assez de points ! Il faut ${cout} points pour augmenter la ${dto.stat} (Paliers).`);
    }

    const dataUpdate: any = {
        points_carac: { decrement: cout }, // 🔥 CORRECTION : On déduit le coût calculé (1, 2, 3...)
        [statKey]: nouvelleValeur
    };

    // Gestion Vitalité (Gain PV actuels pour "soigner" l'augmentation)
    if (statKey === 'vitalite') {
        dataUpdate.pv_actuel = { increment: 5 }; 
    }

    await this.prisma.joueurs.update({
      where: { id: dto.userId },
      data: dataUpdate
    });

    await this.clearCache(dto.userId);
    
    return { 
        success: true, 
        message: `+1 ${statKey.toUpperCase()} (Coût: ${cout} pts) -> Total: ${nouvelleValeur}` 
    };
  }
// =================================================================
  // 👑 GESTION DES TITRES
  // =================================================================
  async equipTitle(userId: string, titreNom: string | null) {
    // 1. Si on veut retirer le titre
    if (!titreNom) {
        await this.prisma.joueurs.update({
            where: { id: userId },
            data: { titre_actuel: null }
        });
        return { success: true, message: "Titre retiré." };
    }

    // 2. Vérifier que le joueur possède le titre
    // On cherche dans la table de liaison 'joueur_titres' liée à 'titres_ref'
    // Adaptez les noms des relations selon votre schema.prisma exact
    const titrePossede = await this.prisma.joueur_titres.findFirst({
        where: {
            joueur_id: userId,
            titres_ref: { // Relation vers la table de référence
                nom: titreNom
            }
        }
    });

    if (!titrePossede) {
        throw new BadRequestException(`Vous ne possédez pas le titre : ${titreNom}`);
    }

    // 3. Équiper le titre
    await this.prisma.joueurs.update({
        where: { id: userId },
        data: { titre_actuel: titreNom }
    });

    // 4. Nettoyer le cache pour que le profil se mette à jour
    await this.clearCache(userId);

    return { success: true, message: `Titre « ${titreNom} » équipé !` };
  }
// =================================================================
  // 🏪 ACHETER UN OBJET (SHOP)
  // =================================================================

  async buyItem(dto: { userId: string, objetId: number, quantite: number }) {
    
    // On utilise dto.userId, dto.objetId...
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    const objet = await this.prisma.objets.findUnique({ where: { id: dto.objetId } });

    if (!joueur || !objet) throw new BadRequestException("Données introuvables.");

    // 1. Vérification Prix
    const soldeJoueur = joueur.berrys || 0; 
    const coutTotal = (objet.prix_achat || 0) * dto.quantite;
    
    if (soldeJoueur < coutTotal) {
        throw new BadRequestException(`Pas assez de Berrys.`);
    }

    // 2. Vérification Inventaire Existant
    const existingItem = await this.prisma.inventaire.findFirst({
        where: { joueur_id: dto.userId, objet_id: dto.objetId }
    });

    // --- LOGIQUE DE RESTRICTION ---
    const type = objet.type_equipement || ''; 
    const categoriesEquipement = ['ARME', 'TETE', 'CORPS', 'BOTTES', 'BAGUE', 'COLLIER', 'NAVIRE'];

    if ((type === 'FRUIT' || type === 'FRUIT_DEMON') && existingItem) {
        throw new BadRequestException("Vous possédez déjà ce Fruit du Démon !");
    }

    if (categoriesEquipement.includes(type)) {
        if (dto.quantite > 1) {
            throw new BadRequestException("Les équipements doivent être achetés un par un.");
        }
    }

    // --- TRANSACTION ---
    await this.prisma.$transaction(async (tx) => {
        // A. Payer
        await tx.joueurs.update({
            where: { id: dto.userId },
            data: { 
                berrys: { decrement: coutTotal },
                berrys_depenses_shop: { increment: coutTotal }
            }
        });

        // B. Ajouter l'objet
        if (existingItem) {
            await tx.inventaire.update({
                where: { id: existingItem.id },
                data: { quantite: { increment: dto.quantite } }
            });
        } else {
            await tx.inventaire.create({
                data: {
                    joueur_id: dto.userId,
                    objet_id: dto.objetId,
                    quantite: dto.quantite,
                    est_equipe: false
                }
            });
        }
    });

    await this.clearCache(dto.userId);

    return { 
        success: true, 
        message: `Achat réussi : ${objet.nom}` 
    };
  }
// ====================================================================
  // ⚔️ GESTION DES ÉQUIPEMENTS (NOUVELLE VERSION)
  // ====================================================================

  async equipItem(dto: EquipItemDto) {
    // 1. Récupérer l'item d'inventaire ciblé
    const item = await this.prisma.inventaire.findUnique({
      where: { id: dto.inventaireId },
      include: { objets: true }
    });

    // 2. Vérifications de sécurité
    if (!item) throw new BadRequestException("Cet objet n'existe pas.");
    if (item.joueur_id !== dto.userId) throw new BadRequestException("Ceci n'est pas ton objet !");
    
    // Vérification : est-ce bien un équipement ?
    if (!item.objets.type_equipement) {
        throw new BadRequestException("Cet objet ne peut pas être équipé.");
    }

    const typeEmplacement = item.objets.type_equipement; // ex: 'MAIN_DROITE', 'TETE', 'PIEDS'

    // 3. TRANSACTION : Déséquiper l'ancien + Équipper le nouveau + Recalculer
    await this.prisma.$transaction(async (tx) => {
        
        // A. Déséquiper tout objet qui occupe le MÊME emplacement
        // On cherche dans l'inventaire du joueur tous les items équipés qui ont le même type_equipement
        const itemsEnConflit = await tx.inventaire.findMany({
            where: { 
                joueur_id: dto.userId, 
                est_equipe: true,
                objets: { type_equipement: typeEmplacement } // Le lien magique
            }
        });

        // On les désactive tous (normalement il n'y en a qu'un, mais on est prudent)
        for (const ancienItem of itemsEnConflit) {
            await tx.inventaire.update({
                where: { id: ancienItem.id },
                data: { est_equipe: false }
            });
        }

        // B. Activer le nouvel objet
        await tx.inventaire.update({
            where: { id: dto.inventaireId },
            data: { est_equipe: true }
        });

        // C. Mettre à jour les stats du joueur (Force, Agilité...)
        // On appelle la fonction de calcul (voir plus bas)
        await this.recalculatePlayerStats(tx, dto.userId);
    });

    await this.clearCache(dto.userId);
    return { success: true, message: `${item.objets.nom} équipé avec succès !` };
  }

// --- DÉSÉQUIPER (PAR SLOT) ---
  async unequipItem(dto: UnequipItemDto) {
    // 1. Mapping du nom "Frontend" vers le type "Base de données"
    let typeDB = '';
    switch (dto.slot) { // dto.slot vaut "Arme", "Tête"...
        case 'Arme': typeDB = 'MAIN_DROITE'; break;
        case 'Tête': typeDB = 'TETE'; break;
        case 'Corps': typeDB = 'CORPS'; break;
        case 'Bottes': typeDB = 'PIEDS'; break;
        case 'Bague': typeDB = 'ACCESSOIRE_1'; break;
        case 'Collier': typeDB = 'ACCESSOIRE_2'; break;
        case 'Navire': typeDB = 'NAVIRE'; break; // Ou vérifier la catégorie
        default: throw new BadRequestException(`Emplacement inconnu : ${dto.slot}`);
    }

    // 2. Trouver l'objet équipé dans ce slot pour ce joueur
    // On cherche un item qui est "est_equipe: true" ET qui a le bon "type_equipement"
    const itemEquipe = await this.prisma.inventaire.findFirst({
        where: {
            joueur_id: dto.userId,
            est_equipe: true,
            objets: {
                type_equipement: typeDB
            }
        }
    });

    if (!itemEquipe) {
        // C'est pas grave, ça veut dire qu'il n'y a rien à retirer
        return { success: true, message: "Rien à retirer ici." };
    }

    // 3. Transaction : Déséquiper et Recalculer
    await this.prisma.$transaction(async (tx) => {
        // A. Passer à false
        await tx.inventaire.update({
            where: { id: itemEquipe.id },
            data: { est_equipe: false }
        });

        // B. Recalculer les stats
        await this.recalculatePlayerStats(tx, dto.userId);
    });

    await this.clearCache(dto.userId);
    return { success: true, message: `${dto.slot} retiré.` };
  }

  // ------------------------------------------------------------------
  // 🧮 MOTEUR DE CALCUL DES STATS (INDISPENSABLE)
  // ------------------------------------------------------------------
  // 🔄 RECALCUL SÉCURISÉ (Ne touche PAS aux stats investies, juste aux PV)
  private async recalculatePlayerStats(tx: any, userId: string) {
      
      // 1. On récupère le joueur pour connaître sa vitalité de base (investie)
      const joueur = await tx.joueurs.findUnique({ 
          where: { id: userId },
          select: { vitalite: true, pv_max_base: true } 
      });

      if (!joueur) return;

      // 2. On récupère les items équipés pour le bonus Vitalité
      const stuffEquipe = await tx.inventaire.findMany({
          where: { joueur_id: userId, est_equipe: true },
          include: { objets: true }
      });

      let bonusVitalite = 0;

      for (const item of stuffEquipe) {
          // On regarde si l'objet donne de la vitalité
          const stats = (item.stats_perso && Object.keys(item.stats_perso).length > 0) 
              ? item.stats_perso 
              : item.objets.stats_bonus;

          if (stats) {
              const s = stats as any;
              // On gère le cas chiffre simple ou range {min, max}
              let val = 0;
              if (typeof s.vitalite === 'number') val = s.vitalite;
              else if (typeof s.vitalite === 'object' && s.vitalite?.min) val = Number(s.vitalite.min);
              
              bonusVitalite += val;
          }
      }

      // 3. Calcul du nouveau PV MAX
      // Formule : PV Base + ((Vitalité Base + Vitalité Equip) * 5)
      const totalVitalite = (joueur.vitalite ?? 0) + bonusVitalite;
      const nouveauxPvMax = (joueur.pv_max_base ?? 100) + (totalVitalite * 5);

      // 4. On met à jour UNIQUEMENT les PV MAX
      // On ne touche SURTOUT PAS à la Force, Agilité, etc.
      await tx.joueurs.update({
          where: { id: userId },
          data: {
              pv_max: nouveauxPvMax
          }
      });
  }

async sellItem(dto: SellItemDto) {
    // 1. Récupérer l'objet dans l'inventaire
    const item = await this.prisma.inventaire.findUnique({
      where: { id: dto.inventaireId },
      include: { objets: true }
    });

    // 2. Vérifications de base
    if (!item) throw new BadRequestException("Objet introuvable.");
    if (item.joueur_id !== dto.userId) throw new BadRequestException("Ce n'est pas ton objet.");

    // 🔥 CORRECTION ICI : On définit une valeur par défaut (1) si dto.quantite est vide
    const qteAVendre = dto.quantite ?? 1; 
    const qtePossedee = item.quantite ?? 1;

    if (qtePossedee < qteAVendre) {
        throw new BadRequestException(`Tu n'en as pas assez ! (Requis: ${qteAVendre}, Possédé: ${qtePossedee})`);
    }

    // 3. Calcul du gain (Prix d'achat divisé par 2)
    const prixUnitaire = Math.floor((item.objets.prix_achat ?? 0) / 2);
    const gainTotal = prixUnitaire * qteAVendre; // ✅ Maintenant c'est sûr, c'est un nombre

    if (gainTotal <= 0) throw new BadRequestException("Cet objet ne vaut rien.");

    // 4. TRANSACTION
    await this.prisma.$transaction(async (tx) => {
      
      // A. Créditer le joueur
      await tx.joueurs.update({
        where: { id: dto.userId },
        data: { berrys: { increment: gainTotal } }
      });

      // B. Gérer l'inventaire (Décrémenter ou Supprimer)
      // Si on vend tout ce qu'on a, on supprime la ligne
      if (qtePossedee === qteAVendre) {
        await tx.inventaire.delete({
          where: { id: item.id }
        });
      } else {
        // Sinon on décrémente
        await tx.inventaire.update({
          where: { id: item.id },
          data: { quantite: { decrement: qteAVendre } }
        });
      }
    });

    await this.clearCache(dto.userId);
    return { success: true, message: `Vendu pour ${gainTotal} Berrys !` };
  }

  
// =================================================================
  // ⚔️ DÉMARRAGE DU COMBAT (PVP FULL HP FIX)
  // =================================================================
  async startFight(dto: StartFightDto, isStory: boolean = false) {
    try {
        // 1. Nettoyage vieux combats
        const vieuxCombat = await this.prisma.combats.findFirst({
            where: { OR: [{ joueur_id: dto.userId }, { adversaire_id: dto.userId }], est_termine: false }
        });
        if (vieuxCombat) {
            await this.prisma.combats.update({
                where: { id: vieuxCombat.id },
                data: { est_termine: true, vainqueur_id: vieuxCombat.adversaire_id }
            });
        }

        // 2. Récupération des données (Attaquant + Défenseur)
        const attaquant: any = await this.getPlayerData(dto.userId);
        
        // On charge l'inventaire du défenseur pour calculer ses stats
        const defenseur = await this.prisma.joueurs.findUnique({ 
            where: { id: dto.targetId },
            include: { 
                inventaire: { 
                    where: { est_equipe: true }, 
                    include: { objets: true } 
                } 
            }
        });

        if (!attaquant || !defenseur) throw new BadRequestException("Combattant introuvable.");
        if (attaquant.id === defenseur.id) throw new BadRequestException("Tu ne peux pas te battre contre toi-même.");

        // 3. VÉRIFICATION DE L'ÉNERGIE ⚡
        const COUT_ENERGIE = isStory ? 0 : 1;
        const energieActuelle = attaquant.energie_actuelle ?? 10;

        if (energieActuelle < COUT_ENERGIE) {
             throw new BadRequestException(`Tu es épuisé ! Attends un peu (Energie: ${energieActuelle}/${attaquant.energie_max ?? 10}).`);
        }

        // 4. Vérification PV Attaquant
        const pvAtk = attaquant.pv_actuel ?? 100;
        if (pvAtk <= 0) throw new BadRequestException("Tu es K.O., soigne-toi d'abord !");

        // 5. Calcul des PV de l'Adversaire (PVP FAIR-PLAY)
        let pvAdversaireStart = 100;

        if (defenseur.is_bot) {
            if (defenseur.pv_max_base && defenseur.pv_max_base > 0) {
                pvAdversaireStart = defenseur.pv_max_base;
            } else {
                const niveauBot = defenseur.niveau ?? 1;
                pvAdversaireStart = 100 + (niveauBot * 50);
            }
        } else {
            // 🔥 ON CALCULE SES STATS MAX (Vitalité + Stuff)
            const statsDefenseur = this.calculatePlayerStats(defenseur);
            pvAdversaireStart = statsDefenseur.pv_max_total;
        }

        // 6. TRANSACTION ATOMIQUE
        const result = await this.prisma.$transaction(async (tx) => {
            
            // A. Déduction de l'énergie
            const wasFull = energieActuelle >= (attaquant.energie_max ?? 10);
            
            const updatedJoueur = await tx.joueurs.update({
                where: { id: dto.userId },
                data: { 
                    energie_actuelle: { decrement: COUT_ENERGIE },
                    last_energie_update: wasFull ? new Date() : undefined
                }
            });

            // B. Création du combat
            const combat = await tx.combats.create({
                data: {
                    joueur_id: attaquant.id,
                    adversaire_id: defenseur.id,
                    pv_joueur_actuel: pvAtk,
                    pv_adversaire_actuel: pvAdversaireStart, // FULL HP START
                    tour_numero: 1,
                    est_termine: false,
                    log_combat: []
                }
            });

            return { combat, updatedJoueur };
        });

        await this.clearCache(dto.userId);
        const statsAtk = attaquant.statsTotales;

        return {
            success: true,
            combat_id: result.combat.id,
            pv_moi: result.combat.pv_joueur_actuel,
            pv_moi_max: statsAtk.pv_max_total, 
            pv_adv: result.combat.pv_adversaire_actuel,
            pv_adv_max: pvAdversaireStart, 
            newEnergy: result.updatedJoueur.energie_actuelle, 
            message: `Le combat commence ! (-${COUT_ENERGIE} Énergie)`
        };

    } catch (error) {
        console.error("🔥 ERREUR START FIGHT:", error);
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException(error.message || "Erreur lancement combat");
    }
  }

  // =================================================================
  // ⚔️ JOUER UN TOUR (NOUVEAU SYSTÈME ELO PAR PALIERS)
  // =================================================================
  async playTurn(dto: PlayTurnDto) {
    const combat = await this.prisma.combats.findUnique({ where: { id: dto.combatId } });
    if (!combat || combat.est_termine) throw new BadRequestException("Combat terminé.");
    if (combat.joueur_id !== dto.userId) throw new BadRequestException("Ce n'est pas ton tour.");

    // 1. Charger l'attaquant AVEC son équipement
    const attaquant = await this.prisma.joueurs.findUnique({
        where: { id: combat.joueur_id! },
        include: {
            inventaire: { include: { objets: true } }, 
            equip_tete: true, equip_corps: true, equip_bottes: true,
            equip_bague: true, equip_collier: true
        }
    });

    // 2. Charger l'adversaire AVEC son équipement
    const adversaire = await this.prisma.joueurs.findUnique({ 
        where: { id: combat.adversaire_id! },
        include: {
            inventaire: { include: { objets: true } }
        }
    });

    if (!attaquant || !adversaire) throw new BadRequestException("Combattants introuvables.");

    const skill = await this.prisma.competences.findUnique({ where: { id: dto.skillId } });
    if (!skill) throw new BadRequestException("Compétence inconnue.");

    // =================================================================
    // 📊 CALCUL DES STATS (Inchangé)
    // =================================================================
    const statsAtk = this.calculatePlayerStats(attaquant);
    const statsAdv = this.calculatePlayerStats(adversaire);
    
    let forceBot = statsAdv.force;
    let defenseBot = statsAdv.defense;

    if (adversaire.is_bot) {
        const niv = adversaire.niveau ?? 1;
        if (forceBot < 5) forceBot = 10 + (niv * 4); 
        if (defenseBot < 5) defenseBot = 5 + (niv * 2);
    }

    // =================================================================
    // 🛡️ DÉTECTION SKILL (Inchangé)
    // =================================================================
    const armeEquipee = attaquant.inventaire.find(i => i.est_equipe && i.objets.type_equipement === 'MAIN_DROITE');
    const nomArme = (armeEquipee?.objets?.nom || "").toUpperCase();
    const nomSkill = skill.nom.toUpperCase();
    const typeSkill = (skill.type_degats || "").toUpperCase();

    const KW_SKILL_SWORD = ["COUPE", "ESTOCADE", "LAME", "SABRE", "CHASSEUR", "TOURBILLON", "CHANT", "TROIS", "KAMUSARI", "SLASH", "ZORO", "ONIGIRI"];
    const KW_ITEM_SWORD  = ["SABRE", "ÉPÉE", "EPEE", "KATANA", "LAME", "DAGUE", "COUTEAU", "YORU", "WADO", "KITETSU"];
    const KW_SKILL_GUN   = ["TIR", "BALLE", "RAFALE", "CANON", "SNIPER", "PLOMB", "EXPLOSIVE", "MOUSQUET", "PRÉCISION", "MITRAIL"];
    const KW_ITEM_GUN    = ["PISTOLET", "FUSIL", "LANCE", "CANON", "SNIPER", "MOUSQUET", "REVOLVER", "BAZOOKA", "ARC", "ARBALÈTE", "FLINGUE", "BASIQUE"];
    const FRUIT_TYPES    = ['FEU', 'GLACE', 'FOUDRE', 'ELASTIQUE', 'SPECIAL', 'MAGMA', 'LUMIERE', 'TENEBRES', 'GRAVITE', 'POISON', 'OP'];

    let skillCategory = 'PHYSIQUE';

    if (FRUIT_TYPES.includes(typeSkill)) skillCategory = 'FRUIT';
    else if (KW_SKILL_SWORD.some(k => nomSkill.includes(k))) {
        skillCategory = 'SABRE';
        if (!KW_ITEM_SWORD.some(k => nomArme.includes(k))) throw new BadRequestException(`🚫 Il te faut une Épée/Sabre pour utiliser "${skill.nom}" !`);
    }
    else if (typeSkill === 'DISTANCE' || KW_SKILL_GUN.some(k => nomSkill.includes(k))) {
        skillCategory = 'DISTANCE';
        if (!nomSkill.includes("PIERRE") && !KW_ITEM_GUN.some(k => nomArme.includes(k))) throw new BadRequestException(`🚫 Il te faut une Arme à distance pour utiliser "${skill.nom}" !`);
    }

    // =================================================================
    // 💥 CALCUL DÉGÂTS JOUEUR (Inchangé)
    // =================================================================
    let statUtilisee = statsAtk.force; 
    if (skillCategory === 'DISTANCE') statUtilisee = statsAtk.agilite;
    if (skillCategory === 'FRUIT') statUtilisee = statsAtk.intelligence * 1.5;

    const skillPower = skill.puissance ?? 10;
    let degatsJoueur = Math.floor( (statUtilisee + skillPower) * (0.9 + Math.random() * 0.2) ) - Math.floor(defenseBot / 2);
    if (degatsJoueur < 1) degatsJoueur = 1;

    const critChance = statsAtk.chance * 0.1;
    if (Math.random() * 100 < critChance) degatsJoueur = Math.floor(degatsJoueur * 1.5);

    let pvAdvRestant = (combat.pv_adversaire_actuel ?? 100) - degatsJoueur;
    if (pvAdvRestant < 0) pvAdvRestant = 0;

    const logJ = `Tu utilises ${skill.nom} et infliges ${degatsJoueur} dégâts !`;

    // -----------------------------------------------------------
    // 🏆 CALCULATEUR ELO PAR PALIERS (Custom Logic)
    // -----------------------------------------------------------
    const calculateEloCustom = (joueurElo: number, advElo: number, isVictory: boolean): number => {
        const diff = advElo - joueurElo; // Positif = Adv plus fort, Négatif = Adv plus faible

        if (isVictory) {
            // VICTOIRE (Gain)
            if (diff >= 301) return 50;  // David contre Goliath
            if (diff >= 201) return 30;
            if (diff >= 101) return 20;
            if (diff >= -100) return 15; // Équilibré (-100 à +100)
            if (diff >= -200) return 10; // Un peu plus faible
            if (diff >= -300) return 5;  // Beaucoup plus faible
            return 1;                    // Massacre de noob (diff < -301)
        } else {
            // DÉFAITE (Perte - Attention chiffre négatif)
            if (diff >= 301) return -5;  // Perdre contre un Titan (pardonnable)
            if (diff >= 201) return -5;
            if (diff >= 101) return -10;
            if (diff >= -100) return -15; // Équilibré (-100 à +100)
            if (diff >= -200) return -20; // Perdre contre plus faible
            if (diff >= -300) return -30; // Honteux
            return -50;                   // Très Honteux (diff < -301)
        }
    };

    // --- VICTOIRE DE L'ATTAQUANT (JOUEUR) ---
    if (pvAdvRestant <= 0) {
        const gainXp = 50 * (adversaire.niveau ?? 1);
        const gainBerrys = 100 * (adversaire.niveau ?? 1);
        
        let gainElo = 0;
        // En cas de victoire de l'attaquant, le défenseur perd 0 (Défense auto ne perd pas de LP)
        let perteEloAdv = 0; 

        if (!adversaire.is_bot) {
            gainElo = calculateEloCustom(attaquant.elo_pvp ?? 1000, adversaire.elo_pvp ?? 1000, true);
        }

        const { updateData, levelsGained, newLevel } = this.calculateLevelUp(attaquant, gainXp);

        updateData.berrys = { increment: gainBerrys };
        updateData.victoires = { increment: 1 };
        updateData.elo_pvp = { increment: gainElo };
        
        if (adversaire.is_bot) updateData.victoires_pve = { increment: 1 };
        else updateData.victoires_pvp = { increment: 1 };

        let finalLog = `VICTOIRE ! (+${gainElo} LP)`;
        if (levelsGained > 0) finalLog += ` NIVEAU UP ! (Niv ${newLevel})`;

        const transactionOps: any[] = [
            this.prisma.combats.update({
                where: { id: combat.id },
                data: { 
                    est_termine: true, 
                    pv_adversaire_actuel: 0, 
                    vainqueur_id: attaquant.id, 
                    log_combat: [...(combat.log_combat as any[]), logJ, finalLog] 
                }
            }),
            this.prisma.joueurs.update({
                where: { id: attaquant.id },
                data: updateData
            })
        ];

        if (!adversaire.is_bot) {
            transactionOps.push(
                this.prisma.joueurs.update({
                    where: { id: adversaire.id },
                    data: { 
                        // Le défenseur ne perd PAS de points en défense auto
                        defaites_pvp: { increment: 1 },
                        defaites: { increment: 1 }
                    }
                })
            );

            // Notification pour le défenseur (sans perte de LP)
            await this.notifyPlayer(
                adversaire.id,
                "⚔️ Défaite défensive",
                `Vous avez été attaqué par ${attaquant.pseudo} et vous avez perdu. Heureusement, grâce à la défense automatique, vous n'avez perdu aucun LP.`,
                "WARNING"
            );
        }

        await this.prisma.$transaction(transactionOps);
        await this.checkAndUnlockTitles(dto.userId);
        await this.clearCache(dto.userId);
        this.updateQuestProgress(dto.userId, 'ARENA_FIGHT', 1);

        return { 
            etat: 'VICTOIRE', 
            log_joueur: logJ, 
            log_ia: levelsGained > 0 ? `Niveau ${newLevel} atteint !` : "L'adversaire est K.O. !", 
            pv_adv: 0, 
            pv_moi: levelsGained > 0 ? updateData.pv_actuel : combat.pv_joueur_actuel, 
            gain_xp: gainXp, 
            gain_berrys: gainBerrys, 
            gain_elo: gainElo,
            newLevel: newLevel
        };
    }

    // =================================================================
    // 🤖 TOUR ADVERSAIRE (IA / DÉFENSE AUTO)
    // =================================================================
    let degatsIA = Math.floor( forceBot * (0.8 + Math.random() * 0.4) ) - Math.floor(statsAtk.defense / 3);
    if (degatsIA < 1) degatsIA = 1;

    let pvJoueurRestant = (combat.pv_joueur_actuel ?? 100) - degatsIA;
    if (pvJoueurRestant < 0) pvJoueurRestant = 0;

    const logIA = `${adversaire.pseudo} attaque et t'inflige ${degatsIA} dégâts !`;

    // --- DÉFAITE DE L'ATTAQUANT (JOUEUR) ---
    if (pvJoueurRestant <= 0) {
        const perteBerrys = Math.floor((attaquant.berrys || 0) * 0.50);
        const gainXpConsolation = 10;
        
        let perteElo = 0;   // Ce que l'attaquant perd (valeur négative)
        let gainEloAdv = 0; // Ce que le défenseur gagne

        if (!adversaire.is_bot) {
            // Calcul de la perte pour l'attaquant
            perteElo = calculateEloCustom(attaquant.elo_pvp ?? 1000, adversaire.elo_pvp ?? 1000, false);
            
            // Le défenseur gagne l'équivalent de la perte (en positif)
            gainEloAdv = Math.abs(perteElo); 
        }

        const { updateData, levelsGained, newLevel } = this.calculateLevelUp(attaquant, gainXpConsolation);

        updateData.defaites = { increment: 1 };
        updateData.pv_actuel = 0;
        updateData.berrys = { decrement: perteBerrys };
        updateData.elo_pvp = { increment: perteElo }; // Applique la perte
        
        if (adversaire.is_bot) updateData.defaites_pve = { increment: 1 };
        else updateData.defaites_pvp = { increment: 1 };

        let msgDefaite = `DÉFAITE... (${perteElo} LP). Tu perds ${perteBerrys.toLocaleString()} ฿.`;
        if (levelsGained > 0) msgDefaite += ` (Mais l'XP t'a endurci : NIVEAU ${newLevel} !)`;

        const transactionOpsDefaite: any[] = [
            this.prisma.combats.update({
                where: { id: combat.id },
                data: { 
                    est_termine: true, 
                    pv_adversaire_actuel: pvAdvRestant, 
                    pv_joueur_actuel: 0, 
                    vainqueur_id: adversaire.id, 
                    log_combat: [...(combat.log_combat as any[]), logJ, logIA, msgDefaite] 
                }
            }),
            this.prisma.joueurs.update({ 
                where: { id: attaquant.id }, 
                data: updateData 
            })
        ];

        if (!adversaire.is_bot) {
            transactionOpsDefaite.push(
                this.prisma.joueurs.update({
                    where: { id: adversaire.id },
                    data: { 
                        elo_pvp: { increment: gainEloAdv }, // Le défenseur GAGNE des points
                        victoires_pvp: { increment: 1 },
                        victoires: { increment: 1 }
                    }
                })
            );

            // Notification pour le défenseur (Victoire)
            await this.notifyPlayer(
                adversaire.id,
                "🛡️ Défense réussie !",
                `Votre personnage a repoussé une attaque de ${attaquant.pseudo} pendant votre absence ! Vous gagnez +${gainEloAdv} LP !`,
                "SUCCESS"
            );
        }

        await this.prisma.$transaction(transactionOpsDefaite);
        await this.checkAndUnlockTitles(dto.userId);
        await this.clearCache(dto.userId);
        this.updateQuestProgress(dto.userId, 'ARENA_FIGHT', 1);

        return { 
            etat: 'DEFAITE', 
            log_joueur: logJ, 
            log_ia: logIA + " " + msgDefaite, 
            pv_adv: pvAdvRestant, 
            pv_moi: 0 
        };
    }

    // --- CONTINUER ---
    await this.prisma.combats.update({
        where: { id: combat.id },
        data: { 
            pv_adversaire_actuel: pvAdvRestant, 
            pv_joueur_actuel: pvJoueurRestant, 
            tour_numero: { increment: 1 }, 
            log_combat: [...(combat.log_combat as any[]), logJ, logIA] 
        }
    });
    
    await this.prisma.joueurs.update({ where: { id: attaquant.id }, data: { pv_actuel: pvJoueurRestant } });
    await this.clearCache(dto.userId);

    return { etat: 'EN_COURS', log_joueur: logJ, log_ia: logIA, pv_adv: pvAdvRestant, pv_moi: pvJoueurRestant };
  }

// =================================================================
  // 🎰 CASINO : DÉS, PFC, QUITTE OU DOUBLE
  // =================================================================
  async playCasino(dto: PlayCasinoDto) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    if (!joueur) throw new BadRequestException("Joueur inconnu.");

    const now = new Date();
    const COOLDOWN = 5 * 60 * 1000; // 5 minutes

    // --- 1. JEU DE DÉS (One shot) ---
    if (dto.jeu === 'DES') {
        if (joueur.last_play_des && (now.getTime() - joueur.last_play_des.getTime() < COOLDOWN)) {
            throw new BadRequestException("Attends un peu avant de relancer les dés !");
        }
        if ((joueur.berrys ?? 0) < dto.mise) throw new BadRequestException("Pas assez de Berrys.");

        const resultat = Math.floor(Math.random() * 6) + 1;
        const victoires = resultat >= 4;
        const gain = victoires ? dto.mise * 2 : 0;

        await this.prisma.joueurs.update({
            where: { id: dto.userId },
            data: {
                berrys: victoires ? { increment: dto.mise } : { decrement: dto.mise },
                last_play_des: now, // ICI C'EST OK : Le jeu est fini tout de suite
                berrys_mises_casino: { increment: dto.mise }
            }
        });
        await this.clearCache(dto.userId);
        this.updateQuestProgress(dto.userId, 'CASINO_PLAY', 1);
        return { success: victoires, gain: gain, message: victoires ? `Gagné ! (Dés : ${resultat})` : `Perdu... (Dés : ${resultat})` };
    }

    // --- 2. PIERRE FEUILLE CISEAUX (One shot) ---
    if (dto.jeu === 'PFC') {
        if (joueur.last_play_pfc && (now.getTime() - joueur.last_play_pfc.getTime() < COOLDOWN)) {
            throw new BadRequestException("Cooldown PFC actif !");
        }
        if ((joueur.berrys ?? 0) < dto.mise) throw new BadRequestException("Pas assez de Berrys.");

        const choixPossibles = ['PIERRE', 'FEUILLE', 'CISEAUX'];
        const botChoix = choixPossibles[Math.floor(Math.random() * 3)];
        const userChoix = dto.choix?.toUpperCase();

        if (!choixPossibles.includes(userChoix || '')) throw new BadRequestException("Choix invalide.");

        let issue = 'PERDU';
        if (userChoix === botChoix) issue = 'EGALITE';
        else if (
            (userChoix === 'PIERRE' && botChoix === 'CISEAUX') ||
            (userChoix === 'FEUILLE' && botChoix === 'PIERRE') ||
            (userChoix === 'CISEAUX' && botChoix === 'FEUILLE')
        ) issue = 'GAGNE';

        let gain = 0;
        let updateData: any = { 
            last_play_pfc: now, // ICI C'EST OK : Le jeu est fini tout de suite
            berrys_mises_casino: { increment: dto.mise } 
        };

        if (issue === 'GAGNE') {
            gain = dto.mise * 2;
            updateData.berrys = { increment: dto.mise };
        } else if (issue === 'PERDU') {
            updateData.berrys = { decrement: dto.mise };
        }

        await this.prisma.joueurs.update({ where: { id: dto.userId }, data: updateData });
        await this.clearCache(dto.userId);
        this.updateQuestProgress(dto.userId, 'CASINO_PLAY', 1);
        return { success: issue === 'GAGNE', gain: gain, message: `Bot: ${botChoix}. ${issue} !` };
    }

    // --- 3. QUITTE OU DOUBLE (Logique Streak) ---
    if (dto.jeu === 'QUITTE') {
        const currentStreak = joueur.casino_streak ?? 0;

        // A. CAS : STOP (J'encaisse)
        if (dto.choix === 'STOP') {
            if (currentStreak === 0) throw new BadRequestException("Rien à encaisser.");
            
            const gainFinal = dto.mise * Math.pow(2, currentStreak);

            await this.prisma.joueurs.update({
                where: { id: dto.userId },
                data: {
                    berrys: { increment: gainFinal },
                    casino_streak: 0,
                    last_play_quitte: now // ✅ ON ENCAISSE -> FIN DE PARTIE -> COOLDOWN
                }
            });
            await this.clearCache(dto.userId);
            this.updateQuestProgress(dto.userId, 'CASINO_PLAY', 1); // Compte comme 1 jeu fini
            return { success: true, gain_final: gainFinal, message: `Encaissé : ${gainFinal} Berrys !` };
        }

        // B. CAS : JOUER (Premier tour ou Suivant)
        
        // Si c'est le tout premier tour (Streak 0), on vérifie le cooldown et on paye
        if (currentStreak === 0) {
            if (joueur.last_play_quitte && (now.getTime() - joueur.last_play_quitte.getTime() < COOLDOWN)) {
                throw new BadRequestException("Attends un peu avant de rejouer au Quitte ou Double !");
            }
            if ((joueur.berrys ?? 0) < dto.mise) throw new BadRequestException("Pas assez de Berrys.");
            
            // On paye l'entrée
            await this.prisma.joueurs.update({ 
                where: { id: dto.userId }, 
                data: { berrys: { decrement: dto.mise }, berrys_mises_casino: { increment: dto.mise } } 
            });
        }

        // Tirage (50/50)
        const chance = Math.random();
        const win = chance > 0.5;

        if (win) {
            // ✅ VICTOIRE : On augmente juste le streak. 
            // ⚠️ IMPORTANT : ON NE MET PAS A JOUR last_play_quitte ICI !
            // Le joueur doit pouvoir rejouer tout de suite.
            await this.prisma.joueurs.update({
                where: { id: dto.userId },
                data: { casino_streak: { increment: 1 } }
            });
            
            const nouveauPot = dto.mise * Math.pow(2, currentStreak + 1);
            return { success: true, nouveau_gain: nouveauPot, message: `Bravo ! Pot actuel : ${nouveauPot}` };
        } else {
            // ❌ DÉFAITE : Fin de partie
            await this.prisma.joueurs.update({
                where: { id: dto.userId },
                data: { 
                    casino_streak: 0, 
                    last_play_quitte: now, // ✅ PERDU -> FIN DE PARTIE -> COOLDOWN
                    a_tout_perdu_casino: true 
                }
            });
            await this.clearCache(dto.userId);
            this.updateQuestProgress(dto.userId, 'CASINO_PLAY', 1);
            
            // On vérifie le titre "Malchanceux"
            await this.checkAndUnlockTitles(dto.userId);
            
            return { success: false, gain: 0, message: "Perdu... Tout est parti." };
        }
    }

    throw new BadRequestException("Jeu inconnu");
  }
  // =================================================================
  // 🏳️ FUIR LE COMBAT (Correction TypeScript)
  // =================================================================
  async fleeCombat(dto: { userId: string, combatId: string }) {
    const combat = await this.prisma.combats.findUnique({ where: { id: dto.combatId } });
    
    // On vérifie si le combat existe
    if (!combat || combat.est_termine) return { message: "Combat déjà terminé." };
    if (combat.joueur_id !== dto.userId) throw new BadRequestException("Ce n'est pas ton combat.");

    // 1. On termine le combat (Défaite par abandon)
    await this.prisma.combats.update({
        where: { id: combat.id },
        data: { 
            est_termine: true, 
            vainqueur_id: combat.adversaire_id,
            log_combat: [...(combat.log_combat as any[]), "Le joueur a pris la fuite !"]
        }
    });

    // 2. On applique la pénalité au joueur
    await this.prisma.joueurs.update({
        where: { id: dto.userId },
        data: { 
            defaites: { increment: 1 },
            // 👇 CORRECTION ICI : (combat.pv_joueur_actuel ?? 0)
            pv_actuel: Math.floor((combat.pv_joueur_actuel ?? 0) / 2) 
        }
    });

    await this.clearCache(dto.userId);
    return { success: true, message: "Tu as pris la fuite (Honteux...)" };
  }

// =================================================================
  // 🌦️ SYSTÈME MÉTÉO DYNAMIQUE (Cycle de 2h)
  // =================================================================
  
  // Liste des conditions possibles
  private readonly WEATHER_TYPES = [
      { id: 'CLEAR', nom: 'Grand Soleil', icon: '☀️', description: 'Mer calme, navigation optimale.', bonus_vitesse: 1.0 },
      { id: 'WINDY', nom: 'Vents Favorables', icon: '💨', description: 'Le vent souffle fort !', bonus_vitesse: 0.8 }, // -20% temps trajet
      { id: 'CLOUDY', nom: 'Ciel Couvert', icon: '☁️', description: 'Temps maussade.', bonus_vitesse: 1.0 },
      { id: 'RAIN', nom: 'Pluie Battante', icon: '🌧️', description: 'Visibilité réduite.', bonus_vitesse: 1.1 }, // +10% temps
      { id: 'STORM', nom: 'Tempête', icon: '⛈️', description: 'La mer est déchaînée !', bonus_vitesse: 1.3 }, // +30% temps
      { id: 'FOG', nom: 'Brume Épaisse', icon: '🌫️', description: 'Attention aux récifs.', bonus_vitesse: 1.2 },
      { id: 'HEAT', nom: 'Canicule', icon: '🥵', description: 'Chaleur écrasante.', bonus_vitesse: 1.05 }
  ];

  async getMeteo() {
      // 1. Calcul du "Bloc Temps" de 2 heures
      const DUREE_BLOC = 2 * 60 * 60 * 1000; // 2 heures en ms
      const timestamp = new Date().getTime();
      const blockIndex = Math.floor(timestamp / DUREE_BLOC);

      // 2. Génération pseudo-aléatoire stable basée sur le blockIndex
      // Cela garantit que tous les joueurs ont la même météo au même moment
      const seed = blockIndex * 9301 + 49297;
      const random = (seed % 233280) / 233280.0;

      // 3. Sélection de la météo
      const weatherIndex = Math.floor(random * this.WEATHER_TYPES.length);
      const currentMeteo = this.WEATHER_TYPES[weatherIndex];

      // 4. Calcul du temps restant avant le changement
      const nextChange = (blockIndex + 1) * DUREE_BLOC;
      const msRestantes = nextChange - timestamp;

      return {
          ...currentMeteo,
          nextUpdate: new Date(nextChange),
          msBeforeUpdate: msRestantes
      };
  }

// =================================================================
  // ⚔️ LANCER UN COMBAT D'HISTOIRE (Par Nom du Bot)
  // =================================================================
async startStoryFight(userId: string, targetName: string) {
      const bot = await this.prisma.joueurs.findFirst({ 
          where: { pseudo: targetName, is_bot: true } 
      });
      
      if (!bot) {
          throw new BadRequestException(`Ennemi '${targetName}' introuvable.`);
      }
      
      // 👇 AJOUT : on passe true pour dire "C'est l'histoire, c'est gratuit"
      return this.startFight({ userId: userId, targetId: bot.id }, true);
  }

// =================================================================
  // 🔨 CRAFTER UN OBJET (Avec vérification de niveau)
  // =================================================================
  async craftItem(dto: CraftDto) {
    try { 
        if (!dto.recetteId) {
            throw new BadRequestException("L'ID de la recette est manquant.");
        }

        // 1. Récupérer la recette + ingrédients + résultat
        const recette = await this.prisma.recettes.findUnique({ 
            where: { id: dto.recetteId },
            include: {
                objet_resultat: true, 
                ingredients: { include: { objet: true } }
            }
        });

        // 2. Récupérer le joueur
        const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });

        if (!recette || !joueur) throw new BadRequestException("Recette ou joueur introuvable.");
        if (!recette.objet_resultat) throw new BadRequestException("Recette invalide (pas de résultat).");
        if (!recette.ingredients || recette.ingredients.length === 0) throw new BadRequestException("Recette vide.");

        // 🔥 VÉRIFICATION DU NIVEAU REQUIS 🔥
        const niveauRequis = recette.niveau_requis || 1;
        if ((joueur.niveau || 1) < niveauRequis) {
            throw new BadRequestException(`Niveau insuffisant ! Il faut être niveau ${niveauRequis} pour fabriquer ceci.`);
        }

        const itemResultat = recette.objet_resultat;

        // 3. Logique Unique Instance (Équipements)
        const hasBonusStats = itemResultat.stats_bonus && typeof itemResultat.stats_bonus === 'object' && Object.keys(itemResultat.stats_bonus).length > 0;
        const isUniqueInstance = hasBonusStats || itemResultat.categorie === 'Équipement'; 
        
        const statsRoulees = isUniqueInstance ? this.calculateRandomStats(itemResultat.stats_bonus as any) : null;

        // 4. TRANSACTION ATOMIQUE (Vérification Stock + Consommation + Création)
        await this.prisma.$transaction(async (tx) => {
            
            // A. Vérification et Consommation des ingrédients
            for (const ingredientRequis of recette.ingredients) {
                const idIngred = ingredientRequis.objet_ingredient_id;
                const qteRequise = ingredientRequis.quantite;

                const itemEnSac = await tx.inventaire.findFirst({
                    where: { joueur_id: dto.userId, objet_id: idIngred }
                });

                const qteEnSac = itemEnSac?.quantite ?? 0;

                if (qteEnSac < qteRequise) {
                    throw new BadRequestException(`Il te manque : ${ingredientRequis.objet.nom} (Requis: ${qteRequise}, Possédé: ${qteEnSac})`);
                }

                // Consommation
                if (itemEnSac!.quantite === qteRequise) {
                    await tx.inventaire.delete({ where: { id: itemEnSac!.id } });
                } else {
                    await tx.inventaire.update({
                        where: { id: itemEnSac!.id },
                        data: { quantite: { decrement: qteRequise } }
                    });
                }
            }

            // B. Création du résultat
            if (isUniqueInstance) {
                // Nouvel objet unique
                await tx.inventaire.create({
                    data: {
                        joueur_id: dto.userId,
                        objet_id: itemResultat.id, 
                        quantite: 1,
                        stats_perso: statsRoulees as any
                    }
                });
            } else {
                // Stackable : On essaie d'empiler
                const existingStack = await tx.inventaire.findFirst({
                    where: { joueur_id: dto.userId, objet_id: itemResultat.id }
                });

                if (existingStack) {
                    await tx.inventaire.update({
                        where: { id: existingStack.id },
                        data: { quantite: { increment: 1 } }
                    });
                } else {
                    await tx.inventaire.create({
                        data: { joueur_id: dto.userId, objet_id: itemResultat.id, quantite: 1 }
                    });
                }
            }
            
            // C. Gain d'XP (Optionnel mais recommandé)
            if (recette.xp_craft > 0) {
                await tx.joueurs.update({
                    where: { id: dto.userId },
                    data: { xp: { increment: recette.xp_craft } } // Attention à gérer le Level Up ici si vous voulez faire propre, ou laisser l'XP monter
                });
            }
        });

        // 5. Retour
        // On renvoie les nouvelles données pour mettre à jour l'interface
        const joueurMisAJour = await this.getPlayerData(dto.userId); 
        
        return { 
            success: true, 
            message: `Craft réussi : ${itemResultat.nom} ! (+${recette.xp_craft} XP)`,
            playerData: joueurMisAJour 
        };

    } catch (error) {
        if (error instanceof BadRequestException) throw error;
        console.error("ERREUR CRAFT:", error); 
        throw new BadRequestException(`Impossible de fabriquer l'objet. ${error.message || ''}`);
    }
  }

  // 2. MODIFIER LE DECK (ÉQUIPER)
  async updateDeck(dto: EquipDeckDto) {
    // Vérif : Taille du deck
    if (dto.skillIds.length > 5) {
        throw new BadRequestException("Un deck ne peut contenir que 5 compétences maximum !");
    }

    // Vérif : Est-ce qu'il possède bien TOUS ces sorts ?
    // On compte combien de ces sorts il possède dans la table de liaison
    const count = await this.prisma.joueur_competences.count({
        where: {
            joueur_id: dto.userId,
            competence_id: { in: dto.skillIds } // Filtre : ID est dans la liste envoyée
        }
    });

    // Si le joueur envoie [1, 2] mais ne possède que le 1, le count sera 1, donc différent de length (2).
    if (count !== dto.skillIds.length) {
        throw new BadRequestException("Tu essaies d'équiper une compétence que tu ne possèdes pas !");
    }

    // Mise à jour (Prisma gère les tableaux PostgreSQL nativement)
    await this.prisma.joueurs.update({
        where: { id: dto.userId },
        data: {
            deck_combat: dto.skillIds // On remplace directement le tableau
        }
    });
    await this.clearCache(dto.userId);
    return { success: true, message: "Deck de combat mis à jour." };
  }

  // 1. METTRE EN VENTE
  async listOnMarket(dto: MarketSellDto) {
    if (dto.prix <= 0) throw new BadRequestException("Le prix doit être positif.");

    const item = await this.prisma.inventaire.findUnique({
        where: { id: dto.inventaireId },
        include: { objets: true }
    });

    if (!item) throw new BadRequestException("Objet introuvable.");
    if (item.joueur_id !== dto.userId) throw new BadRequestException("Ce n'est pas ton objet.");
    
    const qteDispo = item.quantite ?? 1;
    if (qteDispo < dto.quantite) throw new BadRequestException("Pas assez de quantité.");

    await this.prisma.$transaction(async (tx) => {
        // A. Retirer de l'inventaire
        if (qteDispo === dto.quantite) {
            await tx.inventaire.delete({ where: { id: item.id } });
        } else {
            await tx.inventaire.update({
                where: { id: item.id },
                data: { quantite: { decrement: dto.quantite } }
            });
        }

        // B. Créer l'annonce
        await tx.marche.create({
            data: {
                vendeur_id: dto.userId,
                objet_id: item.objet_id,
                quantite: dto.quantite,
                prix_unitaire: dto.prix,
                
                // 👇 AJOUTE CETTE LIGNE 👇
                stats_perso: item.stats_perso ?? undefined, 
                // -----------------------
            }
        });
    });

    return { success: true, message: "Objet mis en vente au marché !" };
  }

// 2. ACHETER AU MARCHÉ
  async buyFromMarket(dto: MarketBuyDto) {
    // Récupérer l'annonce (+ les infos de l'objet pour la notif)
    const annonce = await this.prisma.marche.findUnique({ 
        where: { id: dto.marketId },
        include: { objets: true } // 👈 AJOUT: Pour récupérer le nom de l'item
    });
    if (!annonce) throw new BadRequestException("Cette offre n'existe plus.");

    // Récupérer l'acheteur
    const acheteur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    if (!acheteur) throw new BadRequestException("Acheteur inconnu.");

    if (annonce.vendeur_id === dto.userId) throw new BadRequestException("Tu ne peux pas acheter ton propre objet.");
    
    const prixTotal = annonce.prix_unitaire ?? 0; 
    
    if ((acheteur.berrys ?? 0) < prixTotal) throw new BadRequestException(`Pas assez de Berrys (Prix: ${prixTotal})`);

    const vendeurId = annonce.vendeur_id ?? "";
    const objetId = annonce.objet_id ?? 0;

    // Transaction BDD
    await this.prisma.$transaction(async (tx) => {
        
        // A. Gérer l'argent
        await tx.joueurs.update({
            where: { id: acheteur.id },
            data: { berrys: { decrement: prixTotal } }
        });
        
        // Crédit vendeur
        if (vendeurId) {
            await tx.joueurs.update({
                where: { id: vendeurId },
                data: { berrys: { increment: prixTotal } }
            });
        }

        // B. Gérer l'objet
        const itemExist = await tx.inventaire.findFirst({
            where: { joueur_id: acheteur.id, objet_id: objetId }
        });

        if (itemExist) {
            await tx.inventaire.update({
                where: { id: itemExist.id },
                data: { quantite: { increment: (annonce.quantite ?? 1) } }
            });
        } else {
            await tx.inventaire.create({
                data: {
                    joueur_id: acheteur.id,
                    objet_id: objetId,
                    quantite: (annonce.quantite ?? 1)
                }
            });
        }

        // C. Supprimer l'annonce
        await tx.marche.delete({ where: { id: annonce.id } });
    });

    // 👇 AJOUT NOTIFICATION VENDEUR 👇
    if (vendeurId) {
        const nomObjet = annonce.objets ? annonce.objets.nom : "Objet inconnu";
        await this.notifyPlayer(
            vendeurId,
            "💰 Vente réussie !",
            `Ton offre pour ${annonce.quantite}x ${nomObjet} a été achetée par ${acheteur.pseudo}. Tu as reçu ${prixTotal} Berrys.`,
            "SUCCESS"
        );
    }

    await this.clearCache(dto.userId);
    return { success: true, message: "Achat réussi ! L'objet est dans ton sac." };
  }
  
// =================================================================
  // 📢 HELPER PRIVÉ : Notifier tout un équipage
  // =================================================================
  private async notifyCrew(crewId: string, titre: string, message: string, type: string = 'INFO') {
      const membres = await this.prisma.joueurs.findMany({ 
          where: { equipage_id: crewId },
          select: { id: true }
      });
      
      // On prépare les données pour une insertion de masse (plus performant)
      const data = membres.map(m => ({
          joueur_id: m.id,
          titre,
          message,
          type,
          lu: false
      }));

      if (data.length > 0) {
          await this.prisma.notifications.createMany({ data });
      }
  }

  // =================================================================
  // 1. CRÉER UN ÉQUIPAGE
  // =================================================================
  async createCrew(dto: CreateCrewDto) {
    if (dto.nom.length < 3) throw new BadRequestException("Nom trop court.");

    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    if (!joueur) throw new BadRequestException("Joueur introuvable.");

    if (joueur.equipage_id) throw new BadRequestException("Tu as déjà un équipage !");
    
    const COUT_CREATION = 100000000;
    if ((joueur.berrys ?? 0) < COUT_CREATION) throw new BadRequestException(`Il faut ${COUT_CREATION} Berrys.`);

    const exists = await this.prisma.equipages.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new BadRequestException("Ce nom d'équipage est déjà pris.");

    const faction = joueur.faction || "Pirate";

    await this.prisma.$transaction(async (tx) => {
        const crew = await tx.equipages.create({
            data: {
                nom: dto.nom,
                description: dto.description || "Un nouvel équipage.",
                chef_id: dto.userId,
                faction: faction,
                berrys_banque: 0 
            }
        });

        await tx.joueurs.update({
            where: { id: dto.userId },
            data: {
                equipage_id: crew.id,
                berrys: { decrement: COUT_CREATION }
            }
        });
    });

    return { success: true, message: `L'équipage ${dto.nom} est né !` };
  }

  // =================================================================
  // 2. QUITTER L'ÉQUIPAGE (CORRIGÉ)
  // =================================================================
  async leaveCrew(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur || !joueur.equipage_id) throw new BadRequestException("Tu es un loup solitaire.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: joueur.equipage_id } });
    
    if (!crew) {
         await this.prisma.joueurs.update({ where: { id: userId }, data: { equipage_id: null } });
         return { success: true, message: "Tu as quitté un équipage fantôme." };
    }

    // Si c'est le capitaine -> Dissolution
    if (crew.chef_id === userId) {
        await this.prisma.$transaction([
            this.prisma.joueurs.updateMany({
                where: { equipage_id: crew.id },
                data: { equipage_id: null }
            }),
            this.prisma.equipages.delete({ where: { id: crew.id } })
        ]);
        return { success: true, message: "L'équipage a été dissous." };
    }

    // Sinon -> Juste partir
    await this.prisma.joueurs.update({
        where: { id: userId },
        data: { equipage_id: null }
    });

    // 👇 OPTIONNEL : On peut prévenir le chef qu'un membre est parti
    // ✅ CORRECTION : On vérifie que chef_id existe avant d'envoyer
    if (crew.chef_id) {
        await this.notifyPlayer(crew.chef_id, "Départ", `${joueur.pseudo} a quitté l'équipage.`, "WARNING");
    }

    return { success: true, message: "Tu as quitté l'équipage." };
  }

  // =================================================================
  // 3. GESTION BANQUE (Inchangé)
  // =================================================================
  async manageBank(dto: CrewBankDto) {
    if (dto.montant <= 0) throw new BadRequestException("Montant invalide.");

    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    if (!joueur || !joueur.equipage_id) throw new BadRequestException("Sans équipage, pas de banque.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: joueur.equipage_id } });
    if (!crew) throw new BadRequestException("Équipage introuvable.");

    // DÉPÔT
    if (dto.action === 'DEPOSER') {
        if ((joueur.berrys ?? 0) < dto.montant) throw new BadRequestException("Tu n'as pas assez d'argent.");
        
        await this.prisma.$transaction([
            this.prisma.joueurs.update({ 
                where: { id: dto.userId }, 
                data: { berrys: { decrement: dto.montant } } 
            }),
            this.prisma.equipages.update({ 
                where: { id: crew.id }, 
                data: { berrys_banque: { increment: dto.montant } } 
            }),
            this.prisma.banque_logs.create({
                data: {
                    equipage_id: crew.id,
                    pseudo_joueur: joueur.pseudo || "Inconnu",
                    action: 'DEPOT',
                    montant: dto.montant,
                    date_log: new Date()
                }
            })
        ]);
        return { success: true, message: `Dépôt de ${dto.montant} B effectué.` };
    }

    // RETRAIT
    if (dto.action === 'RETIRER') {
        if (crew.chef_id !== dto.userId) throw new BadRequestException("Seul le Capitaine peut retirer des fonds.");
        
        const soldeBanque = Number(crew.berrys_banque ?? 0n);
        
        if (soldeBanque < dto.montant) throw new BadRequestException("La banque est vide !");

        await this.prisma.$transaction([
            this.prisma.equipages.update({ 
                where: { id: crew.id }, 
                data: { berrys_banque: { decrement: dto.montant } } 
            }),
            this.prisma.joueurs.update({ 
                where: { id: dto.userId }, 
                data: { berrys: { increment: dto.montant } } 
            }),
            this.prisma.banque_logs.create({
                data: {
                    equipage_id: crew.id,
                    pseudo_joueur: joueur.pseudo || "Inconnu",
                    action: 'RETRAIT',
                    montant: dto.montant,
                    date_log: new Date()
                }
            })
        ]);
        return { success: true, message: `Retrait de ${dto.montant} B effectué.` };
    }
  }

  // =================================================================
  // 4. REJOINDRE ÉQUIPAGE (DEMANDE)
  // =================================================================
  async joinCrew(dto: JoinCrewDto) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    if (!joueur) throw new BadRequestException("Joueur introuvable.");
    
    if (joueur.equipage_id) throw new BadRequestException("Tu as déjà un équipage ! Quitte-le d'abord.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: dto.crewId } });
    if (!crew) throw new BadRequestException("Cet équipage n'existe pas.");

    if (crew.faction !== joueur.faction) throw new BadRequestException(`Tu es ${joueur.faction}, cet équipage est ${crew.faction}.`);

    const existingDemand = await this.prisma.demandes_adhesion.findFirst({
        where: { equipage_id: dto.crewId, joueur_id: dto.userId }
    });
    if (existingDemand) throw new BadRequestException("Tu as déjà postulé ici.");

    await this.prisma.demandes_adhesion.create({
        data: {
            equipage_id: dto.crewId,
            joueur_id: dto.userId,
            pseudo_joueur: joueur.pseudo || "Inconnu",
            date_demande: new Date()
        }
    });

    // 👇 NOTIFICATION 1: AU CHEF UNIQUEMENT
    if (crew.chef_id) {
        await this.notifyPlayer(
            crew.chef_id, 
            "📜 Candidature", 
            `${joueur.pseudo} souhaite rejoindre votre équipage.`, 
            "INFO"
        );
    }

    return { success: true, message: "Candidature envoyée au capitaine !" };
  }

  // =================================================================
  // 5. GÉRER CANDIDATURE (Accepter / Refuser)
  // =================================================================
  async manageApplication(dto: RecruitDto) {
    const demande = await this.prisma.demandes_adhesion.findUnique({ where: { id: dto.applicationId } });
    if (!demande) throw new BadRequestException("Candidature introuvable.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: demande.equipage_id! } });
    if (!crew) throw new BadRequestException("Équipage introuvable.");
    if (crew.chef_id !== dto.userId) throw new BadRequestException("Tu n'es pas le capitaine.");

    // CAS 1 : REFUSER
    if (!dto.accept) {
        await this.prisma.demandes_adhesion.delete({ where: { id: dto.applicationId } });
        return { success: true, message: "Candidature refusée." };
    }

    // CAS 2 : ACCEPTER
    const candidat = await this.prisma.joueurs.findUnique({ where: { id: demande.joueur_id! } });
    if (!candidat) throw new BadRequestException("Le joueur n'existe plus.");
    if (candidat.equipage_id) {
        await this.prisma.demandes_adhesion.delete({ where: { id: dto.applicationId } });
        throw new BadRequestException("Ce joueur a déjà rejoint un autre équipage.");
    }

    await this.prisma.$transaction([
        this.prisma.joueurs.update({
            where: { id: candidat.id },
            data: { equipage_id: crew.id }
        }),
        this.prisma.demandes_adhesion.delete({ where: { id: dto.applicationId } })
    ]);

    // 👇 NOTIFICATION 2: À TOUT LE MONDE
    await this.notifyCrew(
        crew.id,
        "🎉 Nouveau Membre",
        `Souhaitez la bienvenue à ${candidat.pseudo} qui vient de rejoindre l'équipage !`,
        "SUCCESS"
    );

    return { success: true, message: `Bienvenue à ${candidat.pseudo} !` };
  }

  // =================================================================
  // 6. EXCLURE UN MEMBRE (KICK)
  // =================================================================
  async kickMember(dto: KickDto) {
    if (dto.userId === dto.targetId) throw new BadRequestException("Tu ne peux pas t'exclure toi-même. Utilise 'Quitter'.");

    const capitaine = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    const membre = await this.prisma.joueurs.findUnique({ where: { id: dto.targetId } });

    if (!capitaine?.equipage_id || !membre?.equipage_id) throw new BadRequestException("Données invalides.");
    
    if (capitaine.equipage_id !== membre.equipage_id) throw new BadRequestException("Ce joueur n'est pas dans ton équipage.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: capitaine.equipage_id } });
    if (!crew || crew.chef_id !== dto.userId) throw new BadRequestException("Seul le capitaine peut exclure des membres.");

    await this.prisma.joueurs.update({
        where: { id: dto.targetId },
        data: { equipage_id: null }
    });

    // 👇 NOTIFICATION 5: AU MEMBRE KICKÉ
    await this.notifyPlayer(
        dto.targetId,
        "🚫 Expulsion",
        `Tu as été exclu de l'équipage "${crew.nom}" par le capitaine.`,
        "WARNING"
    );

    return { success: true, message: `${membre.pseudo} a été exclu.` };
  }

  // =================================================================
  // 7. PRÉPARATION RAID
  // =================================================================
  async startRaidPrep(userId: string, typeRaid: number) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur?.equipage_id) throw new BadRequestException("Pas d'équipage.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: joueur.equipage_id } });
    if (!crew) throw new BadRequestException("Équipage introuvable."); 
    if (crew.chef_id !== userId) throw new BadRequestException("Seul le capitaine décide.");

    if (crew.expedition_etat === 'EN_REPARATION') {
        if (new Date() > (crew.expedition_fin || new Date())) {
            await this.prisma.equipages.update({ where: { id: crew.id }, data: { expedition_etat: 'AUCUNE' } });
        } else {
            throw new BadRequestException("Le navire est en réparation ! Impossible de partir.");
        }
    }
    if (crew.expedition_etat !== 'AUCUNE') throw new BadRequestException("Une opération est déjà en cours !");

    const RAIDS: Record<number, { nom: string, cout: number }> = {
        1: { nom: "Pillage d'Île", cout: 5000 },
        2: { nom: "Chasse au Boss", cout: 15000 },
        3: { nom: "Exploration d'Épave", cout: 50000 }
    };
    const raidConfig = RAIDS[typeRaid];
    if (!raidConfig) throw new BadRequestException("Type de raid inconnu.");

    const solde = Number(crew.berrys_banque ?? 0n);
    if (solde < raidConfig.cout) throw new BadRequestException(`Fonds insuffisants (${raidConfig.cout} ฿ requis).`);

    const finPrep = new Date(Date.now() + 5 * 60 * 1000); 

    await this.prisma.$transaction(async (tx) => {
        await tx.equipages.update({
            where: { id: crew.id }, 
            data: {
                berrys_banque: { decrement: raidConfig.cout },
                expedition_etat: 'PREPARATION',
                expedition_fin: finPrep,
                expedition_cible_id: typeRaid,
                expedition_participants: [userId] 
            }
        });
    });

    // 👇 NOTIFICATION 3: À TOUT LE MONDE
    await this.notifyCrew(
        crew.id,
        "⚔️ Appel aux Armes !",
        `Le Capitaine a lancé un raid : "${raidConfig.nom}". Rejoignez l'expédition dans l'onglet 'Alliance' !`,
        "INFO"
    );

    return { success: true, message: `Préparation du raid : ${raidConfig.nom} lancée ! Les membres ont 5 minutes.` };
  }

  // =================================================================
  // 8. REJOINDRE RAID
  // =================================================================
  async joinRaid(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur?.equipage_id) throw new BadRequestException("Erreur joueur.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: joueur.equipage_id } });
    if (!crew) throw new BadRequestException("Équipage introuvable.");
    if (crew.expedition_etat !== 'PREPARATION') throw new BadRequestException("Trop tard ! Le raid est parti ou n'existe pas.");

    const participants = (crew.expedition_participants as string[]) || [];
    if (participants.includes(userId)) throw new BadRequestException("Tu es déjà inscrit.");

    await this.prisma.equipages.update({
        where: { id: crew.id },
        data: { expedition_participants: { push: userId } }
    });

    // 👇 NOTIFICATION 4: AU CHEF
    if (crew.chef_id) {
        await this.notifyPlayer(
            crew.chef_id,
            "🤝 Renforts",
            `${joueur.pseudo} a rejoint l'expédition !`,
            "INFO"
        );
    }

    return { success: true, message: "Tu as rejoint l'expédition !" };
  }

  // =================================================================
  // 9. CHECK STATUS RAID
  // =================================================================
  async checkRaidStatus(crewId: string) {
    const crew = await this.prisma.equipages.findUnique({ where: { id: crewId } });
    if (!crew || crew.expedition_etat === 'AUCUNE') return null;

    const now = new Date();
    const finTimer = crew.expedition_fin ? new Date(crew.expedition_fin) : new Date();

    // PHASE 1 : Lancement
    if (crew.expedition_etat === 'PREPARATION' && now > finTimer) {
        const DUREES: Record<number, number> = { 1: 60, 2: 120, 3: 180 }; 
        const dureeSecondes = DUREES[crew.expedition_cible_id || 1] || 60;
        
        await this.prisma.equipages.update({
            where: { id: crew.id },
            data: { expedition_etat: 'EN_COURS', expedition_fin: new Date(now.getTime() + dureeSecondes * 1000) }
        });
        return { status: 'EN_COURS', message: "L'expédition vient de partir !" };
    }

    // PHASE 2 : RÉSULTAT DU COMBAT
    if (crew.expedition_etat === 'EN_COURS' && now > finTimer) {
        const participants = (crew.expedition_participants as string[]) || [];
        
        const joueurs = await this.prisma.joueurs.findMany({
            where: { id: { in: participants } },
            select: { id: true, niveau: true, pv_actuel: true }
        });
        
        const sommeNiveaux = joueurs.reduce((acc, j) => acc + (j.niveau || 1), 0);
        const bonusSynergie = 1 + (participants.length * 0.05); 
        const puissanceTotale = Math.floor(sommeNiveaux * bonusSynergie);
        
        const DIFFICULTE: Record<number, number> = { 1: 15, 2: 60, 3: 150 };
        const seuilRequis = DIFFICULTE[crew.expedition_cible_id || 1] || 15;

        const rng = 0.85 + (Math.random() * 0.3);
        const scoreFinal = puissanceTotale * rng;
        
        const succes = scoreFinal >= seuilRequis;

        let gainXp = 0;
        let gainBerrys = 0;
        let msg = "";

        // --- CAS VICTOIRE ---
        if (succes) {
            const MULT = crew.expedition_cible_id || 1;
            gainXp = 500 * MULT;
            gainBerrys = 50000 * MULT;
            msg = `VICTOIRE ! Puissance déchaînée : ${Math.floor(scoreFinal)} (Requis: ${seuilRequis}).`;
            
            await this.prisma.equipages.update({
                where: { id: crew.id },
                data: {
                    xp: { increment: gainXp },
                    berrys_banque: { increment: gainBerrys },
                    expeditions_reussies: { increment: 1 },
                    expedition_etat: 'AUCUNE',
                    expedition_participants: []
                }
            });

            // 👇 NOTIFICATION 6 (VICTOIRE): AUX PARTICIPANTS
            for (const pId of participants) {
                await this.notifyPlayer(
                    pId,
                    "🏆 Raid Réussi !",
                    `Votre alliance a triomphé ! Gain pour l'équipage : +${gainXp} XP et +${gainBerrys} Berrys.`,
                    "REWARD"
                );
            }

        } 
        // --- CAS DÉFAITE ---
        else {
            msg = `ÉCHEC... Puissance : ${Math.floor(scoreFinal)} / ${seuilRequis}. Navire endommagé.`;
            const perteXp = 100 * (crew.expedition_cible_id || 1);
            
            const updatesJoueurs = joueurs.map(j => {
                const pvActuels = j.pv_actuel ?? 100;
                const nouveauxPv = Math.max(0, pvActuels - 50); 
                
                return this.prisma.joueurs.update({
                    where: { id: j.id },
                    data: { pv_actuel: nouveauxPv }
                });
            });

            await this.prisma.$transaction([
                this.prisma.equipages.update({
                    where: { id: crew.id },
                    data: {
                        xp: { decrement: perteXp },
                        expedition_etat: 'EN_REPARATION',
                        expedition_fin: new Date(now.getTime() + 12 * 60 * 60 * 1000),
                        expedition_participants: []
                    }
                }),
                ...updatesJoueurs
            ]);

            // 👇 NOTIFICATION 6 (ECHEC): AUX PARTICIPANTS
            for (const pId of participants) {
                await this.notifyPlayer(
                    pId,
                    "💀 Raid Échoué",
                    `La puissance de l'équipage était insuffisante. Vous avez perdu 50 PV et le navire est en réparation.`,
                    "WARNING"
                );
            }
        }

        return { status: 'FINI', success: succes, message: msg, xp: gainXp, berrys: gainBerrys };
    }

    // PHASE 3 : FIN DE RÉPARATION
    if (crew.expedition_etat === 'EN_REPARATION' && now > finTimer) {
        await this.prisma.equipages.update({
            where: { id: crew.id },
            data: {
                expedition_etat: 'AUCUNE',
                expedition_fin: null,
                expedition_participants: []
            }
        });
        return { status: 'REPARE', success: true, message: "Le navire est réparé ! Prêt à repartir." };
    }
    return null;
  }
  
  // =================================================================
  // 10. FORCE START & UPDATE (Inchangé sauf si tu veux notifier ici aussi)
  // =================================================================
  async forceStartRaid(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur?.equipage_id) throw new BadRequestException("Erreur joueur.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: joueur.equipage_id } });
    if (!crew || crew.chef_id !== userId) throw new BadRequestException("Seul le capitaine peut lancer l'assaut.");

    if (crew.expedition_etat !== 'PREPARATION') throw new BadRequestException("Le raid n'est pas en phase de préparation.");

    const DUREES: Record<number, number> = { 1: 60, 2: 120, 3: 180 }; 
    const dureeSecondes = DUREES[crew.expedition_cible_id || 1] || 60;
    
    const finRaid = new Date(Date.now() + dureeSecondes * 1000);

    await this.prisma.equipages.update({
        where: { id: crew.id },
        data: {
            expedition_etat: 'EN_COURS',
            expedition_fin: finRaid 
        }
    });

    return { success: true, message: "À L'ATTAQUE ! L'expédition commence !" };
  }

  async updateCrewSettings(dto: UpdateCrewDto) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    if (!joueur?.equipage_id) throw new BadRequestException("Tu n'as pas d'équipage.");

    const crew = await this.prisma.equipages.findUnique({ where: { id: joueur.equipage_id } });
    if (!crew) throw new BadRequestException("Équipage introuvable.");
    if (crew.chef_id !== dto.userId) throw new BadRequestException("Seul le capitaine peut modifier l'équipage.");

    if (dto.nom !== crew.nom) {
        if (dto.nom.length < 3) throw new BadRequestException("Nom trop court.");
        const exists = await this.prisma.equipages.findFirst({ where: { nom: dto.nom } });
        if (exists) throw new BadRequestException("Ce nom est déjà pris par un autre équipage.");
    }

    await this.prisma.equipages.update({
        where: { id: crew.id },
        data: {
            nom: dto.nom,
            description: dto.description
        }
    });

    return { success: true, message: "Paramètres de l'équipage mis à jour !" };
  }
  // --- 3. RÉCUPÉRER LES INFOS D'ÉQUIPAGE (POUR LE FRONTEND) ---
  async getCrewInfo(userId: string) {
    // Récupère le joueur avec son équipage
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: userId },
        include: { equipage: true } 
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable");

    if (!joueur.equipage) {
        // Pas d'équipage : on renvoie la liste des équipages publics
        const list = await this.prisma.equipages.findMany({ 
            // On limite à 10 et on filtre par faction si besoin
            where: { faction: joueur.faction || 'Pirate' },
            take: 10 
        });
        return { hasCrew: false, list };
    }

    // A un équipage : on renvoie les détails complets
    const crewId = joueur.equipage.id;

    const membres = await this.prisma.joueurs.findMany({
        where: { equipage_id: crewId },
        select: { id: true, pseudo: true, avatar_url: true, niveau: true, xp_donnee_equipage: true }
    });

    const logs = await this.prisma.banque_logs.findMany({
        where: { equipage_id: crewId },
        orderBy: { date_log: 'desc' },
        take: 20
    });

    // Si c'est le chef, on charge les candidatures
    let candidatures: any[] = [];
    if (joueur.equipage.chef_id === userId) {
        candidatures = await this.prisma.demandes_adhesion.findMany({
            where: { equipage_id: crewId }
        });
    }

    return { 
        hasCrew: true, 
        equipage: joueur.equipage, 
        membres, 
        logs, 
        candidatures 
    };
  }

// --- 4. RÉCUPÉRER LES DONNÉES DE COMMERCE (Boutique, Craft, Marché) ---
  async getCommerceData() {
    // On lance les 3 requêtes en parallèle pour aller plus vite
    const [boutique, recettes, marche] = await this.prisma.$transaction([
        this.prisma.objets.findMany({ 
            where: { en_boutique: true }, 
            orderBy: { prix_achat: 'asc' } 
        }),
        this.prisma.recettes.findMany({ 
            include: { objet_resultat: true, 
                ingredients: {
                    include: { 
                        objet: true
            }
        } } 
        }),
        this.prisma.marche.findMany({
            include: { 
                objets: true, 
                joueurs: { select: { pseudo: true } } // On veut juste le pseudo du vendeur
            },
            orderBy: { created_at: 'desc' }
        })
    ]);

    return { boutique, recettes, marche };
  }

  // --- 1. RÉCUPÉRER LES DONNÉES (Inchangé, c'est très bien) ---
  async getSkillsData(userId: string) {
    const [allSkills, userSkills] = await this.prisma.$transaction([
        this.prisma.competences.findMany({ 
            where: { exclusif_pnj: false }, 
            orderBy: { puissance: 'asc' } 
        }),
        this.prisma.joueur_competences.findMany({
            where: { joueur_id: userId },
            select: { competence_id: true }
        })
    ]);

    const mySkillIds = userSkills.map(s => s.competence_id);
    return { allSkills, mySkillIds };
  }

  // --- 2. ACHETER COMPÉTENCE (Légèrement optimisé, garde ta logique) ---
  async buySkill(dto: BuySkillDto) {
    // On vérifie le joueur et le skill
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
    const skill = await this.prisma.competences.findUnique({ where: { id: dto.skillId } });

    if (!joueur || !skill) throw new BadRequestException("Données introuvables.");
    if (!skill.est_achetable) throw new BadRequestException("Cette technique ne s'achète pas.");

    // Vérif : Déjà possédé ?
    const dejaPossede = await this.prisma.joueur_competences.findFirst({
        where: { joueur_id: dto.userId, competence_id: dto.skillId }
    });
    if (dejaPossede) throw new BadRequestException("Tu connais déjà cette technique !");

    // Vérif : Argent
    const prix = skill.cout_achat ?? 1000;
    if ((joueur.berrys ?? 0) < prix) {
        throw new BadRequestException(`Pas assez de Berrys (Requis: ${prix})`);
    }

    // Transaction
    await this.prisma.$transaction([
        this.prisma.joueurs.update({
            where: { id: dto.userId },
            data: { 
                berrys: { decrement: prix },
                // Optionnel : On peut incrémenter une stat "berrys dépensés" si tu veux
            }
        }),
        this.prisma.joueur_competences.create({
            data: {
                joueur_id: dto.userId,
                competence_id: dto.skillId
            }
        })
    ]);

    await this.clearCache(dto.userId);
    return { success: true, message: `Technique apprise : ${skill.nom} !` };
  }

// ====================================================================
  // ⚔️ GESTION DU DECK (ÉQUIPER / DÉSÉQUIPER)
  // ====================================================================
  async equipSkill(dto: { userId: string, skillId: number }) {
    
    // 1. Sécurisation de l'ID (On s'assure que c'est un entier)
    const skillId = Number(dto.skillId);
    if (isNaN(skillId)) throw new BadRequestException("ID de compétence invalide.");

    // 2. Récupérer le joueur
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: dto.userId },
        include: { joueur_competences: true } 
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable.");

    // 3. Vérifier la possession (Est-ce que le joueur a appris ce skill ?)
    // On compare les IDs en format Number pour être sûr
    const possede = joueur.joueur_competences.some(jc => Number(jc.competence_id) === skillId);
    if (!possede) throw new BadRequestException("Tu ne possèdes pas cette technique.");

    // 4. Gestion du Deck (Array d'IDs)
    // On s'assure que le deck existant est propre (tout en nombres)
    let deck: number[] = (joueur.deck_combat as number[] || []).map(id => Number(id));

    // LOGIQUE TOGGLE (Ajout / Retrait)
    if (deck.includes(skillId)) {
        // --- RETIRER ---
        deck = deck.filter(id => id !== skillId);
    } else {
        // --- AJOUTER ---
        if (deck.length >= 5) {
            throw new BadRequestException("Ton deck est plein (Max 5). Retire une technique d'abord.");
        }
        deck.push(skillId);
    }

    // 5. Sauvegarde
    // Prisma gère le remplacement du tableau PostgreSQL Integer[]
    await this.prisma.joueurs.update({
        where: { id: dto.userId },
        data: { deck_combat: deck } 
    });

    await this.clearCache(dto.userId);
    
    return { success: true, message: "Deck mis à jour", deck };
  }


  // --- 7. SOCIAL (CLASSEMENT & TITRES) ---

  async getLeaderboard(type: string) {
    // CLASSEMENT ÉQUIPAGES
    if (type === 'EQUIPAGE') {
        return this.prisma.equipages.findMany({
            // TRI PAR NIVEAU (Descendant) puis par XP
            orderBy: [
                { niveau: 'desc' },
                { xp: 'desc' }
            ],
            take: 20,
            // SÉLECTION DES CHAMPS (Il manquait berrys_banque !)
            select: { 
                id: true, 
                nom: true, 
                faction: true, 
                niveau: true, 
                berrys_banque: true, // <--- AJOUT CRUCIAL
                membres: { select: { id: true } } // Pour compter les membres
            } 
        });
    }

    // CLASSEMENT JOUEURS
    let orderBy = {};
    switch (type) {
        case 'RICHESSE': orderBy = { berrys: 'desc' }; break;
        case 'PVP': orderBy = { elo_pvp: 'desc' }; break;
        case 'PRIME': orderBy = { prime: 'desc' }; break;
        default: orderBy = [{ niveau: 'desc' }, { xp: 'desc' }]; // NIVEAU par défaut
    }

    return this.prisma.joueurs.findMany({
        where: { is_bot: false },
        orderBy: orderBy,
        take: 50,
        select: { 
            id: true, pseudo: true, avatar_url: true, faction: true, 
            niveau: true, berrys: true, elo_pvp: true, prime: true, titre_actuel: true 
        }
    });
  }



  async getChatHistory(canal: string) {
      // canal ressemble à "GLOBAL", "FACTION_Pirate", "EQUIPAGE_xyz..."
      return this.prisma.messages.findMany({
          where: { canal },
          orderBy: { date_envoi: 'desc' },
          take: 50,
          include: { joueurs: { select: { avatar_url: true } } } // On veut l'avatar pour le tchat
      });
  }

  async getCurrentFight(userId: string) {
     const combat = await this.prisma.combats.findFirst({
         where: { 
             OR: [{ joueur_id: userId }, { adversaire_id: userId }],
             est_termine: false 
         }
     });
     if (!combat) return null;

     const isAttacker = combat.joueur_id === userId;
     const oppId = isAttacker ? combat.adversaire_id : combat.joueur_id;
     
     // On charge l'adversaire (avec équipements au cas où c'est un vrai joueur)
     const opp = await this.prisma.joueurs.findUnique({ 
         where: { id: oppId! },
         include: {
            equip_arme: { include: { objets: true } },
            equip_tete: { include: { objets: true } },
            equip_corps: { include: { objets: true } },
            equip_bottes: { include: { objets: true } },
            equip_bague: { include: { objets: true } },
            equip_collier: { include: { objets: true } },
         } 
     });
     
     const me = await this.prisma.joueurs.findUnique({ 
         where: { id: userId },
         include: {
            equip_arme: { include: { objets: true } },
            equip_tete: { include: { objets: true } },
            equip_corps: { include: { objets: true } },
            equip_bottes: { include: { objets: true } },
            equip_bague: { include: { objets: true } },
            equip_collier: { include: { objets: true } },
         }
     });
     
     // 1. Calculer mes stats
     const myStats = me ? this.calculatePlayerStats(me) : { pv_max_total: 100 };

     // 2. Calculer stats adversaire (Bot ou Joueur)
     let oppPvMax = 100;
     
     if (opp?.is_bot) {
         // Formule BOT : 100 + (Niveau * 20)
         oppPvMax = 100 + ((opp.niveau ?? 1) * 20);
     } else if (opp) {
         // Formule JOUEUR : Calcul réel
         const oppStats = this.calculatePlayerStats(opp);
         oppPvMax = oppStats.pv_max_total;
     }

     return { 
         combat, 
         isAttacker,
         me: { pv_max: myStats.pv_max_total }, 
         opponent: { 
             id: opp?.id,
             pseudo: opp?.pseudo, 
             avatar_url: opp?.avatar_url, 
             // 👇 CORRECTION ICI : On renvoie le bon Max calculé
             pv_max: oppPvMax 
         }
     };
  }

async createPlayer(userId: string, pseudo: string, faction: string) {
    
    // 1. Vérif doublon pseudo
    const existingPseudo = await this.prisma.joueurs.findFirst({
        where: { pseudo: { equals: pseudo, mode: 'insensitive' } } // Insensible à la casse
    });
    
    if (existingPseudo) {
        throw new BadRequestException("Ce pseudo est déjà pris, pirate !");
    }

    // 2. Création
    const newJoueur = await this.prisma.joueurs.create({
        data: {
            id: userId,
            pseudo: pseudo,
            faction: null, // ✅ On enregistre la faction (défaut Pirate)
            
            // Stats de départ
            niveau: 1,
            xp: 0,
            berrys: 1000, // Un petit cadeau de bienvenue
            pv_actuel: 100,
            pv_max_base: 100,
            last_pv_update: new Date(),
            energie_actuelle: 10,
            last_energie_update: new Date(),
            
            // Caractéristiques
            points_carac: 0,
            force: 1,
            defense: 1,
            vitalite: 1,
            sagesse: 1,
            chance: 1,
            agilite: 1,
            intelligence: 1
        }
    });

    return newJoueur;
  }

  // --- 9. ACTIVITÉ / EXPLORATION ---
  async doActivity(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur) throw new BadRequestException("Joueur introuvable");

    // Vérification Cooldown (si tu veux le gérer côté serveur pour éviter la triche)
    const now = new Date();
    if (joueur.derniere_fouille) {
        const diff = now.getTime() - new Date(joueur.derniere_fouille).getTime();
        // Disons 1 minute de cooldown (60000ms)
        if (diff < 3600000) throw new BadRequestException("Tu dois te reposer un peu !");
    }

    // LOGIQUE DE RÉCOMPENSE (TypeScript)
    const rand = Math.random(); // Entre 0 et 1
    let xpGain = 0;
    let berrysGain = 0;
    let message = "";

    // 10% de chance de trouver un coffre (Gros gain)
    if (rand < 0.10) {
        xpGain = 500 * (joueur.niveau ?? 1);
        berrysGain = 5000 * (joueur.niveau ?? 1);
        message = "Incroyable ! Tu as trouvé un coffre au trésor ! 💎";
    } 
    // 40% de chance de combat (XP pur)
    else if (rand < 0.50) {
        xpGain = 300 * (joueur.niveau ?? 1);
        berrysGain = 1000 * (joueur.niveau ?? 1);
        message = "Tu as repoussé des bandits !";
    }
    // 50% de chance d'exploration calme (Berrys pur)
    else {
        xpGain = 50 * (joueur.niveau ?? 1);
        berrysGain = 500 * (joueur.niveau ?? 1);
        message = "Tu as aidé un marchand à porter ses caisses.";
    }

    // Mise à jour BDD
    await this.prisma.joueurs.update({
        where: { id: userId },
        data: {
            xp: { increment: xpGain },
            berrys: { increment: berrysGain },
            nb_activites: { increment: 1 },
            derniere_fouille: now // On met à jour le timer
        }
    });

    return { success: true, message, gain_xp: xpGain, gain_berrys: berrysGain };
  }

  // --- HELPER POUR LE CONTROLLER ---
  async getCrewIdFromUser(userId: string) {
      const joueur = await this.prisma.joueurs.findUnique({ 
          where: { id: userId }, 
          select: { equipage_id: true }
      });
      return joueur?.equipage_id;
  }

// =================================================================
  // 10. UTILISER UN OBJET (Potion, Parchemin, Nourriture...)
  // =================================================================
  async useItem(dto: { userId: string, inventaireId: number }) {
    // 1. Récupération de l'item
    const itemStock = await this.prisma.inventaire.findUnique({ 
        where: { id: dto.inventaireId }, 
        include: { objets: true } 
    });
    
    if (!itemStock || itemStock.joueur_id !== dto.userId || !itemStock.objets) {
        throw new BadRequestException("Objet invalide ou introuvable.");
    }
    
    // 2. Récupération du joueur
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: dto.userId },
        include: {
            equip_arme: { include: { objets: true } },
            equip_tete: { include: { objets: true } },
            equip_corps: { include: { objets: true } },
            equip_bottes: { include: { objets: true } },
            equip_bague: { include: { objets: true } },
            equip_collier: { include: { objets: true } },
        }
    });
    
    if (!joueur) throw new BadRequestException("Joueur introuvable.");

    // 3. Analyse de l'objet
    const itemBase = itemStock.objets;
    const itemName = (itemBase.nom || "").toUpperCase();
    
    // 🛠️ CORRECTION 1 : On utilise uniquement type_equipement qui existe dans votre schéma
    const itemType = (itemBase.type_equipement || "").toUpperCase();
    
    const itemStats = (itemBase.stats_bonus || {}) as Record<string, any>;

    let message = "";
    let updates: any = {};
    let effetTrouve = false;

    // =========================================================
    // CAS A : PARCHEMIN (Boost Statistique Définitif)
    // =========================================================
    if (itemName.includes('PARCHEMIN') || itemType.includes('PARCHEMIN')) {
        let statKey: string | undefined = undefined;

        if (itemName.includes('FORCE')) statKey = 'force';
        else if (itemName.includes('VITALITÉ') || itemName.includes('VITALITE')) statKey = 'vitalite';
        else if (itemName.includes('AGILITÉ') || itemName.includes('AGILITE')) statKey = 'agilite';
        else if (itemName.includes('INTELLIGENCE')) statKey = 'intelligence';
        else if (itemName.includes('SAGESSE')) statKey = 'sagesse';
        else if (itemName.includes('CHANCE')) statKey = 'chance';

        // Fallback : on cherche dans les stats bonus JSON
        if (!statKey) {
            statKey = Object.keys(itemStats).find(key => 
                ['force', 'vitalite', 'agilite', 'intelligence', 'sagesse', 'chance'].includes(key)
            );
        }

        if (statKey) {
            updates[statKey] = { increment: 1 };
            message = `✨ Parchemin utilisé : +1 ${statKey.toUpperCase()} !`;
            effetTrouve = true;
        }
    }

    // =========================================================
    // CAS B : POTION DE SOIN (PV)
    // =========================================================
    else if (itemType === 'CONSOMMABLE' || itemType === 'POTION' || itemName.includes('POTION') || itemName.includes('SOIN') || itemName.includes('PAIN') || itemName.includes('VIE')) {
        
        const stats = this.calculatePlayerStats(joueur); 
        const pvMax = stats.pv_max_total;
        const pvActuel = joueur.pv_actuel ?? 0;

        if (pvActuel >= pvMax) {
             throw new BadRequestException("Tu es déjà en pleine forme ! (PV Max)");
        }
        
        // On récupère le montant du soin (défaut 50)
        // On cast 'as any' pour accéder à des propriétés dynamiques si besoin
        const soin = Number((itemBase as any).soin || itemStats.soin || itemStats.vie || itemStats.pv || 50); 
        const newPv = Math.min(pvMax, pvActuel + soin);
        
        updates.pv_actuel = newPv;
        message = `🧪 Glouglou... Tu récupères ${newPv - pvActuel} PV !`;
        effetTrouve = true;
    }

    // =========================================================
    // CAS C : NOURRITURE (ÉNERGIE)
    // =========================================================
    // 👇 AJOUT DE 'PAIN' DANS LA LISTE
    else if (itemType === 'NOURRITURE' || itemName.includes('VIANDE') || itemName.includes('REPAS') || itemName.includes('ÉNERGIE') || itemName.includes('ENERGY') ) {
        
        const energieActuelle = joueur.energie_actuelle ?? 0;
        const energieMax = (joueur as any).energie_max ?? 10; 

        if (energieActuelle >= energieMax) {
            throw new BadRequestException("Ton énergie est déjà au maximum !");
        }

        // Si c'est du Pain, on peut aussi dire qu'il soigne un peu en plus de l'énergie si tu veux
        // Mais pour l'instant, on le traite comme de l'énergie/nourriture standard
        const gainEnergie = Number(itemStats.energie || 5); 
        const newEnergie = Math.min(energieMax, energieActuelle + gainEnergie); 

        updates.energie_actuelle = newEnergie;
        message = `🍞 Miam ! Tu récupères ${newEnergie - energieActuelle} Énergie(s).`;
        effetTrouve = true;
    }

    // =========================================================
    // FIN
    // =========================================================
    
    if (!effetTrouve) {
        throw new BadRequestException(`Impossible d'utiliser "${itemBase.nom}". Ce n'est pas un consommable reconnu.`);
    }

    await this.prisma.$transaction(async (tx) => {
        await tx.joueurs.update({ where: { id: dto.userId }, data: updates });

        if ((itemStock.quantite ?? 1) > 1) {
            await tx.inventaire.update({ 
                where: { id: itemStock.id }, 
                data: { quantite: { decrement: 1 } } 
            });
        } else {
            await tx.inventaire.delete({ 
                where: { id: itemStock.id } 
            });
        }
    });

    await this.clearCache(dto.userId);
    return { success: true, message };
  }
private calculatePlayerStats(joueur: any) {
      
      // 1. Stats de Base (On prend UNIQUEMENT ce qu'il y a en BDD)
      // On initialise à 0 si c'est null, pour éviter les bugs d'addition
      const stats = {
          force: Number(joueur.force ?? 0), 
          defense: Number(joueur.defense ?? 0),
          vitalite: Number(joueur.vitalite ?? 0),
          sagesse: Number(joueur.sagesse ?? 0),
          chance: Number(joueur.chance ?? 0),
          agilite: Number(joueur.agilite ?? 0),
          intelligence: Number(joueur.intelligence ?? 0),
          pv_max_total: Number(joueur.pv_max_base ?? 100)
      };

      // 2. Bonus d'équipement
      if (joueur.inventaire && Array.isArray(joueur.inventaire)) {
          // On ne prend que les items équipés
          const stuffEquipe = joueur.inventaire.filter((i: any) => i.est_equipe);

          for (const item of stuffEquipe) {
              // Priorité : Stats Uniques (Roulées) > Stats de base (Range)
              let bonusStats = item.stats_perso;
              
              if (!bonusStats || Object.keys(bonusStats).length === 0) {
                  bonusStats = item.objets.stats_bonus;
              }

              if (bonusStats) {
                  for (const [key, val] of Object.entries(bonusStats)) {
                      if (key in stats) {
                          let valeurAjoutee = 0;

                          // Si c'est un chiffre direct (ex: 5)
                          if (typeof val === 'number') {
                              valeurAjoutee = val;
                          } 
                          // Si c'est une range {min, max}, on prend le MIN pour le calcul statique
                          else if (typeof val === 'object' && val !== null && 'min' in val) {
                              valeurAjoutee = Number((val as any).min); 
                          }

                          stats[key] += valeurAjoutee;
                      }
                  }
              }
          }
      }

      // 3. Calcul Final PV Max
      stats.pv_max_total = (joueur.pv_max_base ?? 100) + (stats.vitalite * 5);

      return stats;
  }

  // --- 11. ARÈNE (LISTING) ---
  async getArenaOpponents(userId: string, filter: 'PVE' | 'PVP') {
    const isBot = filter === 'PVE';

    const adversaires = await this.prisma.joueurs.findMany({
        where: {
            is_bot: isBot,       // On filtre selon le mode
            id: { not: userId }  // On ne s'affiche pas soi-même
        },
        orderBy: isBot 
            ? { niveau: 'asc' }    // PVE : Du plus faible au plus fort
            : { elo_pvp: 'desc' }, // PVP : Les meilleurs en premier (ou asc si tu veux monter)
        take: 20,
        select: {
            id: true,
            pseudo: true,
            avatar_url: true,
            niveau: true,
            faction: true,
            elo_pvp: true,
            titre_actuel: true,
            prime: true // Pour afficher la prime Wanted
        }
    });

    return adversaires;
  }


// 12. RÉCUPÉRER LE CATALOGUE COMPLET DES OBJETS
  async getAllItems() {
    // Note: C'est un gros tableau. Utiliser un cache Prisma serait idéal ici.
    const items = await this.prisma.objets.findMany({}); 
    return { items };
  }
// Dans backend/src/game/game.service.ts

// =================================================================
  // 💬 GESTION DES MENTIONS TCHAT (@Pseudo)
  // =================================================================
  async processChatMentions(senderId: string, content: string) {
      // 1. On récupère le pseudo de l'envoyeur
      const sender = await this.prisma.joueurs.findUnique({ 
          where: { id: senderId }, 
          select: { pseudo: true } 
      });
      if (!sender) return;

      // 2. Regex pour trouver les @Pseudo (ex: @Luffy, @Zoro123)
      // \w+ capture lettres, chiffres et underscores
      const mentionRegex = /@(\w+)/g;
      const matches = content.match(mentionRegex);

      if (!matches || matches.length === 0) return;

      // 3. Nettoyage et Dé-duplication
      // On retire le '@' et on utilise un Set pour éviter de notifier 3 fois si on écrit "@Zoro @Zoro @Zoro"
      const uniquePseudos = [...new Set(matches.map(m => m.slice(1)))];

      // 4. Recherche des cibles en BDD
      const targets = await this.prisma.joueurs.findMany({
          where: {
              pseudo: { in: uniquePseudos, mode: 'insensitive' }, // "luffy" marchera pour "Luffy"
              id: { not: senderId } // On évite l'auto-mention
          },
          select: { id: true }
      });

      // 5. Envoi des notifications
      // On coupe le message s'il est trop long pour la notif
      const previewMsg = content.length > 40 ? content.slice(0, 37) + '...' : content;

      for (const target of targets) {
          await this.notifyPlayer(
              target.id,
              "💬 On parle de vous !",
              `${sender.pseudo} vous a mentionné : "${previewMsg}"`,
              "INFO"
          );
      }
  }
  
// =================================================================
  // 🧠 HELPER : CALCUL DU PASSAGE DE NIVEAU (CORRIGÉ)
  // =================================================================
  private calculateLevelUp(joueur: any, xpGained: number) {
      let currentXp = (joueur.xp || 0) + xpGained;
      let currentLevel = joueur.niveau || 1;
      let levelsGained = 0;

      // Formule Frontend : 100 * (Niveau ^ 1.5)
      const getXpRequired = (lvl: number) => Math.floor(100 * Math.pow(lvl, 1.5));
      let xpRequired = getXpRequired(currentLevel);

      // Boucle de montée
      while (currentXp >= xpRequired) {
          currentXp -= xpRequired; 
          currentLevel++;          
          levelsGained++;
          xpRequired = getXpRequired(currentLevel);
      }

      // Objet de mise à jour de base
      const updateData: any = {
          xp: currentXp,
          niveau: currentLevel
      };

      // Si le joueur a monté de niveau
      if (levelsGained > 0) {
          
          // ✅ CORRECTION ICI : 'points_carac' au lieu de 'points_stats'
          updateData.points_carac = { increment: levelsGained * 5 };

          // SOIN TOTAL (Recalcul des PV Max)
          // On récupère le Max PV actuel (sans compter les points non distribués)
          // Note: Cela nécessite que 'joueur' ait ses équipements chargés
          let statsActuelles = { pv_max_total: 100 }; // Valeur par défaut
          
          // Petite sécurité si la méthode calculatePlayerStats plante sans équipement complet
          try {
              statsActuelles = this.calculatePlayerStats(joueur);
          } catch (e) {
              // Fallback manuel si calculatePlayerStats échoue
              const basePv = 100;
              const vit = joueur.vitalite || 0;
              statsActuelles.pv_max_total = basePv + (vit * 5) + (joueur.niveau * 10); // Formule approximative de secours
          }
          
          updateData.pv_actuel = statsActuelles.pv_max_total; 
          
          // Reset Énergie
          // On utilise 'as any' car energie_max n'est peut-être pas dans le typing Prisma
          updateData.energie_actuelle = (joueur as any).energie_max || 10;
      }

      return { updateData, levelsGained, newLevel: currentLevel };
  }
  // =================================================================
  // 📖 RÉCUPÉRER LES TITRES (Lecture seule)
  // =================================================================
  async getTitles(userId: string) {
    const [mesTitres, allTitres] = await this.prisma.$transaction([
        this.prisma.joueur_titres.findMany({
            where: { joueur_id: userId },
            include: { titres_ref: true }
        }),
        this.prisma.titres_ref.findMany({ orderBy: { condition_valeur: 'asc' } }) 
    ]);
    return { mesTitres, allTitres };
  }

  // =================================================================
  // 🔓 DÉBLOQUAGE MANUEL (Admin ou Event Spécial)
  // =================================================================
  async unlockTitle(userId: string, nomTitre: string) {
    const titreRef = await this.prisma.titres_ref.findFirst({ where: { nom: nomTitre } });
    if (!titreRef) throw new BadRequestException(`Titre "${nomTitre}" introuvable.`);

    const existingTitle = await this.prisma.joueur_titres.findFirst({
        where: { joueur_id: userId, titre_id: titreRef.id }
    });

    if (existingTitle) {
        return { success: true, message: `Titre déjà possédé : ${nomTitre}` };
    }

    // Déblocage réel
    await this.prisma.joueur_titres.create({
        data: {
            joueur_id: userId,
            titre_id: titreRef.id,
            date_obtention: new Date()
        }
    });
    
    // 👇 NOTIFICATION AJOUTÉE ICI
    await this.notifyPlayer(
        userId,
        "🏆 Titre Légendaire",
        `Vous avez obtenu un titre spécial : « ${nomTitre} » !`,
        "REWARD"
    );

    await this.clearCache(userId);

    return { 
        success: true, 
        message: `🎉 Nouveau Titre débloqué : « ${nomTitre} » !`,
        newTitleUnlocked: nomTitre
    };
  }

  // =================================================================
  // ⚙️ MOTEUR DE VÉRIFICATION DES TITRES (AUTO)
  // =================================================================
  private async checkAndUnlockTitles(userId: string) {
    // 1. Charger le joueur avec TOUTES les infos nécessaires
    const joueur = await this.prisma.joueurs.findUnique({
        where: { id: userId },
        include: { 
            equipage: true, 
            joueur_titres: true 
        }
    });

    if (!joueur) return;

    // 2. Charger tous les titres
    const allTitres = await this.prisma.titres_ref.findMany();

    // 3. Optimisation : Liste des IDs déjà possédés
    const titresPossedesIds = new Set(joueur.joueur_titres.map(t => t.titre_id));
    const newUnlockedTitres: string[] = [];

    // 4. Boucle de vérification
    for (const titre of allTitres) {
        if (titresPossedesIds.has(titre.id)) continue; // Déjà acquis

        let conditionMet = false;
        const val = Number(titre.condition_valeur); // Conversion BigInt -> Number

        switch (titre.condition_type) {
            // --- FACTIONS & NIVEAU ---
            case 'LEVEL_PIRATE':
                if (joueur.faction?.toUpperCase().includes('PIRATE') && (joueur.niveau ?? 1) >= val) conditionMet = true;
                break;
            case 'LEVEL_MARINE':
                if (joueur.faction?.toUpperCase().includes('MARINE') && (joueur.niveau ?? 1) >= val) conditionMet = true;
                break;
            case 'LEVEL_REVOLUTIONNAIRE':
                const faction = joueur.faction?.toUpperCase() || "";
                if ((faction.includes('REVOLUTIONNAIRE') || faction.includes('RÉVOLUTIONNAIRE')) && (joueur.niveau ?? 1) >= val) conditionMet = true;
                break;

            // --- STATISTIQUES ---
            case 'STAT_FORCE': if ((joueur.force ?? 0) >= val) conditionMet = true; break;
            case 'STAT_INTELLIGENCE': if ((joueur.intelligence ?? 0) >= val) conditionMet = true; break;
            case 'STAT_AGILITE': if ((joueur.agilite ?? 0) >= val) conditionMet = true; break;
            case 'STAT_SAGESSE': if ((joueur.sagesse ?? 0) >= val) conditionMet = true; break;
            case 'STAT_VITALITE': if ((joueur.vitalite ?? 0) >= val) conditionMet = true; break;
            case 'STAT_CHANCE': if ((joueur.chance ?? 0) >= val) conditionMet = true; break;

            // --- COMBATS ---
            case 'VICTOIRES_PVP': if ((joueur.victoires_pvp ?? 0) >= val) conditionMet = true; break;
            case 'DEFAITES_PVP': if ((joueur.defaites_pvp ?? 0) >= val) conditionMet = true; break;
            case 'VICTOIRES_PVE': if ((joueur.victoires_pve ?? 0) >= val) conditionMet = true; break;

            // --- ECONOMIE & DIVERS ---
            case 'BERRYS': if ((joueur.berrys ?? 0) >= val) conditionMet = true; break;
            case 'HAS_FRUIT': if (joueur.fruit_demon && val === 1) conditionMet = true; break;
            
            // --- NAVIRE & EQUIPAGE ---
            case 'SHIP_LEVEL': if ((joueur.niveau_navire ?? 1) >= val) conditionMet = true; break;
            case 'CREW_LEVEL': 
                if (joueur.equipage && (joueur.equipage.niveau ?? 1) >= val) conditionMet = true; 
                break;
            case 'CREW_XP_GIVEN': if (Number(joueur.xp_donnee_equipage ?? 0) >= val) conditionMet = true; break;

            // --- HAKI ---
            case 'HAKI_COUNT':
                let hakiCount = 0;
                if (joueur.haki_observation) hakiCount++;
                if (joueur.haki_armement) hakiCount++;
                if (joueur.haki_rois) hakiCount++;
                if (hakiCount >= val) conditionMet = true;
                break;

            // --- ACTIONS COMPTEURS ---
            case 'EXPEDITIONS_COUNT': if ((joueur.nb_expeditions_reussies ?? 0) >= val) conditionMet = true; break;
            case 'CRAFTS_COUNT': if ((joueur.nb_crafts ?? 0) >= val) conditionMet = true; break;
            case 'CHESTS_OPENED': if ((joueur.nb_coffres_ouverts ?? 0) >= val) conditionMet = true; break;
            case 'POTIONS_CONSUMED': if ((joueur.nb_potions_bues ?? 0) >= val) conditionMet = true; break;
            case 'ACTIVITY_CLICK_COUNT': if ((joueur.nb_activites ?? 0) >= val) conditionMet = true; break;
            
            // --- BOUTIQUE / CASINO ---
            case 'SHOP_SPENT': if (Number(joueur.berrys_depenses_shop ?? 0) >= val) conditionMet = true; break;
            case 'CASINO_WAGERED': if (Number(joueur.berrys_mises_casino ?? 0) >= val) conditionMet = true; break;
            case 'CASINO_LOST_ALL': if (joueur.a_tout_perdu_casino) conditionMet = true; break;
            
            // --- MORT ---
            case 'HAS_DIED': if ((joueur.pv_actuel ?? 0) <= 0) conditionMet = true; break;
        }

        // 5. Attribution du titre
        if (conditionMet) {
            await this.prisma.joueur_titres.create({
                data: {
                    joueur_id: userId,
                    titre_id: titre.id,
                    date_obtention: new Date()
                }
            });
            
            newUnlockedTitres.push(titre.nom);

            // 👇 NOTIFICATION AJOUTÉE ICI (Pour chaque titre débloqué)
            await this.notifyPlayer(
                userId,
                "🏆 Titre Débloqué",
                `Félicitations ! Vous portez désormais le titre : « ${titre.nom} »`,
                "REWARD"
            );
        }
    }

    return newUnlockedTitres; 
  }
// =================================================================
  // 9. ACTIVITÉ / EXPLORATION
  // =================================================================
  async clickActivite(dto: { userId: string, type?: string }) {
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: dto.userId },
        include: { equip_corps: true } 
    });
    
    if (!joueur) throw new BadRequestException("Joueur introuvable");

    // Cooldown
    const now = new Date();
    if (joueur.derniere_fouille) {
        const diff = now.getTime() - new Date(joueur.derniere_fouille).getTime();
        if (diff < 60000) throw new BadRequestException("Repos requis !");
    }

    // Calcul Gains
    const rand = Math.random(); 
    let xpGain = 0;
    let berrysGain = 0;
    let message = "";

    if (rand < 0.10) {
        xpGain = 50 * (joueur.niveau ?? 1);
        berrysGain = 500 * (joueur.niveau ?? 1);
        message = "Trésor caché ! 💎";
    } else if (rand < 0.50) {
        xpGain = 30 * (joueur.niveau ?? 1);
        berrysGain = 10 * (joueur.niveau ?? 1);
        message = "Bandits repoussés !";
    } else {
        xpGain = 10 * (joueur.niveau ?? 1);
        berrysGain = 50 * (joueur.niveau ?? 1);
        message = "Travail terminé.";
    }

    let itemRewards: any[] = [];
    let isLeveledUp = false;
    let currentNewLevel = joueur.niveau ?? 1;

    // --- TRANSACTION ---
    await this.prisma.$transaction(async (tx) => {
        
        // 1. Loot
        const loot = await this.generateActivityLoot(LOOT_ACTIVITY_TABLE, tx);
        itemRewards = loot.items;

        // 2. CALCUL LEVEL UP
        // ⚠️ Je n'utilise PAS 'addXpAndLevelUp' ici, mais le helper local
        const { updateData, levelsGained, newLevel } = this.calculateLevelUp(joueur, xpGain);
        
        isLeveledUp = levelsGained > 0;
        currentNewLevel = newLevel;

        // 3. Compléter l'objet de mise à jour
        updateData.berrys = { increment: berrysGain };
        updateData.nb_activites = { increment: 1 };
        updateData.derniere_fouille = now;

        // 4. MISE À JOUR JOUEUR (CRITIQUE)
        // Vérifiez bien que vous n'avez pas de ligne 'xp: { increment: ... }' ici !
        await tx.joueurs.update({
            where: { id: dto.userId },
            data: updateData // On envoie l'objet calculé par le helper
        });

        // 5. Inventaire
        for (const reward of itemRewards) {
            const objet = reward.objet_data;
            const existing = await tx.inventaire.findFirst({ where: { joueur_id: dto.userId, objet_id: objet.id } });
            
            if (existing) {
                await tx.inventaire.update({ where: { id: existing.id }, data: { quantite: { increment: reward.quantite } } });
            } else {
                await tx.inventaire.create({ data: { joueur_id: dto.userId, objet_id: objet.id, quantite: reward.quantite, stats_perso: Prisma.DbNull } });
            }
            reward.nom = objet.nom;
            reward.rarity = objet.rarete;
            reward.image_url = objet.image_url;
            delete reward.objet_data;
        }
    });

    await this.clearCache(dto.userId);
    this.updateQuestProgress(dto.userId, 'ACTIVITY', 1);
    // Retour
    return { 
        success: true, 
        message: isLeveledUp ? `NIVEAU ${currentNewLevel} ATTEINT !` : message, 
        rewards: { xp: xpGain, berrys: berrysGain, items: itemRewards },
        leveledUp: isLeveledUp,
        newLevel: currentNewLevel
    };
  }

// =================================================================
// 2. RÉCOLTE EXPÉDITION (CORRIGÉE : CHANCE BASÉE SUR LES STATS)
// =================================================================
async recolterExpedition(dto: { userId: string }) {
    // 1. Récupération du joueur (Sans inclure 'localisation' qui bug)
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: dto.userId },
        // IMPORTANT : On inclut l'inventaire pour que calculatePlayerStats fonctionne
        include: { equip_corps: true, inventaire: { include: { objets: true } } } 
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable.");
    if (!joueur.expedition_fin || new Date(joueur.expedition_fin).getTime() > new Date().getTime()) {
        throw new BadRequestException("Patience... Les marins ne sont pas revenus.");
    }
    
    // --- 2. RÉCUPÉRATION MANUELLE DE LA DESTINATION ---
    let destination: any = null;
    if (joueur.localisation_id) {
        destination = await this.prisma.destinations.findUnique({
            where: { id: joueur.localisation_id }
        });
    }

    // --- 3. CALCUL DE LA RÉUSSITE (Basé sur les Stats du Joueur) ---
    
    // On doit inclure l'inventaire pour que calculatePlayerStats fonctionne correctement dans la requête principale
    // (Je suppose que vous avez fait la correction dans le findUnique au début de la fonction)
    const stats = this.calculatePlayerStats(joueur); 
    
    // a. Définir la Difficulté
    const difficulteIle = destination?.difficulte || (destination?.niveau_requis * 30) || 30; 
    
    // b. Formule de Puissance Mixte (Doit être la même que le Frontend)
    const puissanceJoueur = (stats.force * 1.5) + (stats.agilite * 1.2) + (stats.intelligence * 1.0);
    
    // c. Calcul de la Chance (Nouvelle formule stricte)
    let ratio = puissanceJoueur / Math.max(1, difficulteIle);
    let chancePercent = Math.floor(ratio * 20) + 20; // Pivot à 40% à l'équilibre
    
    // d. Ajustement de niveau (+1% tous les 5 niveaux)
    chancePercent += Math.max(0, (joueur.niveau || 1) / 5);

    // Bornes : Min 10%, Max 95%
    chancePercent = Math.min(95, Math.max(10, chancePercent));

    // 🎲 TIRAGE AU SORT
    const roll = Math.random() * 100;
    const isSuccess = roll <= chancePercent;

    console.log(`🎲 Expédition ${joueur.pseudo} (Puissance ${puissanceJoueur.toFixed(0)}) vs Île (Diff ${difficulteIle}) : ${chancePercent}% chance. Roll: ${roll.toFixed(1)} -> ${isSuccess ? "SUCCÈS" : "ÉCHEC"}`);

    // --- CAS D'ÉCHEC ---
    if (!isSuccess) {
        // Gain de consolation
        const xpConsolation = Math.floor(50 * Math.max(1, (joueur.niveau || 1) / 2));
        
        // 🔥 CORRECTION : On utilise calculateLevelUp même pour l'XP de consolation !
        // Sinon l'XP dépasse le max sans déclencher le passage de niveau.
        const { updateData, levelsGained, newLevel } = this.calculateLevelUp(joueur, xpConsolation);

        // On ajoute les champs spécifiques à l'échec de l'expédition
        updateData.expedition_fin = null;
        
        // On sauvegarde
        await this.prisma.joueurs.update({
            where: { id: dto.userId },
            data: updateData
        });
        
        // On vérifie les titres (ex: Atteindre le niveau 10 grâce à l'échec)
        const updatedJoueur = await this.prisma.joueurs.findUnique({ where: { id: dto.userId } });
        if (updatedJoueur) await this.checkAndUnlockTitles(dto.userId);

        await this.clearCache(dto.userId);

        return {
            success: false,
            message: levelsGained > 0 
                ? `Échec... mais l'expérience vous a endurci : NIVEAU ${newLevel} !` 
                : "L'expédition a échoué... Vos hommes sont revenus bredouilles mais un peu plus sages.",
            rewards: { xp: xpConsolation, berrys: 0, items: [] },
            leveledUp: levelsGained > 0,
            newLevel: newLevel
        };
    }

    // --- CAS DE RÉUSSITE ---
    
    const playerLevel = joueur.niveau || 1;
    // Logique loot table
    let lootTable = LOOT_VOYAGE_TABLES.LOW; 
    if (playerLevel > 10) lootTable = LOOT_VOYAGE_TABLES.MEDIUM; 

    const gainXP = this.getRandomQuantity(50, 100) * playerLevel; 
    const gainBerrys = this.getRandomQuantity(500, 1500) * Math.max(1, Math.floor(playerLevel / 2)); 

    let itemRewards: any[] = [];
    let isLeveledUp = false;
    let currentNewLevel = playerLevel;

    await this.prisma.$transaction(async (tx) => {
        const loot = await this.generateActivityLoot(lootTable, tx);
        itemRewards = loot.items;

        // 🔥 CALCUL LEVEL UP
        const { updateData, levelsGained, newLevel } = this.calculateLevelUp(joueur, gainXP);
        
        isLeveledUp = levelsGained > 0;
        currentNewLevel = newLevel;

        // Compléter updateData
        updateData.berrys = { increment: gainBerrys };
        updateData.expedition_fin = null;
        updateData.nb_expeditions_reussies = { increment: 1 };

        // UPDATE JOUEUR
        await tx.joueurs.update({
            where: { id: dto.userId },
            data: updateData
        });

        // Inventaire
        for (const reward of itemRewards) {
            const objet = reward.objet_data;
            const existing = await tx.inventaire.findFirst({ where: { joueur_id: dto.userId, objet_id: objet.id } });
            if (existing) {
                await tx.inventaire.update({ where: { id: existing.id }, data: { quantite: { increment: reward.quantite } } });
            } else {
                await tx.inventaire.create({ data: { joueur_id: dto.userId, objet_id: objet.id, quantite: reward.quantite, stats_perso: Prisma.DbNull } });
            }
            // Nettoyage pour le retour JSON
            reward.nom = objet.nom;
            reward.rarity = objet.rarete;
            reward.image_url = objet.image_url;
            delete reward.objet_data;
        }
    });

    const newTitres = await this.checkAndUnlockTitles(dto.userId);

    await this.clearCache(dto.userId);
    this.updateQuestProgress(dto.userId, 'VOYAGE', 1);

    // Tu peux ajouter les titres au message de retour si tu veux
    let messageFinale = isLeveledUp ? `Succès ! NIVEAU ${currentNewLevel} ATTEINT !` : `Expédition réussie !`;
    if (newTitres && newTitres.length > 0) {
        messageFinale += ` 🏆 Titre(s) débloqué(s) : ${newTitres.join(', ')}`;
    }

    return {
        success: true,
        message: isLeveledUp ? `Succès ! NIVEAU ${currentNewLevel} ATTEINT !` : `Expédition réussie !`,
        rewards: { xp: gainXP, berrys: gainBerrys, items: itemRewards },
        leveledUp: isLeveledUp,
        newLevel: currentNewLevel
    };
}

// --- BOUTIQUE ---
  async getShopItems() {
    const items = await this.prisma.objets.findMany({
      where: { 
        en_boutique: true // On ne prend que ceux marqués comme achetables
      },
      orderBy: { 
        prix_achat: 'asc' // On trie du moins cher au plus cher
      }
    });
    
    return items;
  }
// --- AMÉLIORATION DU NAVIRE ---
  async upgradeShip(userId: string) {
    // 1. Récupérer le joueur et son inventaire
    const joueur = await this.prisma.joueurs.findUnique({
        where: { id: userId },
        include: { 
            inventaire: { 
                include: { objets: true },
                where: { est_equipe: true } // On regarde ce qui est équipé
            } 
        }
    });

    if (!joueur) throw new BadRequestException("Joueur introuvable.");

    // 2. Déterminer le niveau actuel
    // On cherche l'item équipé qui est de catégorie 'Navire' ou type 'NAVIRE'
    const navireEquipe = joueur.inventaire.find(i => 
        i.objets.type_equipement === 'NAVIRE' || i.objets.categorie === 'Navire'
    );

    let niveauActuel = 1;
    if (navireEquipe) {
        // On cherche la ref pour connaitre le niveau
        const ref = await this.prisma.navires_ref.findFirst({
            where: { nom: navireEquipe.objets.nom }
        });
        if (ref) niveauActuel = ref.niveau;
    }

    const nextLevel = niveauActuel + 1;

    // 3. Récupérer les coûts du prochain niveau
    const nextShipRef = await this.prisma.navires_ref.findUnique({
        where: { niveau: nextLevel },
        include: { cout_items: { include: { objet: true } } }
    });

    if (!nextShipRef) throw new BadRequestException("Niveau maximum atteint ou navire inconnu !");

    // 4. TRANSACTION : Vérifier Coûts -> Payer -> Donner Navire
    return await this.prisma.$transaction(async (tx) => {
        // A. Vérifier l'Argent
        const prix = Number(nextShipRef.prix_berrys);
        if (Number(joueur.berrys) < prix) {
            throw new BadRequestException(`Pas assez de Berrys (Requis: ${prix})`);
        }

        // B. Vérifier et Consommer les Matériaux
        // On doit recharger l'inventaire COMPLET du joueur (pas juste les équipés) pour vérifier les stocks
        const fullInventaire = await tx.inventaire.findMany({
            where: { joueur_id: userId },
            include: { objets: true }
        });

        // B. Vérifier et Consommer les Matériaux
        for (const cout of nextShipRef.cout_items) {
            const itemEnSac = fullInventaire.find(i => i.objet_id === cout.objet_id);
            
            // Correction 1 : On s'assure que c'est toujours un nombre (0 si null ou undefined)
            const qtePossedee = itemEnSac?.quantite ?? 0;

            if (qtePossedee < cout.quantite) {
                throw new BadRequestException(`Manque de matériaux : ${cout.objet.nom} (${qtePossedee}/${cout.quantite})`);
            }

            // Correction 2 : TypeScript a besoin d'être sûr que itemEnSac existe avant de l'utiliser
            // Si on arrive ici, c'est que qtePossedee >= cout.quantite (donc > 0), donc l'item existe forcément.
            // Mais on ajoute cette garde pour rassurer le compilateur.
            if (!itemEnSac) {
                throw new BadRequestException(`Erreur interne : Matériau introuvable lors de la consommation.`);
            }

            // Consommation
            if (itemEnSac.quantite === cout.quantite) {
                await tx.inventaire.delete({ where: { id: itemEnSac.id } });
            } else {
                await tx.inventaire.update({
                    where: { id: itemEnSac.id },
                    data: { quantite: { decrement: cout.quantite } }
                });
            }
        }

        // C. Payer
        await tx.joueurs.update({
            where: { id: userId },
            data: { berrys: { decrement: prix } }
        });

        // D. Donner le nouveau navire
        // On cherche l'objet correspondant au nom du navire dans la table objets
        const objetNavire = await tx.objets.findUnique({
            where: { nom: nextShipRef.nom }
        });

        if (!objetNavire) throw new BadRequestException(`Erreur critique : L'objet '${nextShipRef.nom}' n'existe pas dans la table objets.`);

        // On ajoute le nouveau navire à l'inventaire
        const newShipInv = await tx.inventaire.create({
            data: {
                joueur_id: userId,
                objet_id: objetNavire.id,
                quantite: 1,
                est_equipe: true // 🔥 On l'équipe directement !
            }
        });

        // E. Déséquiper l'ancien navire (si existant)
        if (navireEquipe) {
            await tx.inventaire.update({
                where: { id: navireEquipe.id },
                data: { est_equipe: false } // On le range dans le sac (ou on le supprime si tu préfères)
            });
        }

        return { success: true, message: `Construction terminée : ${nextShipRef.nom} !` };
    });
  }


  // 🔥 HELPER : Ajoute de l'XP et gère la montée de niveau (Boucle while)
  private async addXpAndLevelUp(tx: any, userId: string, xpGain: number) {
    // 1. On récupère les données actuelles
    const joueur = await tx.joueurs.findUnique({ where: { id: userId } });
    
    let currentXp = (joueur.xp || 0) + xpGain;
    let currentLevel = joueur.niveau || 1;
    let currentPoints = joueur.points_carac || 0;
    let leveledUp = false;

    // 2. Formule d'XP (Doit être IDENTIQUE au Frontend)
    // XP requise = 100 * (Niveau ^ 1.5)
    let xpRequis = Math.floor(100 * Math.pow(currentLevel, 1.5));

    // 3. Boucle de montée de niveau (Gère les multi-lvls d'un coup)
    while (currentXp >= xpRequis) {
        currentXp -= xpRequis; // On retire le coût du niveau
        currentLevel++;        // On monte de niveau
        currentPoints += 5;    // +5 Points de stats par niveau
        leveledUp = true;
        
        // Recalcul du prochain palier pour la boucle suivante
        xpRequis = Math.floor(100 * Math.pow(currentLevel, 1.5));
    }

    // 4. Préparation des données de mise à jour
    const updateData: any = {
        xp: currentXp,
        niveau: currentLevel,
        points_carac: currentPoints
    };

    // Bonus : Soin complet + Énergie max si Level Up !
    if (leveledUp) {

        updateData.energie_actuelle = 10; 
    }

    // 5. Application en BDD
    await tx.joueurs.update({
        where: { id: userId },
        data: updateData
    });

    return { leveledUp, currentLevel };
  }

  // =================================================================
    // 🛠️ ADMIN & NOTIFICATIONS
    // =================================================================

    // Vérification Admin
    private async verifyAdmin(userId: string) {
        const user = await this.prisma.joueurs.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            throw new ForbiddenException("⛔ Accès interdit. Réservé aux Amiraux (Admins).");
        }
    }

    // 1. Liste des joueurs (Backoffice)
    async getAllPlayers(adminId: string) {
        await this.verifyAdmin(adminId);
        return this.prisma.joueurs.findMany({
            orderBy: { niveau: 'desc' },
            select: { 
                id: true, pseudo: true, niveau: true, berrys: true, 
                faction: true, role: true, equipage_id: true
            },
            take: 100 // Limite pour la performance
        });
    }

// ... dans game.service.ts

    async adminAction(adminId: string, targetId: string, action: string, amount?: number) {
        await this.verifyAdmin(adminId);
        
        let data: any = {};
        let notifMsg = "";

        // DEBUG : On affiche l'action reçue
    console.log(`👑 ADMIN ACTION: ${action} sur ${targetId}`);

    switch(action) {
        case 'GIVE_BERRYS':
            data = { berrys: { increment: amount || 0 } };
            notifMsg = `L'administration vous a versé ${amount} Berrys.`;
            break;
            
        case 'GIVE_XP':
            data = { xp: { increment: amount || 0 } };
            notifMsg = `Vous avez reçu ${amount} XP divine.`;
            break;
            
        case 'BAN':
            data = { faction: 'BANNIS', equipage_id: null };
            notifMsg = "Votre compte a été suspendu.";
            break;
            
        case 'RESET_ENERGY':
            data = { energie_actuelle: 10 };
            notifMsg = "Votre énergie a été restaurée.";
            break;

        case 'RESET_FULL':
            console.log(`⚠️ RESET TOTAL EN COURS POUR ${targetId}`);
            
            try {
                // 1. D'abord, on supprime TOUTES les données liées (Nettoyage propre)
                // On utilise deleteMany pour éviter les erreurs si rien n'existe
                await this.prisma.inventaire.deleteMany({ where: { joueur_id: targetId } });
                await this.prisma.joueur_titres.deleteMany({ where: { joueur_id: targetId } });
                await this.prisma.joueur_quetes.deleteMany({ where: { joueur_id: targetId } });
                await this.prisma.joueur_competences.deleteMany({ where: { joueur_id: targetId } });
                await this.prisma.demandes_adhesion.deleteMany({ where: { joueur_id: targetId } });

                // 2. On prépare les données de remise à zéro
                data = { 
                    // Identité
                    faction: null, 
                    titre_actuel: null,
                    equipage_id: null,
                    prime: 0, // Prisma convertit le 0 en BigInt automatiquement

                    // Progression
                    niveau: 1, 
                    xp: 0, 
                    berrys: 0, // Ou 100 selon ton schema, mais 0 pour un hard reset c'est mieux
                    points_carac: 5,
                    chapitre_actuel: 1,
                    etape_actuelle: 1,
                    localisation_id: 1, // Retour case départ

                    // Stats (Valeurs par défaut du schema)
                    force: 10,
                    defense: 5,
                    agilite: 1,
                    vitalite: 1,
                    intelligence: 1,
                    sagesse: 1,
                    chance: 1,
                    
                    // État
                    pv_actuel: 100, 
                    pv_max: 100,
                    pv_max_base: 100, 
                    energie_actuelle: 10,
                    
                    // Combat / PvP
                    deck_combat: [],
                    victoires: 0,
                    defaites: 0,
                    elo_pvp: 0,
                    victoires_pvp: 0,
                    defaites_pvp: 0,
                    
                    // Divers Compteurs (BigInt safe)
                    xp_donnee_equipage: 0,
                    berrys_depenses_shop: 0,
                    berrys_mises_casino: 0,
                    nb_expeditions_reussies: 0,
                    nb_crafts: 0,
                    nb_coffres_ouverts: 0,
                    nb_activites: 0
                };
                notifMsg = "⚠️ Votre compte a été entièrement réinitialisé.";
            } catch (error) {
                console.error("❌ Erreur pendant le nettoyage du Reset :", error);
                throw new InternalServerErrorException("Erreur lors du reset des données liées.");
            }
            break;
    }

    // Exécution de la mise à jour
    try {
        await this.prisma.joueurs.update({ where: { id: targetId }, data });
        // Notification (si ce n'est pas un ban/reset qui supprime l'accès)
        await this.notifyPlayer(targetId, "Message Système", notifMsg, "INFO");
    } catch (e) {
        console.error("❌ Erreur UPDATE JOUEUR :", e);
        throw new InternalServerErrorException("Impossible de mettre à jour le joueur.");
    }
    
    return { success: true, message: `Action ${action} effectuée sur ${targetId}` };
    }

    // 3. Broadcast (Message à tout le serveur)
    async adminBroadcast(adminId: string, titre: string, message: string) {
        await this.verifyAdmin(adminId);
        const allIds = await this.prisma.joueurs.findMany({ select: { id: true } });
        
        const data = allIds.map(p => ({
            joueur_id: p.id, titre, message, type: 'INFO', lu: false
        }));

        await this.prisma.notifications.createMany({ data });
        return { count: allIds.length, success: true };
    }

// 1. Récupérer mes notifications (Triées : Non lues d'abord, puis par date)
  async getMyNotifications(userId: string) {
      return this.prisma.notifications.findMany({
          where: { joueur_id: userId },
          orderBy: [
              { lu: 'asc' },        // Les "False" (Non lues) en premier
              { created_at: 'desc' } // Les plus récentes en premier
          ],
          take: 50 // On ne récupère que les 50 dernières pour ne pas surcharger
      });
  }

  // 2. Marquer une notification comme lue
  async readNotification(userId: string, notificationId: string) {
      // On utilise updateMany pour s'assurer que la notif appartient bien au joueur
      // (Sécurité : ça évite qu'un joueur valide les notifs d'un autre)
      await this.prisma.notifications.updateMany({
          where: { 
              id: notificationId, 
              joueur_id: userId 
          },
          data: { lu: true }
      });

      return { success: true };
  }
    // Helper interne
    async notifyPlayer(userId: string, titre: string, message: string, type = 'INFO') {
        return this.prisma.notifications.create({
            data: { joueur_id: userId, titre, message, type }
        });
    }
    
// =================================================================
  // 🛠️ DEBUG : RESET COMPLET DU JOUEUR
  // =================================================================
  async debugResetPlayer(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    if (!joueur) throw new BadRequestException("Joueur introuvable");


    await this.prisma.$transaction([
        // 1. VIDER LES TABLES LIÉES
        this.prisma.inventaire.deleteMany({ where: { joueur_id: userId } }),
        this.prisma.joueur_competences.deleteMany({ where: { joueur_id: userId } }),
        this.prisma.joueur_titres.deleteMany({ where: { joueur_id: userId } }),
        this.prisma.quetes_journalieres.deleteMany({ where: { joueur_id: userId } }),
        this.prisma.combats.deleteMany({ where: { OR: [{ joueur_id: userId }, { adversaire_id: userId }] } }),
        // this.prisma.messages.deleteMany({ where: { joueur_id: userId } }), // On peut garder l'historique tchat si on veut
        
        // 2. REMETTRE LE JOUEUR À ZÉRO
        this.prisma.joueurs.update({
            where: { id: userId },
            data: {
                // 🔥 RESET FACTION (Pour réafficher le sélecteur)
                faction: null, 
                
                // Progression Histoire
                chapitre_actuel: 1,
                etape_actuelle: 1,
                
                // Stats de base
                niveau: 1,
                xp: 0,
                berrys: 1000, 
                points_carac: 5, // Pour le tuto
                
                // Attributs
                force: 0,
                defense: 0,
                agilite: 0,
                vitalite: 0,
                intelligence: 0,
                sagesse: 0,
                chance: 0,
                
                // État
                pv_actuel: 100,
                pv_max_base: 100,
                energie_actuelle: 10,
                
                // Nettoyage Social
                equipage_id: null,
                titre_actuel: null,
                prime: 0,
                
                // Nettoyage Combat
                deck_combat: [], 
                victoires: 0,
                defaites: 0,
                
                // Nettoyage Timers
                expedition_fin: null,
                derniere_fouille: null
            }
        })
    ]);

    await this.clearCache(userId);
    return { success: true, message: "♻️ Personnage réinitialisé (Faction incluse) !" };
  }

  // =================================================================
  // 🗺️ SYSTÈME DE NAVIGATION V2 (Temps Réel)
  // =================================================================

  // 1. RÉCUPÉRER LA CARTE (Par Océan)
async getMapData(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: userId },
        include: { localisation: true } 
    });
    
    if (!joueur) throw new BadRequestException("Joueur introuvable");

    const currentOcean = joueur.localisation?.ocean || 'EAST_BLUE';

    const islands = await this.prisma.destinations.findMany({
      where: { ocean: currentOcean },
      select: {
          id: true,
          nom: true,
          pos_x: true,
          pos_y: true,
          type: true,
          niveau_requis: true,
          ocean: true,
          // 👇 AJOUTE CES DEUX LIGNES :
          description: true,
          facilities: true 
      }
  });

    return {
        currentLocation: joueur.localisation,
        travelStatus: {
            state: joueur.statut_voyage,
            destinationId: joueur.trajet_arrivee_id,
            arrivalTime: joueur.trajet_fin,
            departId: joueur.trajet_depart_id
        },
        map: islands
    };
  }

  // 2. LANCER UN VOYAGE (Calcul Distance & Temps)
  async startTravel(userId: string, destinationId: number) {
    const joueur = await this.prisma.joueurs.findUnique({ 
        where: { id: userId },
        include: { localisation: true } // On a besoin de savoir d'où il part
    });

    if (!joueur) throw new BadRequestException("Joueur inconnu.");
    if (joueur.statut_voyage === 'EN_MER') throw new BadRequestException("Tu navigues déjà !");
    if (!joueur.localisation) throw new BadRequestException("Position inconnue (Bug).");
    if (joueur.localisation.id === destinationId) throw new BadRequestException("Tu y es déjà.");

    const destination = await this.prisma.destinations.findUnique({ where: { id: destinationId } });
    if (!destination) throw new BadRequestException("Destination inconnue.");

    // --- CALCUL DE DISTANCE (Pythagore) ---
    const x1 = joueur.localisation.pos_x;
    const y1 = joueur.localisation.pos_y;
    const x2 = destination.pos_x;
    const y2 = destination.pos_y;

    // Distance euclidienne
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    // --- CALCUL DU TEMPS ---
    // Vitesse de base : 10 unités / minute
    // Bonus vitesse navire : +10% par niveau de navire
    const vitesseNavire = 10 * (1 + ((joueur.niveau_navire || 1) * 0.1));
    
    // Temps en minutes = Distance / Vitesse * Facteur d'échelle (ex: 5 pour rendre ça plus lent/rapide)
    let dureeMinutes = Math.ceil((distance / vitesseNavire) * 5);
    
    // Minimum 1 minute de trajet
    if (dureeMinutes < 1) dureeMinutes = 1;

    // Calcul de la date d'arrivée
    const arrivalTime = new Date(Date.now() + dureeMinutes * 60 * 1000);

    // Mise à jour BDD
    await this.prisma.joueurs.update({
        where: { id: userId },
        data: {
            statut_voyage: 'EN_MER',
            trajet_depart_id: joueur.localisation.id,
            trajet_arrivee_id: destinationId,
            trajet_fin: arrivalTime,
            localisation_id: null // On quitte l'île, on est nulle part (en mer)
        }
    });

    return {
        success: true,
        message: `Cap sur ${destination.nom} !`,
        duree: dureeMinutes,
        arrivalTime: arrivalTime
    };
  }

  // 3. VÉRIFIER L'ARRIVÉE (Appelé par le front ou périodiquement)
  async checkTravelArrival(userId: string) {
    const joueur = await this.prisma.joueurs.findUnique({ where: { id: userId } });
    
    if (!joueur || joueur.statut_voyage !== 'EN_MER' || !joueur.trajet_fin) {
        return { status: 'A_QUAI', message: "Pas de voyage en cours." };
    }

    // Est-ce qu'on est arrivé ?
    if (new Date() > new Date(joueur.trajet_fin)) {
        
        // ARRIVÉE !
        const destination = await this.prisma.destinations.findUnique({ 
            where: { id: joueur.trajet_arrivee_id! } 
        });

        if (!destination) {
            // Cas d'erreur critique : on le renvoie au départ
            await this.prisma.joueurs.update({
                where: { id: userId },
                data: { statut_voyage: 'A_QUAI', localisation_id: joueur.trajet_depart_id }
            });
            return { status: 'ERREUR', message: "Destination perdue en mer..." };
        }

        // Mise à jour : On est arrivé
        await this.prisma.joueurs.update({
            where: { id: userId },
            data: {
                statut_voyage: 'A_QUAI',
                localisation_id: destination.id,
                trajet_fin: null,
                trajet_depart_id: null,
                trajet_arrivee_id: null
            }
        });

        // 🔔 Notification d'arrivée
        await this.notifyPlayer(userId, "⚓ Terre en vue !", `Vous êtes arrivé à ${destination.nom}.`, "SUCCESS");

        return { 
            status: 'ARRIVED', 
            destination: destination,
            message: `Bienvenue à ${destination.nom} !` 
        };
    }

    // Toujours en mer
    const timeLeft = Math.ceil((new Date(joueur.trajet_fin).getTime() - Date.now()) / 1000);
    return { status: 'EN_MER', timeLeftSeconds: timeLeft, message: "Navigation en cours..." };
  }
}

