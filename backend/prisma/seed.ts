import { PrismaClient, IslandType, Ocean, Facility } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // 1. NETTOYAGE (Optionnel : supprime les anciens bots pour éviter les doublons)
  await prisma.joueurs.deleteMany({ where: { is_bot: true } });
  
  // --------------------------------------------------------
  // 2. CRÉATION DES COMPÉTENCES JOUEURS (ATTAQUES)
  // --------------------------------------------------------

console.log('🧹 Nettoyage complet des compétences...');

  // 1. D'abord, on supprime les liens Joueur-Compétence (Clé étrangère)
  // Cela permet de supprimer les compétences ensuite sans erreur de liaison.
  await prisma.joueur_competences.deleteMany({});

  // 2. Ensuite, on vide la table des Compétences
  await prisma.competences.deleteMany({});
  
  console.log('🗑️ Tables nettoyées. Injection des nouvelles données...');

  const playerSkills = [
    // --- 👊 MÊLÉE (MAINS NUES) ---
    { id: 1, nom: "Direct du Droit", description: "Un coup de poing basique rapide et fiable.", puissance: 15, precision: 95, cooldown: 0, cout_achat: 100, type: "PHYSIQUE" },
    { id: 2, nom: "Coup de Pied Bas", description: "Vise les jambes pour déstabiliser l'adversaire.", puissance: 25, precision: 92, cooldown: 1, cout_achat: 500, type: "PHYSIQUE" },
    { id: 3, nom: "Charge à l'Épaule", description: "Utilise le poids du corps pour bousculer.", puissance: 40, precision: 85, cooldown: 2, cout_achat: 1500, type: "PHYSIQUE" },
    { id: 4, nom: "Uppercut Dévastateur", description: "Un coup montant vers le menton.", puissance: 55, precision: 80, cooldown: 2, cout_achat: 4000, type: "PHYSIQUE" },
    { id: 5, nom: "Coup de Tête", description: "Une attaque brutale et risquée.", puissance: 70, precision: 75, cooldown: 3, cout_achat: 8000, type: "PHYSIQUE" },
    { id: 6, nom: "Moulinet Infernal", description: "Une rotation rapide frappant tout autour.", puissance: 85, precision: 80, cooldown: 3, cout_achat: 15000, type: "PHYSIQUE" },
    { id: 7, nom: "Shigan (Doigt Pistolet)", description: "Le doigt devient aussi dur qu'une balle.", puissance: 100, precision: 90, cooldown: 4, cout_achat: 30000, type: "PHYSIQUE" },
    { id: 8, nom: "Onde de Choc", description: "Projette une onde d'impact pur.", puissance: 130, precision: 100, cooldown: 5, cout_achat: 60000, type: "HAKI" },
    { id: 9, nom: "Griffe du Dragon", description: "Une technique broyant l'acier à mains nues.", puissance: 160, precision: 85, cooldown: 6, cout_achat: 100000, type: "HAKI" },
    { id: 10, nom: "Galaxy Impact", description: "Une onde de choc Haki capable de détruire une ville.", puissance: 250, precision: 70, cooldown: 10, cout_achat: 500000, type: "HAKI" },

    // --- ⚔️ SABRE / ARMES TRANCHANTES ---
    { id: 20, nom: "Coupe Verticale", description: "Un mouvement de base pour tout épéiste.", puissance: 20, precision: 95, cooldown: 0, cout_achat: 200, type: "PHYSIQUE" },
    { id: 21, nom: "Estocade Rapide", description: "Une attaque pointée très rapide.", puissance: 35, precision: 90, cooldown: 1, cout_achat: 800, type: "PHYSIQUE" },
    { id: 22, nom: "Double Lame", description: "Deux coupes croisées simultanées.", puissance: 50, precision: 85, cooldown: 2, cout_achat: 2500, type: "PHYSIQUE" },
    { id: 23, nom: "Lame du Vent", description: "Projette une onde tranchante à distance.", puissance: 60, precision: 90, cooldown: 3, cout_achat: 6000, type: "PHYSIQUE" },
    { id: 24, nom: "Chasseur de Tigre", description: "Une attaque féroce pour chasser une bête.", puissance: 80, precision: 80, cooldown: 3, cout_achat: 12000, type: "PHYSIQUE" },
    { id: 25, nom: "Tourbillon de Fer", description: "L'utilisateur tourne sur lui-même avec ses lames.", puissance: 95, precision: 75, cooldown: 4, cout_achat: 25000, type: "PHYSIQUE" },
    { id: 26, nom: "Chant du Lion", description: "Une coupe 'Iai' ultra-rapide et mortelle.", puissance: 120, precision: 60, cooldown: 5, cout_achat: 50000, type: "PHYSIQUE" },
    { id: 27, nom: "Trois Mille Mondes", description: "La technique secrète tournoyante.", puissance: 150, precision: 85, cooldown: 6, cout_achat: 90000, type: "PHYSIQUE" },
    { id: 28, nom: "Départ Divin (Kamusari)", description: "Une vague de Haki tranchant légendaire.", puissance: 200, precision: 90, cooldown: 8, cout_achat: 200000, type: "HAKI" },
    { id: 29, nom: "Coupe du Meilleur", description: "La coupe capable de fendre un iceberg ou une montagne.", puissance: 300, precision: 70, cooldown: 12, cout_achat: 1000000, type: "PHYSIQUE" },

    // --- 🔫 DISTANCE (TIREUR) ---
    { id: 40, nom: "Tir de Pierre", description: "Un simple projectile lancé au lance-pierre.", puissance: 10, precision: 98, cooldown: 0, cout_achat: 50, type: "DISTANCE" },
    { id: 41, nom: "Tir Rapide", description: "Dégaine et tire instantanément.", puissance: 25, precision: 90, cooldown: 0, cout_achat: 600, type: "DISTANCE" },
    { id: 42, nom: "Balle de Plomb", description: "Une munition lourde pour repousser.", puissance: 40, precision: 85, cooldown: 2, cout_achat: 2000, type: "DISTANCE" },
    { id: 43, nom: "Tir en Rafale", description: "Vide le chargeur sur la cible.", puissance: 55, precision: 75, cooldown: 3, cout_achat: 5000, type: "DISTANCE" },
    { id: 44, nom: "Bille Explosive", description: "Explose à l'impact (Dégâts de zone légers).", puissance: 70, precision: 80, cooldown: 3, cout_achat: 10000, type: "DISTANCE" },
    { id: 45, nom: "Tir de Précision", description: "Prend le temps de viser un point vital.", puissance: 90, precision: 100, cooldown: 4, cout_achat: 20000, type: "DISTANCE" },
    { id: 46, nom: "Étoile de Feu", description: "Un projectile enflammé.", puissance: 110, precision: 85, cooldown: 4, cout_achat: 40000, type: "DISTANCE" },
    { id: 47, nom: "Loup d'Impact", description: "Une onde de choc prenant la forme d'un loup.", puissance: 140, precision: 90, cooldown: 5, cout_achat: 80000, type: "DISTANCE" },
    { id: 48, nom: "Canon Van Augur", description: "Un tir longue portée supersonique.", puissance: 180, precision: 95, cooldown: 7, cout_achat: 150000, type: "DISTANCE" },
    { id: 49, nom: "King's Snipe", description: "Abat un ennemi depuis une autre île.", puissance: 220, precision: 80, cooldown: 9, cout_achat: 400000, type: "DISTANCE" },

    // --- 🍎 FRUITS DU DÉMON ---
    // GOMU GOMU NO MI
    { id: 100, nom: "Gomu Gomu no Pistol", description: "Un coup de poing étiré de base.", puissance: 40, precision: 90, cooldown: 1, cout_achat: 5000, type: "ELASTIQUE" },
    { id: 101, nom: "Gomu Gomu no Rocket", description: "Se propulse sur l'ennemi.", puissance: 60, precision: 80, cooldown: 2, cout_achat: 15000, type: "ELASTIQUE" },
    { id: 102, nom: "Gomu Gomu no Gatling", description: "Une pluie de coups rapides.", puissance: 90, precision: 75, cooldown: 4, cout_achat: 40000, type: "ELASTIQUE" },
    { id: 103, nom: "Gomu Gomu no Elephant Gun", description: "Poing géant renforcé au Haki.", puissance: 150, precision: 70, cooldown: 6, cout_achat: 100000, type: "ELASTIQUE" },
    { id: 104, nom: "King Cobra", description: "Attaque guidée imprévisible (Snakeman).", puissance: 220, precision: 95, cooldown: 8, cout_achat: 300000, type: "ELASTIQUE" },

    // MERA MERA NO MI
    { id: 110, nom: "Higan (Pistolet feu)", description: "Tire des balles de feu des doigts.", puissance: 45, precision: 90, cooldown: 1, cout_achat: 8000, type: "FEU" },
    { id: 111, nom: "Hiken (Poing Ardent)", description: "Un poing de feu géant signature.", puissance: 80, precision: 85, cooldown: 3, cout_achat: 25000, type: "FEU" },
    { id: 112, nom: "Hashira (Pilier)", description: "Crée un pilier de feu défensif/offensif.", puissance: 100, precision: 100, cooldown: 4, cout_achat: 50000, type: "FEU" },
    { id: 113, nom: "Jujika (Croix de Feu)", description: "Tir en forme de croix.", puissance: 140, precision: 80, cooldown: 5, cout_achat: 120000, type: "FEU" },
    { id: 114, nom: "Entei (Empereur des Flammes)", description: "Une boule de feu solaire massive.", puissance: 300, precision: 60, cooldown: 12, cout_achat: 500000, type: "FEU" },

    // GORO GORO NO MI
    { id: 120, nom: "Vari (Décharge)", description: "Libère une décharge électrique.", puissance: 50, precision: 95, cooldown: 2, cout_achat: 10000, type: "FOUDRE" },
    { id: 121, nom: "Sango (Éclair)", description: "Fait tomber la foudre.", puissance: 85, precision: 90, cooldown: 3, cout_achat: 30000, type: "FOUDRE" },
    { id: 122, nom: "El Thor", description: "Jugement divin céleste.", puissance: 120, precision: 80, cooldown: 5, cout_achat: 70000, type: "FOUDRE" },
    { id: 123, nom: "Oiseau Tonnerre (Hino)", description: "Projectile en forme d'oiseau.", puissance: 150, precision: 95, cooldown: 6, cout_achat: 150000, type: "FOUDRE" },
    { id: 124, nom: "Raigo (Royaume du Tonnerre)", description: "Anéantissement total d'une zone.", puissance: 280, precision: 65, cooldown: 12, cout_achat: 600000, type: "FOUDRE" },

    // HIE HIE NO MI
    { id: 130, nom: "Ice Saber", description: "Crée un sabre de glace.", puissance: 45, precision: 90, cooldown: 1, cout_achat: 8000, type: "GLACE" },
    { id: 131, nom: "Ice Ball", description: "Enferme l'ennemi dans la glace.", puissance: 70, precision: 100, cooldown: 3, cout_achat: 25000, type: "GLACE" },
    { id: 132, nom: "Partisan", description: "Lance des javelots de glace.", puissance: 100, precision: 85, cooldown: 4, cout_achat: 60000, type: "GLACE" },
    { id: 133, nom: "Pheasant Beak", description: "Un faisan de glace massif.", puissance: 160, precision: 80, cooldown: 6, cout_achat: 130000, type: "GLACE" },
    { id: 134, nom: "Ice Age", description: "Gèle tout l'environnement.", puissance: 260, precision: 100, cooldown: 10, cout_achat: 550000, type: "GLACE" },

    // OPE OPE NO MI
    { id: 140, nom: "Room : Shambles", description: "Échange de position tactique.", puissance: 30, precision: 100, cooldown: 2, cout_achat: 12000, type: "SPECIAL" },
    { id: 141, nom: "Tact", description: "Fait léviter les objets alentours.", puissance: 70, precision: 90, cooldown: 3, cout_achat: 35000, type: "SPECIAL" },
    { id: 142, nom: "Injection Shot", description: "Tir précis visant l'intérieur du corps.", puissance: 110, precision: 95, cooldown: 4, cout_achat: 80000, type: "SPECIAL" },
    { id: 143, nom: "Counter Shock", description: "Choc électrique type défibrillateur.", puissance: 140, precision: 85, cooldown: 5, cout_achat: 160000, type: "SPECIAL" },
    { id: 144, nom: "Gamma Knife", description: "Détruit les organes internes (Radioactif).", puissance: 240, precision: 90, cooldown: 8, cout_achat: 450000, type: "SPECIAL" }
  ];

