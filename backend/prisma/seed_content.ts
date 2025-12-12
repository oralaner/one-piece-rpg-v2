import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto'; // ✅ Import nécessaire pour randomUUID

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Seeding Contenu SPÉCIAL HISTOIRE...');

  // =========================================================
  // 1. CRÉATION DES ITEMS D'HISTOIRE
  // =========================================================
const storyItems = [
    { 
        nom: "Pistolet basique", 
        prix: 500, 
        type: "MAIN_DROITE", 
        cat: "Équipement", 
        rarete: "Commun", 
        img: "pistolet_du_pirate.png", 
        stats: { force: 2, agilite: 3 },
        desc: "Une arme de dotation standard de la Marine."
    }, 
    
    // --- CHAPITRE 4 : CRAFT & RESSOURCES ---
    { 
        nom: "Chanvre", 
        prix: 20, 
        type: "RESSOURCE", 
        cat: "Ressource", 
        rarete: "Commun", 
        img: "chanvre.png", 
        stats: {}, 
        desc: "Fibre naturelle épaisse, idéale pour la fabrication de cordages.",
        en_boutique: false // Non achetable, uniquement par récolte
    },
    { 
        nom: "Outils", 
        prix: 1000, 
        type: "MATERIAU", 
        cat: "Ressource", 
        rarete: "Commun", 
        img: "tools.png", 
        stats: {}, 
        desc: "Outils de base pour l'artisanat. Utilisé pour les tutoriels de Craft.",
        en_boutique: false // Donné par le PNJ
    },
    { 
        nom: "Corde de Fortification", // Nom complet du craft Marine
        prix: 150, 
        type: "CONSOMMABLE", 
        cat: "Consommable", 
        rarete: "Commun", 
        img: "rope_fortification.png", 
        stats: {}, 
        desc: "Corde solide utilisée pour sécuriser de gros débris. Se consume à l'usage.",
        en_boutique: false 
    },
    { 
        nom: "Corde", // Nom générique du craft Pirate/Révolutionnaire
        prix: 150, 
        type: "CONSOMMABLE", 
        cat: "Consommable", 
        rarete: "Commun", 
        img: "rope_standard.png", 
        stats: {}, 
        desc: "Corde tressée robuste, idéale pour les manœuvres rapides. Se consume à l'usage.",
        en_boutique: false 
    },

    // --- ANNEAUX DE RÉCOMPENSE ---
    { 
        nom: "Anneau du Marine", 
        prix: 50000, 
        type: "BAGUE", // Catégorie d'équipement pour le slot
        cat: "Équipement", 
        rarete: "Rare", 
        img: "marine_ring.png", 
        stats: { defense: 2, intelligence: 2 }, 
        desc: "Symbole de loyauté. +2 DEF, +2 INT." 
    },
    { 
        nom: "Anneau du Pirate", 
        prix: 50000, 
        type: "BAGUE", 
        cat: "Équipement", 
        rarete: "Rare", 
        img: "pirate_ring.png", 
        stats: { force: 2, chance: 2 }, 
        desc: "Anneau marqué par la mer. +2 FOR, +2 CHA." 
    },
    { 
        nom: "Anneau du Révolutionnaire", 
        prix: 50000, 
        type: "BAGUE", 
        cat: "Équipement", 
        rarete: "Rare", 
        img: "rev_ring.png", 
        stats: { agilite: 2, sagesse: 2 }, 
        desc: "Anneau discret de l'armée. +2 AGI, +2 SAG." 
    },
    {
        nom: "Plans Révolutionnaires",
        prix: 0,
        type: "QUETE",
        cat: "Quête",
        rarete: "Épique",
        img: "secret_plans.png",
        stats: {},
        desc: "Plans détaillés des mouvements de la Marine."
    }
];

  for (const i of storyItems) {
    // Petit hack pour le type equipement : si c'est RESSOURCE, on met null
    const typeEquip = i.type === "RESSOURCE" ? null : i.type;

    await prisma.objets.upsert({
        where: { nom: i.nom },
        update: {
            description: i.desc,
            en_boutique: false,
            est_lootable: false,
            est_craftable: false,
            stats_bonus: i.stats
        },
        create: {
            nom: i.nom,
            description: i.desc,
            prix_achat: i.prix,
            prix_vente: 0, 
            type_equipement: typeEquip,
            categorie: i.cat,
            rarete: i.rarete,
            image_url: `/items/${i.img}`, // On remet le path ici
            stats_bonus: i.stats,
            est_unique: false,
            en_boutique: false, 
            est_lootable: false,
            est_craftable: false,
            soin: 0,
            stock: 999
        }
    });
    console.log(`📦 Item Histoire : ${i.nom}`);
  }

  // =========================================================
  // 2. CRÉATION DES BOTS D'HISTOIRE
  // =========================================================
  
  const storyBots = [
    { 
        pseudo: "Pirate Évadé", 
        faction: "Pirate", 
        niveau: 1, 
        force: 5, defense: 0, agilite: 5, pv: 60, 
        xp: 50, berrys: 100,
        skills: [1] // Direct du Droit
    },
    { 
        pseudo: "Garde Royal", 
        faction: "Marine", 
        niveau: 1, 
        force: 5, defense: 0, agilite: 5, pv: 60, 
        xp: 50, berrys: 100,
        skills: [1] // Direct du Droit
    },
    {
        pseudo: "Agent du Cipher Pol",
        faction: "Marine",
        niveau: 1,
        force: 5, defense: 0, agilite: 5, pv: 60,
        xp: 50, berrys: 100,
        skills: [1] // Direct du Droit
    },
  // --- CHAPITRE 2 ---
    { 
        pseudo: "Pirate à Massue", // Marine Chap 2
        faction: "Pirate", 
        niveau: 2, 
        force: 8, defense: 2, agilite: 3, pv: 90, 
        xp: 100, berrys: 200,
        skills: [3] // Charge
    },
    { 
        pseudo: "Recrue de la Marine", // Pirate Chap 2
        faction: "Marine", 
        niveau: 2, 
        force: 7, defense: 3, agilite: 4, pv: 85, 
        xp: 100, berrys: 200,
        skills: [20] // Coupe Verticale
    },
    { 
        pseudo: "Élève du Dojo", // Révolutionnaire Chap 2
        faction: "Marine", // Ou Neutre, mais Marine pour simplifier le système PVP
        niveau: 2, 
        force: 9, defense: 1, agilite: 6, pv: 80, 
        xp: 100, berrys: 200,
        skills: [20, 21] // Coupe, Estocade
    },
    { 
        pseudo: "Pirate de Buggy (Élite)", // Marine Chap 3
        faction: "Pirate", 
        niveau: 3, 
        force: 10, defense: 5, agilite: 5, pv: 120, 
        xp: 150, berrys: 300,
        skills: [3, 22] // Charge, Coup de Poing
    },
    { 
        pseudo: "Mohji le Dompteur", // Pirate Chap 3
        faction: "Pirate", 
        niveau: 3, 
        force: 10, defense: 5, agilite: 5, pv: 120, 
        xp: 150, berrys: 300,
        skills: [1] 
    },
    { 
        pseudo: "Lieutenant Pirate Corrompu", // Révolutionnaire Chap 3
        faction: "Pirate", 
        niveau: 3, 
        force: 10, defense: 5, agilite: 5, pv: 120, 
        xp: 150, berrys: 300,
        skills: [3, 20] 
    },
  ];

  for (const b of storyBots) {
      await prisma.joueurs.deleteMany({ where: { pseudo: b.pseudo, is_bot: true } });

      const newBot = await prisma.joueurs.create({
          data: {
              id: crypto.randomUUID(), // Utilisation correcte de crypto
              pseudo: b.pseudo,
              // ❌ EMAIL RETIRÉ (C'était l'erreur)
              faction: b.faction,
              niveau: b.niveau,
              force: b.force,
              defense: b.defense,
              agilite: b.agilite,
              vitalite: 5,
              intelligence: 5,
              sagesse: 5,
              chance: 5,
              pv_actuel: b.pv,
              pv_max_base: b.pv,
              pv_max: b.pv, 
              energie_actuelle: 10, // Max énergie par défaut
              xp: 0, 
              berrys: b.berrys,
              is_bot: true,
              deck_combat: [] // Initialisé vide
          }
      });

      // Ajout des compétences
      for (const skillId of b.skills) {
          const skillExists = await prisma.competences.findUnique({ where: { id: skillId } });
          if (skillExists) {
              await prisma.joueur_competences.create({
                  data: {
                      joueur_id: newBot.id,
                      competence_id: skillId
                  }
              });
          }
      }
      
      // On lui équipe son deck
      await prisma.joueurs.update({
          where: { id: newBot.id },
          data: { deck_combat: b.skills }
      });

      console.log(`🤖 Bot Histoire : ${b.pseudo} (Niv ${b.niveau})`);
  }

  console.log('✅ Seeding Histoire Terminé !');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());