// 🔄 INJECTION DES COMPÉTENCES (CORRIGÉE)
  for (const skill of playerSkills) {
    // 1. On sépare les champs problématiques :
    // - 'id' (on ne l'update pas)
    // - 'type' (ce nom n'existe pas en BDD, c'est 'type_degats')
    // - '...skillData' (le reste : nom, puissance, etc.)
    const { id, type, ...skillData } = skill;

    await prisma.competences.upsert({
      where: { id: id },
      
      update: {
        ...skillData,        // Nom, Description, Puissance...
        type_degats: type,   // ✅ MAPPING : On met 'type' dans 'type_degats'
        est_achetable: true,
        exclusif_pnj: false
      },
      
      create: {
        id: id,              // À la création, on force l'ID
        ...skillData,
        type_degats: type,   // ✅ MAPPING ICI AUSSI
        est_achetable: true,
        exclusif_pnj: false
      }
    });
  }

  console.log(`✅ ${playerSkills.length} compétences injectées avec succès.`);

 // =================================================================
  // 3. CRÉATION DES BOTS (PERSONNAGES ONE PIECE)
  // =================================================================
  console.log('🤖 Création des Boss et Personnages...');

  // Nettoyage des bots existants
  await prisma.joueurs.deleteMany({ where: { is_bot: true } });

  const bots = [
    // --- EAST BLUE (Niveau 1 - 20) ---
    {
      pseudo: "Higuma le Brigand",
      niveau: 1,
      faction: "Pirate",
      pv_max: 150, force: 10, defense: 5, vitesse: 5,
      // Skills : Direct du Droit, Coup de Pied Bas
      skill_ids: [1, 2], 
      avatar: "boss/Higuma.png"
    },
    {
      pseudo: "Morgan le Bûcheron",
      niveau: 10,
      faction: "Marine",
      pv_max: 300, force: 25, defense: 15, vitesse: 10,
      // Skills : Coupe Verticale (Hache), Charge à l'épaule
      skill_ids: [20, 3],
      avatar: "boss/Morgan.png"
    },
    {
      pseudo: "Capitaine Kuro",
      niveau: 20,
      faction: "Pirate",
      pv_max: 500, force: 40, defense: 20, vitesse: 50,
      // Skills : Estocade Rapide (Griffes), Pas de l'ombre (Moulinet)
      skill_ids: [21, 6],
      avatar: "boss/Kuro.png"
    },

    // --- GRAND LINE (Niveau 30 - 60) ---
    {
      pseudo: "Arlong la Scie",
      niveau: 30,
      faction: "Pirate",
      pv_max: 1000, force: 80, defense: 60, vitesse: 30,
      // Skills : Charge, Morsure (simulée par Coup de Tête), Eau (Tir de Pierre)
      skill_ids: [3, 5, 40],
      avatar: "boss/Arlong.png"
    },
    {
      pseudo: "Rob Lucci (CP9)",
      niveau: 50,
      faction: "Marine",
      pv_max: 2000, force: 150, defense: 100, vitesse: 120,
      // Skills : Shigan, Rankyaku (Lame vent), Tekkai (simulé par stat defense)
      skill_ids: [7, 23, 4],
      avatar: "boss/Lucci.png"
    },
    {
      pseudo: "Van Augur",
      niveau: 60,
      faction: "Pirate",
      pv_max: 1800, force: 100, defense: 50, vitesse: 100,
      // Skills : Full Sniper (Tir Précision, Canon Augur, Balle Explosive)
      skill_ids: [45, 48, 44, 41],
      avatar: "boss/Van_Augur.png"
    },

    // --- NEW WORLD (Niveau 80 - 100) ---
    {
      pseudo: "Portgas D. Ace",
      niveau: 80,
      faction: "Pirate",
      pv_max: 5000, force: 300, defense: 200, vitesse: 250,
      // Skills : Full Mera Mera no Mi
      skill_ids: [110, 111, 112, 113, 114], // Higan, Hiken, Hashira, Jujika, Entei
      avatar: "boss/Ace.png"
    },
    {
      pseudo: "Dieu Enel",
      niveau: 90,
      faction: "Pirate",
      pv_max: 6000, force: 350, defense: 150, vitesse: 400,
      // Skills : Full Goro Goro (Foudre)
      skill_ids: [120, 121, 122, 123, 124], 
      avatar: "boss/Ener.png"
    },
    {
      pseudo: "Amiral Aokiji",
      niveau: 100,
      faction: "Marine",
      pv_max: 12000, force: 500, defense: 400, vitesse: 300,
      // Skills : Full Hie Hie (Glace) + Ice Saber
      skill_ids: [130, 131, 132, 133, 134],
      avatar: "boss/Aokiji.png"
    },

    // --- YONKO & LEGENDS (Niveau 150+) ---
    {
      pseudo: "Dracule Mihawk",
      niveau: 150,
      faction: "Pirate",
      pv_max: 20000, force: 900, defense: 600, vitesse: 700,
      // Skills : Full Épéiste Ultime
      skill_ids: [20, 23, 27, 28, 29], // Coupe, Lame Vent, 3000 Mondes, Kamusari, Coupe Meilleur
      avatar: "boss/Mihawk.png"
    },
    {
      pseudo: "Trafalgar Law",
      niveau: 140,
      faction: "Pirate",
      pv_max: 15000, force: 600, defense: 500, vitesse: 600,
      // Skills : Ope Ope no Mi (Chirurgien)
      skill_ids: [140, 141, 142, 143, 144],
      avatar: "boss/Law.png"
    },
    {
      pseudo: "Monkey D. Luffy (Gear 5)",
      niveau: 160,
      faction: "Pirate",
      pv_max: 25000, force: 1000, defense: 800, vitesse: 800,
      // Skills : Gomu Gomu + Haki Ultime
      skill_ids: [102, 103, 104, 9, 10], // Gatling, Elephant Gun, King Cobra, Griffe Dragon, Galaxy Impact
      avatar: "boss/Luffy.png"
    }
  ];

  for (const bot of bots) {
    // 1. Création du bot
    const newBot = await prisma.joueurs.create({
      data: {
        id: crypto.randomUUID(),
        pseudo: bot.pseudo,
        is_bot: true,
        niveau: bot.niveau,
        faction: bot.faction,
        avatar_url: bot.avatar,
        
        // Stats
        pv_max: bot.pv_max,
        pv_max_base: bot.pv_max,
        pv_actuel: bot.pv_max,
        force: bot.force,
        defense: bot.defense,
        agilite: bot.vitesse,
        intelligence: 20,
        sagesse: 20,
        chance: 20,
        vitalite: Math.floor(bot.pv_max / 5),
        
        // Initialisation Deck vide
        deck_combat: [] 
      }
    });

    // 2. Apprentissage des Skills (Grimoire)
    // On boucle sur tous les IDs définis pour ce bot
    for (const skillId of bot.skill_ids) {
        await prisma.joueur_competences.create({
            data: {
                joueur_id: newBot.id,
                competence_id: skillId
            }
        });
    }

    // 3. Équipement du Deck (On met les 5 premiers skills max)
    const deck = bot.skill_ids.slice(0, 5); // Max 5 skills dans le deck
    
    await prisma.joueurs.update({
        where: { id: newBot.id },
        data: { deck_combat: deck }
    });

    console.log(`✅ ${bot.pseudo} (Niv ${bot.niveau}) créé avec ${deck.length} techniques.`);
  }

    // --------------------------------------------------------
  // 4. CRÉATION DES TITRES (TITRES_REF)
  // --------------------------------------------------------
  console.log('🏆 Création/Mise à jour des titres...');

  const titres = [
    // --- FACTION : RÉVOLUTIONNAIRE ---
    { nom: "Recrue Révolutionnaire", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 5, description: "Atteindre le niveau 5 chez les Révolutionnaires" },
    { nom: "Soldat de l'Armée", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 10, description: "Atteindre le niveau 10 chez les Révolutionnaires" },
    { nom: "Sergent Révolutionnaire", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 20, description: "Atteindre le niveau 20 chez les Révolutionnaires" },
    { nom: "Adjudant", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 30, description: "Atteindre le niveau 30 chez les Révolutionnaires" },
    { nom: "Major", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 40, description: "Atteindre le niveau 40 chez les Révolutionnaires" },
    { nom: "Lieutenant Révolutionnaire", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 50, description: "Atteindre le niveau 50 chez les Révolutionnaires" },
    { nom: "Capitaine Révolutionnaire", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 75, description: "Atteindre le niveau 75 chez les Révolutionnaires" },
    { nom: "Commandant de l'Armée", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 100, description: "Atteindre le niveau 100 chez les Révolutionnaires" },
    { nom: "Élite Révolutionnaire", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 150, description: "Atteindre le niveau 150 chez les Révolutionnaires" },
    { nom: "Général de l'Armée", condition_type: "LEVEL_REVOLUTIONNAIRE", condition_valeur: 200, description: "Atteindre le niveau 200 chez les Révolutionnaires" },

    // --- FACTION : MARINE ---
    { nom: "Recrue de la Marine", condition_type: "LEVEL_MARINE", condition_valeur: 5, description: "Atteindre le niveau 5 dans la Marine" },
    { nom: "Officier", condition_type: "LEVEL_MARINE", condition_valeur: 10, description: "Atteindre le niveau 10 dans la Marine" },
    { nom: "Lieutenant de la Marine", condition_type: "LEVEL_MARINE", condition_valeur: 20, description: "Atteindre le niveau 20 dans la Marine" },
    { nom: "Commandant de la Marine", condition_type: "LEVEL_MARINE", condition_valeur: 30, description: "Atteindre le niveau 30 dans la Marine" },
    { nom: "Colonel", condition_type: "LEVEL_MARINE", condition_valeur: 40, description: "Atteindre le niveau 40 dans la Marine" },
    { nom: "Capitaine de la Marine", condition_type: "LEVEL_MARINE", condition_valeur: 50, description: "Atteindre le niveau 50 dans la Marine" },
    { nom: "Commodore", condition_type: "LEVEL_MARINE", condition_valeur: 75, description: "Atteindre le niveau 75 dans la Marine" },
    { nom: "Contre-Amiral", condition_type: "LEVEL_MARINE", condition_valeur: 100, description: "Atteindre le niveau 100 dans la Marine" },
    { nom: "Vice-Amiral", condition_type: "LEVEL_MARINE", condition_valeur: 150, description: "Atteindre le niveau 150 dans la Marine" },
    { nom: "Amiral", condition_type: "LEVEL_MARINE", condition_valeur: 200, description: "Atteindre le niveau 200 dans la Marine" },

    // --- FACTION : PIRATE ---
    { nom: "Mousse", condition_type: "LEVEL_PIRATE", condition_valeur: 5, description: "Atteindre le niveau 5 en tant que Pirate" },
    { nom: "Matelot", condition_type: "LEVEL_PIRATE", condition_valeur: 10, description: "Atteindre le niveau 10 en tant que Pirate" },
    { nom: "Cuisinier", condition_type: "LEVEL_PIRATE", condition_valeur: 20, description: "Atteindre le niveau 20 en tant que Pirate" },
    { nom: "Chirurgien", condition_type: "LEVEL_PIRATE", condition_valeur: 30, description: "Atteindre le niveau 30 en tant que Pirate" },
    { nom: "Timonier", condition_type: "LEVEL_PIRATE", condition_valeur: 40, description: "Atteindre le niveau 40 en tant que Pirate" },
    { nom: "Maître d'équipage", condition_type: "LEVEL_PIRATE", condition_valeur: 50, description: "Atteindre le niveau 50 en tant que Pirate" },
    { nom: "Canonnier", condition_type: "LEVEL_PIRATE", condition_valeur: 75, description: "Atteindre le niveau 75 en tant que Pirate" },
    { nom: "Second", condition_type: "LEVEL_PIRATE", condition_valeur: 100, description: "Atteindre le niveau 100 en tant que Pirate" },
    { nom: "Capitaine Pirate", condition_type: "LEVEL_PIRATE", condition_valeur: 150, description: "Atteindre le niveau 150 en tant que Pirate" },
    { nom: "Yonko", condition_type: "LEVEL_PIRATE", condition_valeur: 200, description: "Atteindre le niveau 200 en tant que Pirate" },

    // --- ARGENT ---
    { nom: "Millionnaire", condition_type: "BERRYS", condition_valeur: 1000000, description: "Avoir 1M de Berrys" },

    // --- DÉFAITES (ARENE) ---
    { nom: "Mangeur de sable", condition_type: "DEFAITES_PVP", condition_valeur: 50, description: "Perdre 50 combats en Arène" },
    { nom: "Poire à baffes", condition_type: "DEFAITES_PVP", condition_valeur: 100, description: "Perdre 100 combats en Arène" },
    { nom: "Aimant à mandales", condition_type: "DEFAITES_PVP", condition_valeur: 200, description: "Perdre 200 combats en Arène" },
    { nom: "Roi de la lose", condition_type: "DEFAITES_PVP", condition_valeur: 500, description: "Perdre 500 combats en Arène" },
    { nom: "Masochiste Ultime", condition_type: "DEFAITES_PVP", condition_valeur: 1000, description: "Perdre 1000 combats en Arène" },

    // --- VICTOIRES PVP ---
    { nom: "Amateur de baston", condition_type: "VICTOIRES_PVP", condition_valeur: 50, description: "Gagner 50 combats en Arène PVP" },
    { nom: "Bagarreur aguerri", condition_type: "VICTOIRES_PVP", condition_valeur: 100, description: "Gagner 100 combats en Arène PVP" },
    { nom: "Champion de l’Arène", condition_type: "VICTOIRES_PVP", condition_valeur: 200, description: "Gagner 200 combats en Arène PVP" },
    { nom: "Maître du Colisée", condition_type: "VICTOIRES_PVP", condition_valeur: 500, description: "Gagner 500 combats en Arène PVP" },
    { nom: "Légende Immortelle", condition_type: "VICTOIRES_PVP", condition_valeur: 1000, description: "Gagner 1000 combats en Arène PVP" },

    // --- VICTOIRES PVE (PVP PVM) ---
    { nom: "Tapeur de noob", condition_type: "VICTOIRES_PVE", condition_valeur: 50, description: "Gagner 50 combats en Arène PVP PVM" },
    { nom: "Exécuteur discret", condition_type: "VICTOIRES_PVE", condition_valeur: 100, description: "Gagner 100 combats en Arène PVP PVM" },
    { nom: "Chasseur de prime", condition_type: "VICTOIRES_PVE", condition_valeur: 200, description: "Gagner 200 combats en Arène PVP PVM" },
    { nom: "Tueur de Héros", condition_type: "VICTOIRES_PVE", condition_valeur: 500, description: "Gagner 500 combats en Arène PVP PVM" },
    { nom: "Annihilateur de Légendes", condition_type: "VICTOIRES_PVE", condition_valeur: 1000, description: "Gagner 1000 combats en Arène PVP PVM" },

    // --- DIVERS JEU ---
    { nom: "Utilisateur de Fruit", condition_type: "HAS_FRUIT", condition_valeur: 1, description: "Avoir mangé un fruit du démon" },
    
    // --- NAVIRE ---
    { nom: "Marin d'eau douce", condition_type: "SHIP_LEVEL", condition_valeur: 2, description: "Avoir son bateau lvl 2" },
    { nom: "Navigateur expérimenté", condition_type: "SHIP_LEVEL", condition_valeur: 4, description: "Avoir son bateau lvl 4" },
    { nom: "Capitaine aguerri", condition_type: "SHIP_LEVEL", condition_valeur: 6, description: "Avoir son bateau lvl 6" },
    { nom: "Maître des vents", condition_type: "SHIP_LEVEL", condition_valeur: 8, description: "Avoir son bateau lvl 8" },
    { nom: "Souverain des Mers", condition_type: "SHIP_LEVEL", condition_valeur: 10, description: "Avoir son bateau lvl 10" },

    // --- DONS EQUIPAGE ---
    { nom: "Recrue Dévouée", condition_type: "CREW_XP_GIVEN", condition_valeur: 1000, description: "Donner 1 000 XP à son équipage" },
    { nom: "Allié de confiance", condition_type: "CREW_XP_GIVEN", condition_valeur: 10000, description: "Donner 10 000 XP à son équipage" },
    { nom: "Loyal Compagnon", condition_type: "CREW_XP_GIVEN", condition_valeur: 100000, description: "Donner 100 000 XP à son équipage" },
    { nom: "Pilier du navire", condition_type: "CREW_XP_GIVEN", condition_valeur: 1000000, description: "Donner 1 000 000 XP à son équipage" },
    { nom: "Âme de l'équipage", condition_type: "CREW_XP_GIVEN", condition_valeur: 1000000000, description: "Donner 1 000 000 000 XP à son équipage" },

    // --- HAKI ---
    { nom: "Éveillé", condition_type: "HAKI_COUNT", condition_valeur: 1, description: "Obtenir un haki" },
    { nom: "Maître du haki", condition_type: "HAKI_COUNT", condition_valeur: 2, description: "Obtenir deux haki" },
    { nom: "Roi du haki", condition_type: "HAKI_COUNT", condition_valeur: 3, description: "Obtenir les trois haki" },

    // --- EXPLORATION ---
    { nom: "Explorateur novice", condition_type: "EXPEDITIONS_COUNT", condition_valeur: 20, description: "Réussir 20 voyages" },
    { nom: "Rôdeur des îles", condition_type: "EXPEDITIONS_COUNT", condition_valeur: 50, description: "Réussir 50 voyages" },
    { nom: "Aventurier d’élite", condition_type: "EXPEDITIONS_COUNT", condition_valeur: 100, description: "Réussir 100 voyages" },
    { nom: "Vétéran des expéditions", condition_type: "EXPEDITIONS_COUNT", condition_valeur: 200, description: "Réussir 200 voyages" },
    { nom: "Maître des terres lointaines", condition_type: "EXPEDITIONS_COUNT", condition_valeur: 500, description: "Réussir 500 voyages" },

    // --- STATS (AVEC LES VRAIES DESCRIPTIONS) ---
    { nom: "Poing Solide", condition_type: "STAT_FORCE", condition_valeur: 25, description: "Avoir 25 de force" },
    { nom: "Briseur d’os", condition_type: "STAT_FORCE", condition_valeur: 50, description: "Avoir 50 de force" },
    { nom: "Porteguerre", condition_type: "STAT_FORCE", condition_valeur: 100, description: "Avoir 100 de force" },
    { nom: "Colosse indomptable", condition_type: "STAT_FORCE", condition_valeur: 250, description: "Avoir 250 de force" },
    { nom: "Héritier de Barbe Blanche", condition_type: "STAT_FORCE", condition_valeur: 500, description: "Avoir 500 de force" },

    { nom: "Esprit affûté", condition_type: "STAT_INTELLIGENCE", condition_valeur: 25, description: "Avoir 25 d'intelligence" },
    { nom: "Ingénieur Curieux", condition_type: "STAT_INTELLIGENCE", condition_valeur: 50, description: "Avoir 50 d'intelligence" },
    { nom: "Maître du savoir", condition_type: "STAT_INTELLIGENCE", condition_valeur: 100, description: "Avoir 100 d'intelligence" },
    { nom: "Archimage érudit", condition_type: "STAT_INTELLIGENCE", condition_valeur: 250, description: "Avoir 250 d'intelligence" },
    { nom: "Héritier de Vegapunk", condition_type: "STAT_INTELLIGENCE", condition_valeur: 500, description: "Avoir 500 d'intelligence" },

    { nom: "Pas Léger", condition_type: "STAT_AGILITE", condition_valeur: 25, description: "Avoir 25 d'agilité" },
    { nom: "Voltigeur", condition_type: "STAT_AGILITE", condition_valeur: 50, description: "Avoir 50 d'agilité" },
    { nom: "Danseur de lames", condition_type: "STAT_AGILITE", condition_valeur: 100, description: "Avoir 100 d'agilité" },
    { nom: "Ombre insaisissable", condition_type: "STAT_AGILITE", condition_valeur: 250, description: "Avoir 250 d'agilité" },
    { nom: "Héritier de Bon Clay", condition_type: "STAT_AGILITE", condition_valeur: 500, description: "Avoir 500 d'agilité" },

    { nom: "Archiviste en Herbe", condition_type: "STAT_SAGESSE", condition_valeur: 25, description: "Avoir 25 de sagesse" },
    { nom: "Lecteur Averti", condition_type: "STAT_SAGESSE", condition_valeur: 50, description: "Avoir 50 de sagesse" },
    { nom: "Érudit Déterminé", condition_type: "STAT_SAGESSE", condition_valeur: 100, description: "Avoir 100 de sagesse" },
    { nom: "Gardien du Savoir Perdu", condition_type: "STAT_SAGESSE", condition_valeur: 250, description: "Avoir 250 de sagesse" },
    { nom: "Héritier d'Ohara", condition_type: "STAT_SAGESSE", condition_valeur: 500, description: "Avoir 500 de sagesse" },

    { nom: "Corps Endurant", condition_type: "STAT_VITALITE", condition_valeur: 25, description: "Avoir 25 de vitalité" },
    { nom: "Peau Dure", condition_type: "STAT_VITALITE", condition_valeur: 50, description: "Avoir 50 de vitalité" },
    { nom: "Mur humain", condition_type: "STAT_VITALITE", condition_valeur: 100, description: "Avoir 100 de vitalité" },
    { nom: "Bastion vivant", condition_type: "STAT_VITALITE", condition_valeur: 250, description: "Avoir 250 de vitalité" },
    { nom: "Héritier de Kaido", condition_type: "STAT_VITALITE", condition_valeur: 500, description: "Avoir 500 de vitalité" },

    { nom: "Petit Coup de Bol", condition_type: "STAT_CHANCE", condition_valeur: 25, description: "Avoir 25 de chance" },
    { nom: "Chanceux de Service", condition_type: "STAT_CHANCE", condition_valeur: 50, description: "Avoir 50 de chance" },
    { nom: "Enfant de la chance", condition_type: "STAT_CHANCE", condition_valeur: 100, description: "Avoir 100 de chance" },
    { nom: "Miraculé Permanent", condition_type: "STAT_CHANCE", condition_valeur: 250, description: "Avoir 250 de chance" },
    { nom: "Héritier de Baggy", condition_type: "STAT_CHANCE", condition_valeur: 500, description: "Avoir 500 de chance" },

    // --- CRAFT ---
    { nom: "Bricoleur", condition_type: "CRAFTS_COUNT", condition_valeur: 20, description: "Effectuer 20 crafts" },
    { nom: "Artisan", condition_type: "CRAFTS_COUNT", condition_valeur: 50, description: "Effectuer 50 crafts" },
    { nom: "Forgeron émérite", condition_type: "CRAFTS_COUNT", condition_valeur: 200, description: "Effectuer 200 crafts" },
    { nom: "Maître constructeur", condition_type: "CRAFTS_COUNT", condition_valeur: 500, description: "Effectuer 500 crafts" },
    { nom: "Créateur légendaire", condition_type: "CRAFTS_COUNT", condition_valeur: 1000, description: "Effectuer 1000 crafts" },

    // --- NIVEAU EQUIPAGE ---
    { nom: "Équipe de bras cassés", condition_type: "CREW_LEVEL", condition_valeur: 10, description: "Niveau 10 d'équipage" },
    { nom: "Brigade de fortune", condition_type: "CREW_LEVEL", condition_valeur: 25, description: "Niveau 25 d'équipage" },
    { nom: "Compagnons aguerris", condition_type: "CREW_LEVEL", condition_valeur: 50, description: "Niveau 50 d'équipage" },
    { nom: "Armada souveraine", condition_type: "CREW_LEVEL", condition_valeur: 75, description: "Niveau 75 d'équipage" },
    { nom: "Équipage légendaire", condition_type: "CREW_LEVEL", condition_valeur: 100, description: "Niveau 100 d'équipage" },

    // --- COFFRES ---
    { nom: "Fouille-Poches", condition_type: "CHESTS_OPENED", condition_valeur: 50, description: "Ouvrir 50 Coffres" },
    { nom: "Pilleur de Coffres", condition_type: "CHESTS_OPENED", condition_valeur: 150, description: "Ouvrir 150 Coffres" },
    { nom: "Chasseur de Trésors", condition_type: "CHESTS_OPENED", condition_valeur: 500, description: "Ouvrir 500 Coffres" },
    { nom: "Roi du Pillage", condition_type: "CHESTS_OPENED", condition_valeur: 1000, description: "Ouvrir 1000 Coffres" },
    { nom: "Main d’Or", condition_type: "CHESTS_OPENED", condition_valeur: 2000, description: "Ouvrir 2000 Coffres" },

    // --- POTIONS ---
    { nom: "Buveur Occasionnel", condition_type: "POTIONS_CONSUMED", condition_valeur: 200, description: "Boire 200 Potions" },
    { nom: "Glouton des Potions", condition_type: "POTIONS_CONSUMED", condition_valeur: 500, description: "Boire 500 Potions" },
    { nom: "Conservateur d’Élixirs", condition_type: "POTIONS_CONSUMED", condition_valeur: 1000, description: "Boire 1000 Potions" },
    { nom: "Alchimiste Assoiffé", condition_type: "POTIONS_CONSUMED", condition_valeur: 2000, description: "Boire 2000 Potions" },
    { nom: "Puits Sans Fond", condition_type: "POTIONS_CONSUMED", condition_valeur: 5000, description: "Boire 5000 Potions" },

    // --- ACTIVITE ---
    { nom: "Chômeur", condition_type: "ACTIVITY_CLICK_COUNT", condition_valeur: 100, description: "Faire l'activité 100 fois" },
    { nom: "Jeune Actif", condition_type: "ACTIVITY_CLICK_COUNT", condition_valeur: 200, description: "Faire l'activité 200 fois" },
    { nom: "Bosseur", condition_type: "ACTIVITY_CLICK_COUNT", condition_valeur: 500, description: "Faire l'activité 500 fois" },
    { nom: "Machine", condition_type: "ACTIVITY_CLICK_COUNT", condition_valeur: 1000, description: "Faire l'activité 1 000 fois" },
    { nom: "Main d'oeuvre absolue", condition_type: "ACTIVITY_CLICK_COUNT", condition_valeur: 10000, description: "Faire l'activité 10 000 fois" },

    // --- BOUTIQUE (DEPENSES) ---
    { nom: "Client Généreux", condition_type: "SHOP_SPENT", condition_valeur: 5000000, description: "Dépenser 5 000 000 Berrys dans la boutique" },
    { nom: "Gros Porte-Monnaie", condition_type: "SHOP_SPENT", condition_valeur: 50000000, description: "Dépenser 50 000 000 Berrys dans la boutique" },
    { nom: "Acharné du Shopping", condition_type: "SHOP_SPENT", condition_valeur: 500000000, description: "Dépenser 500 000 000 Berrys dans la boutique" },
    { nom: "Magnat Dépensier", condition_type: "SHOP_SPENT", condition_valeur: 5000000000, description: "Dépenser 5 000 000 000 Berrys dans la boutique" },
    { nom: "Fashion Viktim", condition_type: "SHOP_SPENT", condition_valeur: 50000000000, description: "Dépenser 50 000 000 000 Berrys dans la boutique" },

    // --- CASINO ---
    { nom: "Gambling Addict", condition_type: "CASINO_WAGERED", condition_valeur: 1000000000, description: "Miser plus de 1 000 000 000 de Berrys en tout" },
    { nom: "Malchanceux", condition_type: "CASINO_LOST_ALL", condition_valeur: 1, est_secret: true, description: "Tout perdre au Casino" },

    // --- MORT ---
    { nom: "Mort-vivant", condition_type: "HAS_DIED", condition_valeur: 1, est_secret: true, description: "Mourir" }
  ];

  // ⚠️ UTILISATION DE UPSERT POUR METTRE À JOUR LES DESCRIPTIONS SANS CASSER LES LIENS EXISTANTS
  for (const titre of titres) {
    await prisma.titres_ref.upsert({
      where: { nom: titre.nom },
      update: {
        description: titre.description, // Mise à jour de la description si le titre existe déjà
        condition_type: titre.condition_type,
        condition_valeur: BigInt(titre.condition_valeur),
        est_secret: titre.est_secret || false
      },
      create: {
        nom: titre.nom,
        condition_type: titre.condition_type,
        condition_valeur: BigInt(titre.condition_valeur),
        description: titre.description,
        est_secret: titre.est_secret || false
      }
    });
  }
  
  console.log(`✅ ${titres.length} titres traités (créés ou mis à jour).`);

  // ... (Code précédent des Titres) ...

// --------------------------------------------------------
  // 5. CRÉATION DES ITEMS (DANS LA TABLE 'OBJETS')
  // --------------------------------------------------------
  console.log('💎 Création/Mise à jour des objets...');

  const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/\s/g, ''), 10);

  const getSlot = (nom: string, categorie: string) => {
    if (categorie !== 'Équipement') return null;
    const n = nom.toLowerCase();
    if (n.includes('chapeau') || n.includes('bandeau') || n.includes('casque')) return 'TETE';
    if (n.includes('tenue') || n.includes('armure') || n.includes('cape')) return 'CORPS';
    if (n.includes('bottes') || n.includes('sandales') || n.includes('jambières')) return 'PIEDS';
    if (n.includes('anneau') || n.includes('bague')) return 'ACCESSOIRE_1';
    if (n.includes('collier') || n.includes('amulette')) return 'ACCESSOIRE_2';
    // Note : Les gants sont considérés comme une arme ici selon ta demande
    if (n.includes('épée') || n.includes('sabre') || n.includes('dague') || n.includes('pistolet') || n.includes('marteau') || n.includes('gants')) return 'MAIN_DROITE';
    return 'SAC';
  };

  const getHealAmount = (utilite: string) => {
    const match = utilite.match(/Soigne \+?(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  // 🔥 DICTIONNAIRE DES STATS VARIABLES (MIN/MAX)
  const equipmentStatsDef: Record<string, any> = {
    // 🟢 Panoplie du Petit Herboriste
    "Chapeau du Petit Herboriste": {
      nom_set: "Petit Herboriste",
      stats: { intelligence: { min: 3, max: 5 }, sagesse: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },
    "Gants du Petit Herboriste": {
      nom_set: "Petit Herboriste",
      stats: { intelligence: { min: 4, max: 7 }, sagesse: { min: 1, max: 3 }, force: { min: -3, max: -1 }, vitalite: { min: 2, max: 4 } }
    },
    "Tenue du Petit Herboriste": {
      nom_set: "Petit Herboriste",
      stats: { intelligence: { min: 2, max: 6 }, sagesse: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, agilite: { min: -3, max: -1 }, vitalite: { min: 2, max: 5 } }
    },
    "Sandales du Petit Herboriste": { // Note: Nommé "Sandales" dans la liste items, pas "Bottes"
      nom_set: "Petit Herboriste",
      stats: { intelligence: { min: 1, max: 3 }, sagesse: { min: 1, max: 3 }, agilite: { min: 0, max: 3 }, vitalite: { min: 0, max: 3 } }
    },

    // 🔨 Panoplie du Petit Forgeron
    "Anneau du Petit Forgeron": { // "Bague" dans tes stats, "Anneau" dans le seed
      nom_set: "Petit Forgeron",
      stats: { force: { min: 1, max: 3 }, agilite: { min: -3, max: -1 }, vitalite: { min: 1, max: 3 } }
    },
    "Marteau du Petit Forgeron": {
      nom_set: "Petit Forgeron",
      stats: { intelligence: { min: -4, max: -2 }, force: { min: 5, max: 8 }, agilite: { min: -3, max: -1 }, vitalite: { min: 2, max: 4 } }
    },
    "Tenue du Petit Forgeron": {
      nom_set: "Petit Forgeron",
      stats: { sagesse: { min: 1, max: 3 }, force: { min: 2, max: 4 }, agilite: { min: -3, max: -1 }, vitalite: { min: 3, max: 6 } }
    },
    "Collier du Petit Forgeron": {
      nom_set: "Petit Forgeron",
      stats: { force: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },

    // ⚓ Panoplie du Marine
    "Anneau du Marine": {
      nom_set: "Marine",
      stats: { sagesse: { min: 1, max: 3 }, force: { min: 1, max: 3 }, vitalite: { min: 1, max: 5 } }
    },
    "Chapeau du Marine": {
      nom_set: "Marine",
      stats: { intelligence: { min: 0, max: 3 }, sagesse: { min: 1, max: 3 }, force: { min: 1, max: 3 }, agilite: { min: 1, max: 3 }, vitalite: { min: 1, max: 5 } }
    },
    "Tenue du Marine": { // "Tenue du Marine"
      nom_set: "Marine",
      stats: { sagesse: { min: 2, max: 4 }, force: { min: 2, max: 4 }, agilite: { min: -2, max: 0 }, vitalite: { min: 4, max: 7 } }
    },
    "Collier du Marine": { // Pas dans la liste rawItems originale, à ajouter si besoin ou renommer "Épée" ?
      nom_set: "Marine",
      stats: { force: { min: 0, max: 2 }, chance: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },
    "Épée du Marine": { // Ajouté car présent dans rawItems
      nom_set: "Marine",
      stats: { force: { min: 3, max: 6 }, vitalite: { min: 1, max: 3 } } // Stats improvisées car pas dans ta liste
    },

    // ☠️ Panoplie du Pirate
    "Anneau du Pirate": {
      nom_set: "Pirate",
      stats: { chance: { min: 2, max: 4 }, agilite: { min: 0, max: 2 } }
    },
    "Pistolet du Pirate": {
      nom_set: "Pirate",
      stats: { intelligence: { min: -3, max: -1 }, chance: { min: 2, max: 4 }, agilite: { min: 4, max: 6 } }
    },
    "Chapeau du Pirate": {
      nom_set: "Pirate",
      stats: { force: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, agilite: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },
    "Tenue du Pirate": { // "Tenue de Pirate" vs "Tenue du pirate"
      nom_set: "Pirate",
      stats: { intelligence: { min: -3, max: -1 }, sagesse: { min: -3, max: -1 }, force: { min: 2, max: 4 }, chance: { min: 2, max: 4 }, agilite: { min: 2, max: 4 }, vitalite: { min: 1, max: 3 } }
    },

    // 🔥 Panoplie du Révolutionnaire
    "Anneau du Révolutionnaire": {
      nom_set: "Révolutionnaire",
      stats: { force: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, agilite: { min: 1, max: 3 } }
    },
    "Bandeau du Révolutionnaire": {
      nom_set: "Révolutionnaire",
      stats: { intelligence: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, agilite: { min: 2, max: 5 }, vitalite: { min: 1, max: 3 } }
    },
    "Bottes du Révolutionnaire": {
      nom_set: "Révolutionnaire",
      stats: { chance: { min: 1, max: 3 }, agilite: { min: 3, max: 6 }, vitalite: { min: 1, max: 3 } }
    },
    "Tenue du Révolutionnaire": {
      nom_set: "Révolutionnaire",
      stats: { intelligence: { min: -1, max: 1 }, sagesse: { min: 1, max: 3 }, force: { min: 1, max: 3 }, agilite: { min: 2, max: 5 }, vitalite: { min: 1, max: 3 } }
    },

    // 🗡️ Panoplie de l’Aventurier
    "Bottes de l'Aventurier": {
      nom_set: "Aventurier",
      stats: { chance: { min: 1, max: 3 }, agilite: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },
    "Anneau de l'Aventurier": {
      nom_set: "Aventurier",
      stats: { sagesse: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },
    "Collier de l'Aventurier": {
      nom_set: "Aventurier",
      stats: { intelligence: { min: 1, max: 3 }, sagesse: { min: 1, max: 3 }, chance: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    },
    "Tenue de l'Aventurier": { // Attention à l'apostrophe dans rawItems (laventurier vs l'aventurier)
      nom_set: "Aventurier",
      stats: { intelligence: { min: 1, max: 3 }, sagesse: { min: 1, max: 3 }, force: { min: 1, max: 3 }, agilite: { min: 1, max: 3 }, vitalite: { min: 1, max: 4 } }
    },
    "Dague de l'Aventurier": {
      nom_set: "Aventurier",
      stats: { force: { min: 2, max: 4 }, chance: { min: 1, max: 3 }, agilite: { min: 1, max: 4 } }
    },
    "Chapeau de l'Aventurier": { // "Casque" dans ta liste, "Chapeau" dans rawItems
      nom_set: "Aventurier",
      stats: { intelligence: { min: 1, max: 3 }, sagesse: { min: 1, max: 3 }, force: { min: 1, max: 3 }, vitalite: { min: 1, max: 3 } }
    }
  };

  const rawItems = [
    // ... tes items précédents ...
    // Je remets la liste complète pour m'assurer que les noms correspondent bien aux clés ci-dessus
    { nom: "Bois", image: "bois.png", rarete: "Commun", prix: "20 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Bol", image: "bol.png", rarete: "Commun", prix: "35 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Chanvre", image: "chanvre.png", rarete: "Commun", prix: "10 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Chiffon", image: "chiffon.png", rarete: "Commun", prix: "15 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Clous", image: "clous.png", rarete: "Commun", prix: "15 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Coffre commun", image: "coffre_commun.png", rarete: "Commun", prix: "100 000", cat: "Coffre", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Permettre aux joueurs d'obtenir des loots", uniq: "non" },
    { nom: "Coton", image: "coton.png", rarete: "Commun", prix: "10 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Céréale", image: "céréale.png", rarete: "Commun", prix: "10 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Eau de mer", image: "eau_de_mer.png", rarete: "Commun", prix: "5 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Farine", image: "farine.png", rarete: "Commun", prix: "20 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Ferraille", image: "ferraille.png", rarete: "Commun", prix: "10 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Fer brut", image: "fer_brut.png", rarete: "Commun", prix: "15 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Fruits", image: "fruits.png", rarete: "Commun", prix: "10 000", cat: "Consommable", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft ou soigne 5 PV si consommé", uniq: "non" }, // Achetable: Non (Corrigé)
    { nom: "Herbe médicinale", image: "herbe_médicinale.png", rarete: "Commun", prix: "50 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Lait", image: "lait.png", rarete: "Commun", prix: "10 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Oeufs", image: "oeufs.png", rarete: "Commun", prix: "10 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Pierre", image: "pierre.png", rarete: "Commun", prix: "5 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Potion mineure", image: "potion_mineure.png", rarete: "Commun", prix: "50 000", cat: "Consommable", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Soigne +30 PV", uniq: "non" },
    { nom: "Coffre épique", image: "coffre_épique.png", rarete: "Épique", prix: "25 000 000", cat: "Coffre", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Permettre aux joueurs d'obtenir des loots", uniq: "non" },
    { nom: "Concentré eau", image: "concentré_eau.png", rarete: "Épique", prix: "5 000 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Concentré feu", image: "concentré_feu.png", rarete: "Épique", prix: "5 000 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Concentré lune", image: "concentré_lune.png", rarete: "Épique", prix: "5 000 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Concentré terre", image: "concentré_terre.png", rarete: "Épique", prix: "5 000 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Concentré vent", image: "concentré_vent.png", rarete: "Épique", prix: "5 000 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Concentré vie", image: "concentré_vie.png", rarete: "Épique", prix: "5 000 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Coquelicot écarlate", image: "coquelicot_écarlate.png", rarete: "Épique", prix: "1 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Cristal d'énergie", image: "cristal_denergie.png", rarete: "Épique", prix: "3 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Diamant", image: "diamant.png", rarete: "Épique", prix: "2 500 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Granit marin", image: "granit_marin.png", rarete: "Épique", prix: "1 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Manganèse scintillante", image: "manganèse_scintillante.png", rarete: "Épique", prix: "2 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Or", image: "or.png", rarete: "Épique", prix: "1 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Pavot debene", image: "pavot_debene.png", rarete: "Épique", prix: "1 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Rose immaculée", image: "rose_immaculée.png", rarete: "Épique", prix: "1 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Rhum de binks", image: "rhum_de_binks.png", rarete: "Épique", prix: "1 000 000", cat: "Consommable", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Soigne +500 PV", uniq: "non" },
    { nom: "Armoise blanche", image: "armoise_blanche.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Aubépine maudite", image: "aubépine_maudite.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Bois d'adam", image: "bois_dadam.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Coffre légendaire", image: "coffre_légendaire.png", rarete: "Légendaire", prix: "200 000 000", cat: "Coffre", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Permettre aux joueurs d'obtenir des loots", uniq: "non" },
    { nom: "Edelweiss", image: "edelweiss.png", rarete: "Légendaire", prix: "75 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Émeraude", image: "emeraude.png", rarete: "Légendaire", prix: "75 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Mandragore adulte", image: "mandragore_adulte.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Obsidienne sombre", image: "obsidienne_sombre.png", rarete: "Légendaire", prix: "75 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Opale", image: "opale.png", rarete: "Légendaire", prix: "75 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Parchemin agilité", image: "parchemin_agilité.png", rarete: "Légendaire", prix: "100 000 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Octroie +1 en Agilité", uniq: "non" },
    { nom: "Parchemin chance", image: "parchemin_chance.png", rarete: "Légendaire", prix: "100 000 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Octroie +1 en Chance", uniq: "non" },
    { nom: "Parchemin force", image: "parchemin_force.png", rarete: "Légendaire", prix: "100 000 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Octroie +1 en Force", uniq: "non" },
    { nom: "Parchemin intelligence", image: "parchemin_intelligence.png", rarete: "Légendaire", prix: "100 000 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Octroie +1 en Intelligence", uniq: "non" },
    { nom: "Parchemin sagesse", image: "parchemin_sagesse.png", rarete: "Légendaire", prix: "100 000 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Octroie +1 en Sagesse", uniq: "non" },
    { nom: "Parchemin vitalité", image: "parchemin_vitalité.png", rarete: "Légendaire", prix: "100 000 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Octroie +1 en Vitalité", uniq: "non" },
    { nom: "Rubis", image: "rubis.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Safran vermeille", image: "safran_vermeille.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Saphire", image: "saphire.png", rarete: "Légendaire", prix: "50 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Écaille de Dragon", image: "écaille_de_dragon.png", rarete: "Légendaire", prix: "90 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Gomu gomu no mi", image: "gomu_gomu_no_mi.png", rarete: "Mythique", prix: "500 000 000", cat: "Fruit du Démon", craftable: "Non", achetable: "Oui", loot: "Non", util: "Octroie le pouvoir du fruit", uniq: "oui" },
    { nom: "Goro goro no mi", image: "goro_goro_no_mi.png", rarete: "Mythique", prix: "750 000 000", cat: "Fruit du Démon", craftable: "Non", achetable: "Oui", loot: "Non", util: "Octroie le pouvoir du fruit", uniq: "oui" },
    { nom: "Mera mera no mi", image: "mera_mera_no_mi.png", rarete: "Mythique", prix: "750 000 000", cat: "Fruit du Démon", craftable: "Non", achetable: "Oui", loot: "Non", util: "Octroie le pouvoir du fruit", uniq: "oui" },
    { nom: "Ope ope no mi", image: "ope_ope_no_mi.png", rarete: "Mythique", prix: "500 000 000", cat: "Fruit du Démon", craftable: "Non", achetable: "Oui", loot: "Non", util: "Octroie le pouvoir du fruit", uniq: "oui" },
    { nom: "Ailes de Fée", image: "ailes_de_fée.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Coeur de Dragon", image: "coeur_de_dragon.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Coffre mythique", image: "coffre_mythique.png", rarete: "Mythique", prix: "750 000 000", cat: "Coffre", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Permettre aux joueurs d'obtenir des loots", uniq: "non" },
    { nom: "Larme de sirène", image: "larme_de_sirène.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Mithril", image: "mithril.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Morceau de ponéglyphe", image: "morceau_de_ponéglyphe.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Plume de Phoenix", image: "plume_de_phoenix.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Rose des vents", image: "rose_des_vents.png", rarete: "Mythique", prix: "250 000 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Sablier de compétences", image: "sablier_de_compétences.png", rarete: "Mythique", prix: "250 000 000", cat: "Consommable", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Réinitialise les stats du joueur", uniq: "non" },
    { nom: "Élixir de vie", image: "élixir_de_vie.png", rarete: "Mythique", prix: "500 000 000", cat: "Consommable", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Soigne +10 000 PV", uniq: "non" },
    { nom: "Potion moyenne", image: "potion_moyenne.png", rarete: "Rare", prix: "100 000", cat: "Consommable", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Soigne +50 PV", uniq: "non" },
    { nom: "Ancre", image: "ancre.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Anneau de l'Aventurier", image: "anneau_de_laventurier.png", rarete: "Rare", prix: "750 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Anneau du Marine", image: "anneau_du_marine.png", rarete: "Rare", prix: "750 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Anneau du Petit Forgeron", image: "anneau_du_petit_forgeron.png", rarete: "Rare", prix: "750 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Anneau du Pirate", image: "anneau_du_pirate.png", rarete: "Rare", prix: "750 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Anneau du Révolutionnaire", image: "anneau_du_révolutionnaire.png", rarete: "Rare", prix: "750 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Bandeau du Révolutionnaire", image: "bandeau_du_révolutionnaire.png", rarete: "Rare", prix: "500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Bois de teck", image: "bois_de_teck.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Bol de céréales", image: "bol_de_céréales.png", rarete: "Rare", prix: "100 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Soigne +20 PV", uniq: "non" },
    { nom: "Bottes de l'Aventurier", image: "bottes_de_laventurier.png", rarete: "Rare", prix: "600 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Bottes du Révolutionnaire", image: "bottes_du_révolutionnaire.png", rarete: "Rare", prix: "600 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Canot de sauvetage", image: "canot_de_sauvetage.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Chapeau de l'Aventurier", image: "chapeau_de_laventurier.png", rarete: "Rare", prix: "500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Chapeau du Marine", image: "chapeau_du_marine.png", rarete: "Rare", prix: "500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Chapeau du Petit Herboriste", image: "chapeau_du_petit_herboriste.png", rarete: "Rare", prix: "500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Chapeau du Pirate", image: "chapeau_du_pirate.png", rarete: "Rare", prix: "500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Coffre rare", image: "coffre_rare.png", rarete: "Rare", prix: "1 000 000", cat: "Coffre", craftable: "Oui", achetable: "Oui", loot: "Oui", util: "Permettre aux joueurs d'obtenir des loots", uniq: "non" },
    { nom: "Colle", image: "colle.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Collier de l'Aventurier", image: "collier_de_laventurier.png", rarete: "Rare", prix: "400 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Collier du Petit Forgeron", image: "collier_du_petit_forgeron.png", rarete: "Rare", prix: "400 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Corde", image: "corde.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Cuir", image: "cuir.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Dague de l'Aventurier", image: "dague_de_laventurier.png", rarete: "Rare", prix: "1 000 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Eau pure", image: "eau_pure.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence de la lune", image: "essence_de_la_lune.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence de la terre", image: "essence_de_la_terre.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence de l'eau", image: "essence_de_leau.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence de vitalité", image: "essence_de_vitalité.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence du feu", image: "essence_du_feu.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence du haki", image: "essence_du_haki.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Essence du vent", image: "essence_du_vent.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Fiole en verre", image: "fiole_en_verre.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Fraisier", image: "fraisier.png", rarete: "Rare", prix: "100 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Soigne +50 PV", uniq: "non" },
    { nom: "Fromage affiné", image: "fromage_affiné.png", rarete: "Rare", prix: "100 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Soigne +30 PV", uniq: "non" },
    { nom: "Gants du Petit Herboriste", image: "gants_du_petit_herboriste.png", rarete: "Rare", prix: "1 000 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Gouvernail", image: "gouvernail.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Hamac", image: "hamac.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Lingot de fer", image: "lingot_de_fer.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Marteau du Petit Forgeron", image: "marteau_du_petit_forgeron.png", rarete: "Rare", prix: "1 000 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Omelette nourrissante", image: "omelette_nourrissante.png", rarete: "Rare", prix: "100 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Soigne +30 PV", uniq: "non" },
    { nom: "Outils", image: "outils.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Pain de campagne", image: "pain_de_campagne.png", rarete: "Rare", prix: "100 000", cat: "Consommable", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Soigne +30 PV", uniq: "non" },
    { nom: "Parchemin vierge", image: "parchemin_vierge.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Pistolet du Pirate", image: "pistolet_du_pirate.png", rarete: "Rare", prix: "1 000 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Planche de bois", image: "planche_de_bois.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Poudre d'or", image: "poudre_dor.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Poudre à canon", image: "poudre_à_canon.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Sandales du petit herboriste", image: "sandales_du_petit_herboriste.png", rarete: "Rare", prix: "600 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Sel marin", image: "sel_marin.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Non", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Sucre", image: "sucre.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Tenue de laventurier", image: "tenue_de_laventurier.png", rarete: "Rare", prix: "1 500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" }, // Note: L'Aventurier corrigé dans le dico, ici on garde le nom original du fichier pour le lien
    { nom: "Tenue du marine", image: "tenue_du_marine.png", rarete: "Rare", prix: "1 500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Tenue du petit forgeron", image: "tenue_du_petit_forgeron.png", rarete: "Rare", prix: "1 500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Tenue du petit herboriste", image: "tenue_du_petit_herboriste.png", rarete: "Rare", prix: "1 500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Tenue du pirate", image: "tenue_du_pirate.png", rarete: "Rare", prix: "1 500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Tenue du révolutionnaire", image: "tenue_du_révolutionnaire.png", rarete: "Rare", prix: "1 500 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
    { nom: "Tissu", image: "tissu.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Voile de bateau", image: "voile_de_bateau.png", rarete: "Rare", prix: "100 000", cat: "Ressource", craftable: "Oui", achetable: "Non", loot: "Oui", util: "Craft", uniq: "non" },
    { nom: "Épée du Marine", image: "épée_du_marine.png", rarete: "Rare", prix: "1 000 000", cat: "Équipement", craftable: "Oui", achetable: "Oui", loot: "Non", util: "S'équipe sur le joueur", uniq: "non" },
  // --- NAVIRES (Doivent correspondre aux noms dans 'navires_ref') ---
    { nom: "Radeau de fortune", image: "radeau.png", rarete: "Commun", prix: "0", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.0", uniq: "oui", stats: { vitesse: 1.0, chance: 0 } },
    { nom: "Canot", image: "canot.png", rarete: "Commun", prix: "5 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.1 | Chance +5%", uniq: "oui", stats: { vitesse: 1.1, chance: 5 } },
    { nom: "Chaloupe", image: "chaloupe.png", rarete: "Commun", prix: "15 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.2 | Chance +10%", uniq: "oui", stats: { vitesse: 1.2, chance: 10 } },
    { nom: "Sloop", image: "sloop.png", rarete: "Rare", prix: "50 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.3 | Chance +15%", uniq: "oui", stats: { vitesse: 1.3, chance: 15 } },
    { nom: "Goélette", image: "goelette.png", rarete: "Rare", prix: "150 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.4 | Chance +20%", uniq: "oui", stats: { vitesse: 1.4, chance: 20 } },
    { nom: "Brigantin", image: "brigantin.png", rarete: "Rare", prix: "500 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.5 | Chance +25%", uniq: "oui", stats: { vitesse: 1.5, chance: 25 } },
    { nom: "Frégate", image: "frégate.png", rarete: "Épique", prix: "2 000 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.6 | Chance +30%", uniq: "oui", stats: { vitesse: 1.6, chance: 30 } },
    { nom: "Galion", image: "galion.png", rarete: "Épique", prix: "10 000 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x1.8 | Chance +40%", uniq: "oui", stats: { vitesse: 1.8, chance: 40 } },
    { nom: "Vaisseau Amiral", image: "vaisseau_amiral.png", rarete: "Légendaire", prix: "50 000 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x2.0 | Chance +50%", uniq: "oui", stats: { vitesse: 2.0, chance: 50 } },
    { nom: "Navire Légendaire", image: "thousand_sunny.png", rarete: "Mythique", prix: "500 000 000", cat: "Navire", craftable: "Non", achetable: "Non", loot: "Non", util: "Vitesse x3.0 | Chance +100%", uniq: "oui", stats: { vitesse: 3.0, chance: 100 } }
  
  ];

console.log('🧹 Nettoyage des dépendances...');

  // 1. On supprime d'abord TOUT ce qui utilise des objets
  await prisma.recette_ingredients.deleteMany({}); 
  await prisma.recettes.deleteMany({});            
  await prisma.navire_upgrade_couts.deleteMany({});
  
  // 👇 IL FAUT ABSOLUMENT DÉCOMMENTER CES DEUX LIGNES 👇
  await prisma.marche.deleteMany({});      // Vide le marché (qui contient des objets)
  await prisma.inventaire.deleteMany({});  // Vide les sacs des joueurs (qui contiennent des objets)

  // 2. MAINTENANT on peut supprimer les objets sans erreur
  await prisma.objets.deleteMany({});

  // UPSERT pour ne pas casser l'existant
  for (const item of rawItems) {
    const buyPrice = parsePrice(item.prix);
    const sellPrice = Math.floor(buyPrice * 0.1); 
    const slot = getSlot(item.nom, item.cat);
    const heal = getHealAmount(item.util);

    // On cherche les stats spécifiques dans notre dictionnaire
    // On essaie de correspondre le nom exact (ou avec légères variations de casse/accents si besoin)
    let statsJson = {};
    let nomSet = null;

    // Normalisation basique pour la recherche (au cas où "Tenue de l'aventurier" vs "Tenue de laventurier")
    // Note: Dans equipmentStatsDef, j'ai utilisé les noms "propres" (avec apostrophes et majuscules).
    // Il faut s'assurer que rawItems a les mêmes noms ou faire un mapping.
    // Ici je fais une recherche directe, et un fallback si "laventurier"
    let definition = equipmentStatsDef[item.nom];
    
    if (!definition && item.nom.includes("laventurier")) {
        const fixedName = item.nom.replace("laventurier", "l'Aventurier").replace("Tenue de", "Tenue de"); // Casse simple
        // Essai avec majuscule
        const capitalised = item.nom.replace("tenue", "Tenue").replace("laventurier", "l'Aventurier");
        definition = equipmentStatsDef[capitalised] || equipmentStatsDef["Tenue de l'Aventurier"];
    }

    // Pour "Tenue du pirate" vs "Tenue de Pirate"
    if (!definition && item.nom.toLowerCase().includes("pirate")) {
       const keys = Object.keys(equipmentStatsDef).filter(k => k.toLowerCase() === item.nom.toLowerCase());
       if (keys.length > 0) definition = equipmentStatsDef[keys[0]];
    }

    // Fallback général insensible à la casse
    if (!definition) {
        const keys = Object.keys(equipmentStatsDef).filter(k => k.toLowerCase() === item.nom.toLowerCase());
        if (keys.length > 0) definition = equipmentStatsDef[keys[0]];
    }

    if (definition) {
        statsJson = definition.stats;
        nomSet = definition.nom_set;
    }
    const finalStats = item.stats ? item.stats : statsJson;

    await prisma.objets.create({
      data: {
        nom: item.nom,
        rarete: item.rarete,
        description: item.util,
        image_url: `/items/${item.image}`,
        prix_achat: buyPrice,
        prix_vente: sellPrice,
        en_boutique: item.achetable === "Oui",
        est_craftable: item.craftable === "Oui",
        est_unique: item.uniq === "oui" || item.cat === 'Équipement', // Force unique pour équipement
        est_lootable: item.loot === "Oui",
        categorie: item.cat,
        type_equipement: slot,
        stats_bonus: finalStats, // On insère les fourchettes {min, max} ici !
        nom_set: nomSet,
        soin: heal,
        stock: 9999
      }
    });
  }

  console.log(`✅ ${rawItems.length} objets traités avec stats dynamiques.`);
// =================================================================
  // 4. CRÉATION DES RECETTES (CRAFT) - LISTE COMPLÈTE & CATÉGORISÉE
  // =================================================================
  console.log('📜 Création des recettes artisanales...');

  // 1. Nettoyage
  await prisma.recette_ingredients.deleteMany({});
  await prisma.recettes.deleteMany({});

  // 2. Mapping Nom -> ID
  const allObjets = await prisma.objets.findMany({ select: { id: true, nom: true } });
  const objetMap = new Map(allObjets.map(o => [o.nom.trim(), o.id]));

  const getId = (nom: string) => {
      const cleanNom = nom.trim();
      const id = objetMap.get(cleanNom);
      if (!id) console.warn(`⚠️ ATTENTION : Objet introuvable pour la recette : "${cleanNom}"`);
      return id;
  };

  // 3. Liste Officielle des Recettes
  const rawRecettes = [
    // --- NIVEAU 1 à 9 ---
    { nom: "Bol", categorie: "Menuiserie", niveau: 10, ingredients: [ {nom: "Bois", qte: 2} ] },
    { nom: "Clous", categorie: "Forge", niveau: 11, ingredients: [ {nom: "Ferraille", qte: 4} ] },
    { nom: "Farine", categorie: "Cuisine", niveau: 12, ingredients: [ {nom: "Céréale", qte: 5} ] },
    { nom: "Lingot de fer", categorie: "Forge", niveau: 13, ingredients: [ {nom: "Fer brut", qte: 4} ] },
    { nom: "Sucre", categorie: "Cuisine", niveau: 14, ingredients: [ {nom: "Fruits", qte: 4} ] },
    { nom: "Eau pure", categorie: "Cuisine", niveau: 15, ingredients: [ {nom: "Eau de mer", qte: 2}, {nom: "Tissu", qte: 1} ] },
    { nom: "Colle", categorie: "Alchimie", niveau: 15, ingredients: [ {nom: "Farine", qte: 1}, {nom: "Eau pure", qte: 1} ] },
    { nom: "Corde", categorie: "Tissage", niveau: 7, ingredients: [ {nom: "Chanvre", qte: 4}, {nom: "Outils", qte: 1} ] },
    { nom: "Outils", categorie: "Forge", niveau: 17, ingredients: [ {nom: "Lingot de fer", qte: 2}, {nom: "Bois", qte: 2} ] },

    // --- NIVEAU 10 à 19 ---
    { nom: "Potion mineure", categorie: "Alchimie", niveau: 18, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Herbe médicinale", qte: 1} ] },
    { nom: "Fromage affiné", categorie: "Cuisine", niveau: 19, ingredients: [ {nom: "Lait", qte: 2}, {nom: "Sel marin", qte: 1} ] },
    { nom: "Omelette nourrissante", categorie: "Cuisine", niveau: 20, ingredients: [ {nom: "Oeufs", qte: 2}, {nom: "Sel marin", qte: 1} ] },
    { nom: "Cuir", categorie: "Tissage", niveau: 21, ingredients: [ {nom: "Fruits", qte: 4}, {nom: "Outils", qte: 1}, {nom: "Sel marin", qte: 1} ] },
    { nom: "Tissu", categorie: "Tissage", niveau: 22, ingredients: [ {nom: "Chanvre", qte: 2}, {nom: "Outils", qte: 1}, {nom: "Coton", qte: 2} ] },
    { nom: "Coffre commun", categorie: "Menuiserie", niveau: 25, ingredients: [ {nom: "Bois", qte: 2}, {nom: "Clous", qte: 4} ] },
    { nom: "Canot de sauvetage", categorie: "Menuiserie", niveau: 23, ingredients: [ {nom: "Planche de bois", qte: 4}, {nom: "Clous", qte: 8} ] },
    { nom: "Hamac", categorie: "Tissage", niveau: 24, ingredients: [ {nom: "Corde", qte: 2}, {nom: "Tissu", qte: 2} ] },
    { nom: "Ancre", categorie: "Forge", niveau: 26, ingredients: [ {nom: "Lingot de fer", qte: 4}, {nom: "Corde", qte: 1} ] },
    { nom: "Pain de campagne", categorie: "Cuisine", niveau: 27, ingredients: [ {nom: "Farine", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Sel marin", qte: 1} ] },

    // --- NIVEAU 20 à 25 ---
    { nom: "Gouvernail", categorie: "Menuiserie", niveau: 28, ingredients: [ {nom: "Bois", qte: 4}, {nom: "Outils", qte: 1}, {nom: "Lingot de fer", qte: 1} ] },
    { nom: "Voile de bateau", categorie: "Tissage", niveau: 29, ingredients: [ {nom: "Tissu", qte: 6}, {nom: "Corde", qte: 2}, {nom: "Lingot de fer", qte: 2}, {nom: "Outils", qte: 1} ] },
    { nom: "Bol de céréales", categorie: "Cuisine", niveau: 30, ingredients: [ {nom: "Bol", qte: 1}, {nom: "Lait", qte: 1}, {nom: "Fruits", qte: 1}, {nom: "Céréale", qte: 2} ] },
    { nom: "Fraisier", categorie: "Cuisine", niveau: 31, ingredients: [ {nom: "Farine", qte: 2}, {nom: "Lait", qte: 1}, {nom: "Oeufs", qte: 4}, {nom: "Fruits", qte: 2} ] },
    { nom: "Potion moyenne", categorie: "Alchimie", niveau: 32, ingredients: [ {nom: "Potion mineure", qte: 1}, {nom: "Herbe médicinale", qte: 2}, {nom: "Poudre d'or", qte: 1} ] },
    
    // --- CONCENTRÉS (Niveau 25) ---
    { nom: "Concentré eau", categorie: "Alchimie", niveau: 33, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Essence de l'eau", qte: 2} ] },
    { nom: "Concentré feu", categorie: "Alchimie", niveau: 34, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Essence du feu", qte: 2} ] },
    { nom: "Concentré lune", categorie: "Alchimie", niveau: 35, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Essence de la lune", qte: 2} ] },
    { nom: "Concentré terre", categorie: "Alchimie", niveau: 36, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Essence de la terre", qte: 2} ] },
    { nom: "Concentré vent", categorie: "Alchimie", niveau: 37, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Essence du vent", qte: 2} ] },
    { nom: "Concentré vie", categorie: "Alchimie", niveau: 38, ingredients: [ {nom: "Fiole en verre", qte: 1}, {nom: "Eau pure", qte: 1}, {nom: "Essence de vitalité", qte: 2} ] },

    // --- HAUT NIVEAU (30+) ---
    { nom: "Coffre rare", categorie: "Menuiserie", niveau: 40, ingredients: [ {nom: "Coffre commun", qte: 1}, {nom: "Planche de bois", qte: 2}, {nom: "Clous", qte: 4} ] },
    { nom: "Rhum de binks", categorie: "Cuisine", niveau: 45, ingredients: [ {nom: "Eau pure", qte: 1}, {nom: "Fruits", qte: 4}, {nom: "Fiole en verre", qte: 1} ] },
    { nom: "Coffre épique", categorie: "Menuiserie", niveau: 60, ingredients: [ {nom: "Coffre rare", qte: 1}, {nom: "Planche de bois", qte: 4}, {nom: "Poudre d'or", qte: 2} ] },
    
    // --- PARCHEMINS (45+) ---
    { nom: "Parchemin vierge", categorie: "Alchimie", niveau: 50, ingredients: [ {nom: "Chanvre", qte: 5}, {nom: "Eau pure", qte: 1} ] },
    { nom: "Parchemin agilité", categorie: "Alchimie", niveau: 55, ingredients: [ {nom: "Parchemin vierge", qte: 1}, {nom: "Concentré vent", qte: 2}, {nom: "Cristal d'énergie", qte: 2} ] },
    { nom: "Parchemin chance", categorie: "Alchimie", niveau: 60, ingredients: [ {nom: "Parchemin vierge", qte: 1}, {nom: "Concentré eau", qte: 2}, {nom: "Cristal d'énergie", qte: 2} ] },
    { nom: "Parchemin force", categorie: "Alchimie", niveau: 65, ingredients: [ {nom: "Parchemin vierge", qte: 1}, {nom: "Concentré terre", qte: 2}, {nom: "Cristal d'énergie", qte: 2} ] },
    { nom: "Parchemin intelligence", categorie: "Alchimie", niveau: 70, ingredients: [ {nom: "Parchemin vierge", qte: 1}, {nom: "Concentré feu", qte: 2}, {nom: "Cristal d'énergie", qte: 2} ] },
    { nom: "Parchemin sagesse", categorie: "Alchimie", niveau: 75, ingredients: [ {nom: "Parchemin vierge", qte: 1}, {nom: "Concentré lune", qte: 2}, {nom: "Cristal d'énergie", qte: 2} ] },
    { nom: "Parchemin vitalité", categorie: "Alchimie", niveau: 80, ingredients: [ {nom: "Parchemin vierge", qte: 1}, {nom: "Concentré vie", qte: 2}, {nom: "Cristal d'énergie", qte: 2} ] },

    // --- LÉGENDAIRE (80+) ---
    { nom: "Coffre légendaire", categorie: "Menuiserie", niveau: 90, ingredients: [ {nom: "Coffre épique", qte: 1}, {nom: "Bois de teck", qte: 2}, {nom: "Cristal d'énergie", qte: 1}, {nom: "Diamant", qte: 1} ] },
    { nom: "Élixir de vie", categorie: "Alchimie", niveau: 95, ingredients: [ {nom: "Potion moyenne", qte: 5}, {nom: "Eau pure", qte: 4}, {nom: "Poudre d'or", qte: 4}, {nom: "Armoise blanche", qte: 1}, {nom: "Edelweiss", qte: 1} ] },
    { nom: "Coffre mythique", categorie: "Menuiserie", niveau: 100, ingredients: [ {nom: "Coffre légendaire", qte: 1}, {nom: "Bois d'adam", qte: 2}, {nom: "Écaille de Dragon", qte: 2}, {nom: "Saphire", qte: 1}, {nom: "Rubis", qte: 1}, {nom: "Émeraude", qte: 1} ] }
  ];

  // 4. Insertion
  for (const r of rawRecettes) {
      const objetCibleId = getId(r.nom);
      
      if (!objetCibleId) continue;

      const recette = await prisma.recettes.create({
          data: {
              nom: `Recette : ${r.nom}`,
              objet_resultat_id: objetCibleId,
              temps_craft: 10,
              xp_craft: 50 + (r.niveau * 10), // XP variable selon niveau
              categorie: r.categorie,         // ✅ Catégorie explicite
              niveau_requis: r.niveau         // ✅ Niveau explicite
          }
      });

      for (const ing of r.ingredients) {
          const ingId = getId(ing.nom);
          if (ingId) {
              await prisma.recette_ingredients.create({
                  data: {
                      recette_id: recette.id,
                      objet_ingredient_id: ingId,
                      quantite: ing.qte
                  }
              });
          }
      }
  }
  
  console.log(`✅ ${rawRecettes.length} recettes injectées avec succès.`);



  // --------------------------------------------------------
  // 8. CRÉATION DE LA MÉTÉO
  // --------------------------------------------------------
  console.log('☁️ Création de la météo...');

  await prisma.meteo_ref.deleteMany({});

  const meteos = [
    {
      nom: "Grand Soleil",
      emoji: "☀️",
      desc: "Rien de spécial. Une belle journée pour naviguer.",
      xp: 1.0,      // Normal
      berrys: 1.0,  // Normal
      reussite: 1.0,// Normal
      duree: 1.0,   // Normal
      loot: 1.0     // Normal
    },
    {
      nom: "Tempête",
      emoji: "⛈️",
      desc: "Mer agitée ! Gains augmentés mais risques de dégâts.",
      xp: 1.5,      // +50% XP
      berrys: 1.5,  // +50% Berrys
      reussite: 0.8,// -20% Taux de réussite (Danger)
      duree: 1.0,
      loot: 1.0
    },
    {
      nom: "Brume Épaisse",
      emoji: "🌫️",
      desc: "Visibilité nulle. Moins de gains, mais on trouve des trésors cachés.",
      xp: 0.5,      // -50% XP
      berrys: 0.5,  // -50% Berrys
      reussite: 1.0,
      duree: 1.0,
      loot: 2.0     // x2 Chance de Loot (Objets rares)
    },
    {
      nom: "Aqua Laguna",
      emoji: "🌊",
      desc: "Le raz-de-marée ultime ! Survivre rend incroyablement fort.",
      xp: 3.0,      // x3 XP (Survivre rend fort)
      berrys: 1.0,  // Normal (ou tu peux mettre 3.0 aussi si tu veux)
      reussite: 0.5,// -50% Taux de réussite (Très dangereux)
      duree: 1.0,
      loot: 1.0
    },
    {
      nom: "Vent Arrière",
      emoji: "🌬️",
      desc: "Le vent souffle dans le bon sens. Navigation ultra rapide.",
      xp: 1.0,
      berrys: 1.0,
      reussite: 1.0,
      duree: 0.5,   // Durée réduite de 50% (Voyage 2x plus vite)
      loot: 1.0
    }
  ];

  for (const m of meteos) {
    await prisma.meteo_ref.create({
      data: {
        nom: m.nom,
        emoji: m.emoji,
        description: m.desc,
        coeff_xp: m.xp,
        coeff_berrys: m.berrys,
        coeff_reussite: m.reussite,
        coeff_duree: m.duree,
        coeff_loot_chance: m.loot
      }
    });
  }

  console.log(`✅ ${meteos.length} météos créées.`);


// --------------------------------------------------------
  // 9. CRÉATION DES NAVIRES (UPGRADES)
  // --------------------------------------------------------
  console.log('⛵ Création des navires...');

  await prisma.navire_upgrade_couts.deleteMany({});
  await prisma.navires_ref.deleteMany({});

  const allObjetsNavire = await prisma.objets.findMany({ select: { id: true, nom: true } });
  const objetMapNavire = new Map(allObjetsNavire.map(o => [o.nom, o.id]));

  const getIdNavire = (nom: string) => {
      const id = objetMapNavire.get(nom.trim());
      if (!id) console.warn(`⚠️ Item introuvable pour le navire : "${nom}"`);
      return id;
  };

  const navires = [
    {
      niveau: 1,
      nom: "Radeau de fortune",
      desc: "Quelques troncs attachés ensemble. Ça flotte... à peu près.",
      prix: 0,
      image: "radeau.png", // ✅
      items: []
    },
    {
      niveau: 2,
      nom: "Canot",
      desc: "Un petit bateau en bois. Idéal pour la pêche côtière.",
      prix: 50000,
      image: "canot.png", // ✅
      items: [
        { nom: "Bois", qte: 20 },
        { nom: "Clous", qte: 10 },
        { nom: "Corde", qte: 5 }
      ]
    },
    {
      niveau: 3,
      nom: "Chaloupe",
      desc: "Plus robuste, permet de s'éloigner un peu des côtes.",
      prix: 150000,
      image: "chaloupe.png", // ✅
      items: [
        { nom: "Planche de bois", qte: 10 },
        { nom: "Clous", qte: 20 },
        { nom: "Voile de bateau", qte: 1 },
        { nom: "Gouvernail", qte: 1 }
      ]
    },
    {
      niveau: 4,
      nom: "Sloop",
      desc: "Un navire rapide et maniable à un seul mât.",
      prix: 500000,
      image: "sloop.png", // ✅
      items: [
        { nom: "Planche de bois", qte: 30 },
        { nom: "Lingot de fer", qte: 5 },
        { nom: "Voile de bateau", qte: 2 },
        { nom: "Ancre", qte: 1 }
      ]
    },
    {
      niveau: 5,
      nom: "Goélette",
      desc: "Navire élégant à deux mâts, parfait pour le commerce.",
      prix: 1500000,
      image: "goelette.png", // ✅
      items: [
        { nom: "Bois de teck", qte: 10 },
        { nom: "Tissu", qte: 20 },
        { nom: "Lingot de fer", qte: 10 },
        { nom: "Hamac", qte: 4 }
      ]
    },
    {
      niveau: 6,
      nom: "Brigantin",
      desc: "Rapide et offensif, le favori des pirates.",
      prix: 5000000,
      image: "brigantin.png", // ✅
      items: [
        { nom: "Bois de teck", qte: 30 },
        { nom: "Lingot de fer", qte: 20 },
        { nom: "Poudre à canon", qte: 10 },
        { nom: "Canot de sauvetage", qte: 1 }
      ]
    },
    {
      niveau: 7,
      nom: "Frégate",
      desc: "Un navire de guerre redoutable, lourdement armé.",
      prix: 20000000,
      image: "frégate.png", // ✅ Attention à l'accent
      items: [
        { nom: "Bois de teck", qte: 50 },
        { nom: "Lingot de fer", qte: 50 },
        { nom: "Poudre à canon", qte: 30 },
        { nom: "Poudre d'or", qte: 5 }
      ]
    },
    {
      niveau: 8,
      nom: "Galion",
      desc: "Une forteresse flottante capable de transporter des trésors immenses.",
      prix: 100000000,
      image: "galion.png", // ✅
      items: [
        { nom: "Bois d'adam", qte: 5 },
        { nom: "Or", qte: 10 },
        { nom: "Voile de bateau", qte: 10 },
        { nom: "Canot de sauvetage", qte: 4 }
      ]
    },
    {
      niveau: 9,
      nom: "Vaisseau Amiral",
      desc: "Le summum de la technologie navale standard. Impose le respect.",
      prix: 500000000,
      image: "vaisseau_amiral.png", // ✅
      items: [
        { nom: "Bois d'adam", qte: 20 },
        { nom: "Granit marin", qte: 10 },
        { nom: "Diamant", qte: 5 },
        { nom: "Cristal d'énergie", qte: 5 }
      ]
    },
    {
      niveau: 10,
      nom: "Navire Légendaire",
      desc: "Un navire mythique capable de traverser Calm Belt et d'atteindre Laugh Tale.",
      prix: 5000000000,
      image: "navire_legendaire.png", // ⚠️ J'ai mis un nom par défaut ici car il manquait dans ta liste !
      items: [
        { nom: "Bois d'adam", qte: 50 },
        { nom: "Mithril", qte: 10 },
        { nom: "Morceau de ponéglyphe", qte: 1 },
        { nom: "Coeur de Dragon", qte: 1 }
      ]
    }
  ];

  for (const n of navires) {
    await prisma.navires_ref.create({
      data: {
        niveau: n.niveau,
        nom: n.nom,
        description: n.desc,
        prix_berrys: BigInt(n.prix),
        image_url: `/navires/${n.image}` // On pointe vers le dossier /navires
      }
    });

    for (const item of n.items) {
      const objId = getIdNavire(item.nom);
      if (objId) {
        await prisma.navire_upgrade_couts.create({
          data: {
            navire_niveau: n.niveau,
            objet_id: objId,
            quantite: item.qte
          }
        });
      }
    }
  }

  console.log(`✅ ${navires.length} navires créés.`);

  // --------------------------------------------------------
  // 10. CRÉATION DES DESTINATIONS (LOOT HYBRIDE)
  // --------------------------------------------------------
  console.log('🗺️ Création de la Carte du Monde avec Loots Dynamiques...');

async function generateLootsForLevel(level: number, bonusLoots: any[] = []) {
  const allItems = await prisma.objets.findMany();
  
  const itemsByRarity = {
    Commun: allItems.filter(i => i.rarete === 'Commun'),
    Rare: allItems.filter(i => i.rarete === 'Rare'),
    Epique: allItems.filter(i => i.rarete === 'Épique'),
    Legendaire: allItems.filter(i => i.rarete === 'Légendaire'),
    Mythique: allItems.filter(i => i.rarete === 'Mythique'),
  };

  const getRandomItemName = (rarete: string) => {
    const list = itemsByRarity[rarete as keyof typeof itemsByRarity];
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)].nom;
  };

  const lootLine = (rarete: string, min: number, max: number, proba: number) => {
    const nom = getRandomItemName(rarete);
    return nom ? { nom, min, max, proba } : null;
  };

  const rawLoots: any[] = [];

  // Paliers de loot génériques
  if (level <= 10) {
      rawLoots.push(lootLine("Commun", 1, 3, 0.6));
      rawLoots.push(lootLine("Rare", 1, 1, 0.05));
  } else if (level <= 30) {
      rawLoots.push(lootLine("Commun", 2, 5, 0.8));
      rawLoots.push(lootLine("Rare", 1, 2, 0.2));
  } else if (level <= 60) {
      rawLoots.push(lootLine("Commun", 5, 10, 1.0));
      rawLoots.push(lootLine("Rare", 2, 4, 0.5));
      rawLoots.push(lootLine("Epique", 1, 1, 0.1));
  } else if (level <= 100) {
      rawLoots.push(lootLine("Rare", 5, 8, 1.0));
      rawLoots.push(lootLine("Epique", 1, 3, 0.4));
      rawLoots.push(lootLine("Legendaire", 1, 1, 0.05));
  } else {
      rawLoots.push(lootLine("Epique", 3, 6, 1.0));
      rawLoots.push(lootLine("Legendaire", 1, 2, 0.3));
      rawLoots.push(lootLine("Mythique", 1, 1, 0.05));
  }

  // Fusion avec les loots manuels
  const finalLoots = [
    ...rawLoots.filter(l => l !== null),
    ...bonusLoots
  ];

  return finalLoots;
}

const manualLoot = (nom: string, min: number, max: number, proba: number) => ({ nom, min, max, proba });

// =========================================================
// 🗺️ 2. DONNÉES DES ÎLES (COMPLETE)
// =========================================================
  console.log('🌱 Début du seeding de la Carte Complète...');

  const islandsData = [
    // ---------------------------------------------------------
    // 🌊 EAST BLUE (Niveaux 1 - 20) | Zone X: 0-90
    // ---------------------------------------------------------
    {
      nom: "Village de Fushia",
      description: "Le point de départ paisible.",
      image_url: "https://images.wikia.nocookie.net/onepiece/fr/images/6/69/Village_de_Fushia.png",
      pos_x: 10, pos_y: 50,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.VILLE,
      niveau_requis: 1,
      facilities: [Facility.PORT, Facility.TAVERNE],
      bonusLoots: [manualLoot("Bois", 2, 5, 1.0)]
    },
    {
      nom: "Shells Town",
      description: "Une ville sous le contrôle strict de la Marine.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/1/1d/Shells_Town_Infobox.png",
      pos_x: 25, pos_y: 40,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.QG_MARINE,
      niveau_requis: 5,
      facilities: [Facility.PORT, Facility.ARENE],
      bonusLoots: [manualLoot("Ferraille", 2, 4, 0.8)]
    },
    {
      nom: "Village d'Orange",
      description: "Un village qui a été ravagé par des pirates clowns.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/5/53/Orange_Town_Infobox.png",
      pos_x: 35, pos_y: 60,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.VILLE,
      niveau_requis: 8,
      facilities: [Facility.PORT, Facility.SHOP],
      bonusLoots: [manualLoot("Tissu", 1, 3, 0.6)]
    },
    {
      nom: "Village de Sirop",
      description: "Un village connu pour son chantier naval modeste.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/3/36/Syrup_Village_Infobox.png",
      pos_x: 45, pos_y: 30,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.VILLE,
      niveau_requis: 10,
      facilities: [Facility.PORT, Facility.SHOP, Facility.TAVERNE],
      bonusLoots: [manualLoot("Herbe médicinale", 2, 4, 1.0)]
    },
    {
      nom: "Baratie",
      description: "Le célèbre navire-restaurant.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/e/ee/Baratie_Infobox.png",
      pos_x: 60, pos_y: 45,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.VILLE,
      niveau_requis: 12,
      facilities: [Facility.PORT, Facility.TAVERNE],
      bonusLoots: [manualLoot("Omelette nourrissante", 1, 1, 0.5)]
    },
    {
      nom: "Arlong Park",
      description: "Le quartier général des Hommes-Poissons.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/2/23/Arlong_Park_Infobox.png",
      pos_x: 70, pos_y: 65,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.DONJON,
      niveau_requis: 15,
      facilities: [Facility.PORT],
      bonusLoots: [manualLoot("Or", 1, 2, 0.2)]
    },
    {
      nom: "Loguetown",
      description: "La ville du début et de la fin.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/9/91/Loguetown_Infobox.png",
      pos_x: 90, pos_y: 50,
      ocean: Ocean.EAST_BLUE,
      type: IslandType.VILLE,
      niveau_requis: 18,
      facilities: [Facility.PORT, Facility.SHOP, Facility.FORGE, Facility.CASINO, Facility.ARENE, Facility.MARCHE],
      bonusLoots: []
    },

    // ---------------------------------------------------------
    // 🌋 GRAND LINE - PARADIS (Niveaux 20 - 90) | Zone X: 100-190
    // ---------------------------------------------------------
    {
      nom: "Cap des Jumeaux",
      description: "L'entrée de Grand Line. Une baleine géante y attend.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/6/66/Twin_Cape_Infobox.png",
      pos_x: 100, pos_y: 50,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.SAUVAGE,
      niveau_requis: 20,
      facilities: [Facility.PORT],
      bonusLoots: [manualLoot("Eau de mer", 5, 10, 1.0)]
    },
    {
      nom: "Whiskey Peak",
      description: "Une île accueillante... pour les chasseurs de primes.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/2/22/Whisky_Peak_Infobox.png",
      pos_x: 110, pos_y: 30,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.VILLE,
      niveau_requis: 25,
      facilities: [Facility.PORT, Facility.TAVERNE, Facility.ARENE],
      bonusLoots: [manualLoot("Poudre à canon", 2, 5, 0.5)]
    },
    {
      nom: "Little Garden",
      description: "Une île préhistorique figée dans le temps.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/9/98/Little_Garden_Infobox.png",
      pos_x: 120, pos_y: 60,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.SAUVAGE,
      niveau_requis: 30,
      facilities: [],
      bonusLoots: [manualLoot("Viande de Dinosaure", 1, 2, 0.4)]
    },
    {
      nom: "Royaume de Drum",
      description: "Une île hivernale réputée pour sa médecine.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/6/69/Drum_Island_Infobox.png",
      pos_x: 130, pos_y: 20,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.VILLE,
      niveau_requis: 35,
      facilities: [Facility.PORT, Facility.SHOP],
      bonusLoots: [manualLoot("Herbe médicinale", 5, 10, 1.0)]
    },
    {
      nom: "Alabasta",
      description: "Un vaste royaume désertique au bord de la guerre civile.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/4/42/Alabasta_Infobox.png",
      pos_x: 140, pos_y: 50,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.VILLE,
      niveau_requis: 40,
      facilities: [Facility.PORT, Facility.SHOP, Facility.CASINO, Facility.MARCHE],
      bonusLoots: [manualLoot("Poudre d'or", 1, 3, 0.3)]
    },
    {
      nom: "Jaya",
      description: "Une île de non-droit remplie de pirates.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/3/30/Jaya_Infobox.png",
      pos_x: 150, pos_y: 40,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.VILLE,
      niveau_requis: 45,
      facilities: [Facility.PORT, Facility.TAVERNE, Facility.ARENE],
      bonusLoots: [manualLoot("Rhum", 2, 5, 0.8)]
    },
    {
      nom: "Skypiea",
      description: "L'île céleste dans la Mer Blanche.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/2/29/Skypiea_Infobox.png",
      pos_x: 150, pos_y: 10, // En haut !
      ocean: Ocean.GRAND_LINE,
      type: IslandType.EVENT,
      niveau_requis: 50,
      facilities: [Facility.SHOP],
      bonusLoots: [manualLoot("Dial", 1, 2, 0.5)]
    },
    {
      nom: "Water Seven",
      description: "La métropole de l'eau et des charpentiers.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/0/07/Water_7_Infobox.png",
      pos_x: 160, pos_y: 60,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.VILLE,
      niveau_requis: 55,
      facilities: [Facility.PORT, Facility.FORGE, Facility.SHOP, Facility.MARCHE], // Forge importante
      bonusLoots: [manualLoot("Bois de teck", 3, 6, 0.8)]
    },
    {
      nom: "Enies Lobby",
      description: "L'île judiciaire du Gouvernement Mondial.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/7/73/Enies_Lobby_Infobox.png",
      pos_x: 165, pos_y: 70,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.QG_MARINE,
      niveau_requis: 60,
      facilities: [Facility.PORT, Facility.ARENE],
      bonusLoots: [manualLoot("Acier", 2, 4, 0.5)]
    },
    {
      nom: "Thriller Bark",
      description: "Un navire géant hanté par des ombres.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/8/8f/Thriller_Bark_Infobox.png",
      pos_x: 175, pos_y: 30,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.DONJON,
      niveau_requis: 70,
      facilities: [Facility.PORT],
      bonusLoots: [manualLoot("Sel", 5, 10, 0.9)]
    },
    {
      nom: "Archipel Sabaody",
      description: "Dernière étape avant le Nouveau Monde.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/6/6f/Sabaody_Archipelago_Infobox.png",
      pos_x: 190, pos_y: 50,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.VILLE,
      niveau_requis: 80,
      facilities: [Facility.PORT, Facility.SHOP, Facility.CASINO, Facility.ARENE, Facility.MARCHE, Facility.FORGE],
      bonusLoots: [manualLoot("Colle", 2, 5, 0.7)]
    },

    // ---------------------------------------------------------
    // 🐍 CALM BELT (Niveaux 85 - 100)
    // ---------------------------------------------------------
    {
      nom: "Amazon Lily",
      description: "L'île des femmes guerrières.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/f/fe/Amazon_Lily_Infobox.png",
      pos_x: 180, pos_y: 80,
      ocean: Ocean.GRAND_LINE, // Techniquement Calm Belt, mais groupé
      type: IslandType.VILLE,
      niveau_requis: 85,
      facilities: [Facility.PORT, Facility.ARENE],
      bonusLoots: []
    },
    {
      nom: "Impel Down",
      description: "La grande prison sous-marine.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/9/90/Impel_Down_Infobox.png",
      pos_x: 170, pos_y: 80,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.DONJON,
      niveau_requis: 90,
      facilities: [Facility.PORT],
      bonusLoots: [manualLoot("Menottes", 1, 1, 0.2)]
    },
    {
      nom: "Marineford",
      description: "L'ancien QG de la Marine.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/9/91/Marineford_Infobox.png",
      pos_x: 180, pos_y: 65,
      ocean: Ocean.GRAND_LINE,
      type: IslandType.QG_MARINE,
      niveau_requis: 100,
      facilities: [Facility.ARENE],
      bonusLoots: []
    },

    // ---------------------------------------------------------
    // 👑 NOUVEAU MONDE (Niveaux 100 - 200+) | Zone X: 200-300
    // ---------------------------------------------------------
    {
      nom: "Île des Hommes-Poissons",
      description: "Le paradis sous-marin à 10 000 mètres de profondeur.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/8/87/Fish-Man_Island_Infobox.png",
      pos_x: 200, pos_y: 50,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.VILLE,
      niveau_requis: 105,
      facilities: [Facility.PORT, Facility.SHOP, Facility.TAVERNE],
      bonusLoots: [manualLoot("Corail", 2, 5, 0.8)]
    },
    {
      nom: "Punk Hazard",
      description: "Une île divisée entre glace et feu.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/0/07/Punk_Hazard_Infobox.png",
      pos_x: 215, pos_y: 40,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.SAUVAGE,
      niveau_requis: 115,
      facilities: [Facility.PORT],
      bonusLoots: [manualLoot("Fruit du Démon Artificiel", 1, 1, 0.05)]
    },
    {
      nom: "Dressrosa",
      description: "Le pays de l'amour, de la passion et des jouets.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/2/23/Dressrosa_Infobox.png",
      pos_x: 230, pos_y: 60,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.VILLE,
      niveau_requis: 125,
      facilities: [Facility.PORT, Facility.ARENE, Facility.CASINO, Facility.SHOP],
      bonusLoots: [manualLoot("Acier Trempé", 1, 3, 0.5)]
    },
    {
      nom: "Zou",
      description: "Une île vivante sur le dos d'un éléphant millénaire.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/7/70/Zou_Infobox.png",
      pos_x: 245, pos_y: 30, // Elle bouge normalement, mais on fixe une pos
      ocean: Ocean.NEW_WORLD,
      type: IslandType.SAUVAGE,
      niveau_requis: 135,
      facilities: [Facility.PORT],
      bonusLoots: [manualLoot("Fruit Électrique", 2, 5, 0.6)]
    },
    {
      nom: "Whole Cake Island",
      description: "L'archipel de la gourmandise.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/3/3d/Whole_Cake_Island_Infobox.png",
      pos_x: 260, pos_y: 50,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.VILLE,
      niveau_requis: 150,
      facilities: [Facility.PORT, Facility.SHOP, Facility.FORGE],
      bonusLoots: [manualLoot("Gâteau Délicieux", 1, 1, 0.5)]
    },
    {
      nom: "Wano Kuni",
      description: "Le pays des Samouraïs, isolé du monde.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/d/d3/Wano_Country_Infobox.png",
      pos_x: 275, pos_y: 70,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.VILLE,
      niveau_requis: 170,
      facilities: [Facility.PORT, Facility.FORGE, Facility.ARENE, Facility.SHOP],
      bonusLoots: [manualLoot("Granit Marin", 1, 2, 0.4), manualLoot("Sabre de qualité", 1, 1, 0.1)]
    },
    {
      nom: "Elbaf",
      description: "La terre des fiers guerriers géants.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/6/64/Elbaf_Infobox.png",
      pos_x: 285, pos_y: 40,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.SAUVAGE,
      niveau_requis: 190,
      facilities: [Facility.PORT, Facility.ARENE],
      bonusLoots: [manualLoot("Bois d'Adam", 1, 1, 0.1)]
    },
    {
      nom: "Laugh Tale",
      description: "L'île finale. Le trésor s'y trouve.",
      image_url: "https://static.wikia.nocookie.net/onepiece/images/2/29/Laugh_Tale_Infobox.png",
      pos_x: 300, pos_y: 50,
      ocean: Ocean.NEW_WORLD,
      type: IslandType.EVENT,
      niveau_requis: 250,
      facilities: [],
      bonusLoots: [manualLoot("One Piece", 1, 1, 0.001)] // Le rêve !
    }
  ];

  // =========================================================
  // 💾 3. INSERTION EN BASE
  // =========================================================
  for (const d of islandsData) {
    // A. Génération des loots
    const loots = await generateLootsForLevel(d.niveau_requis, d.bonusLoots);

    // B. Création / Mise à jour
    const created = await prisma.destinations.upsert({
      where: { nom: d.nom },
      update: {
        ocean: d.ocean,
        type: d.type,
        facilities: d.facilities,
        pos_x: d.pos_x,
        pos_y: d.pos_y,
        description: d.description,
        loots_possibles: loots, 
        niveau_requis: d.niveau_requis,
        xp_gain: d.niveau_requis * 20,
        difficulte: d.niveau_requis * 10
      },
      create: {
        nom: d.nom,
        description: d.description,
        image_url: d.image_url,
        pos_x: d.pos_x,
        pos_y: d.pos_y,
        ocean: d.ocean,
        type: d.type,
        niveau_requis: d.niveau_requis,
        facilities: d.facilities,
        loots_possibles: loots,
        difficulte: d.niveau_requis * 10,
        xp_gain: d.niveau_requis * 20,
      }
    });
    console.log(`📍 [${created.ocean}] ${created.nom} - ${created.facilities.length} Infras.`);
  }

  // =========================================================
  // 🚑 4. SÉCURITÉ JOUEURS
  // =========================================================
  const fushia = await prisma.destinations.findUnique({ where: { nom: 'Village de Fushia' } });
  if (fushia) {
      const result = await prisma.joueurs.updateMany({
          where: { localisation_id: null }, 
          data: { 
              localisation_id: fushia.id,
              statut_voyage: "A_QUAI"
          }
      });
      if (result.count > 0) console.log(`🚑 ${result.count} joueurs rapatriés à Fushia.`);
  }

  console.log('🏁 Carte V2 générée avec succès !');
}



main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });