export const ACTIVITIES_CONFIG = {
  // --- 🎣 PÊCHE ---
  PECHE: {
    id: 'PECHE',
    nom: "Pêche Côtière",
    description: "Lancez votre ligne et attendez que ça morde.",
    emoji: "🎣",
    facilities_req: ["PORT", "SAUVAGE"],
    duree: 30, // secondes
    cooldown: 300, // 5 minutes
    energie: 5,
    xp_gain: 5,
    loots: [
      // Bas Level
      { item: "Sardine", chance: 50, min_lvl: 1, max_lvl: 30 },
      { item: "Botte trouée", chance: 20, min_lvl: 1, max_lvl: 200 },
      { item: "Eau de mer", chance: 20, min_lvl: 1, max_lvl: 100 },
      // Mid Level
      { item: "Maquereau", chance: 40, min_lvl: 20, max_lvl: 80 },
      { item: "Thon", chance: 20, min_lvl: 30, max_lvl: 100 },
      { item: "Coffre commun", chance: 5, min_lvl: 30, max_lvl: 80 },
      // High Level
      { item: "Espadon", chance: 15, min_lvl: 60, max_lvl: 200 },
      { item: "Requin", chance: 5, min_lvl: 80, max_lvl: 200 },
      { item: "Roi des Mers (Petit)", chance: 1, min_lvl: 100, max_lvl: 200 }
    ]
  },

  // --- ⛏️ MINAGE ---
  MINAGE: {
    id: 'MINAGE',
    nom: "Extraction Minière",
    description: "Creusez la roche pour trouver des minerais.",
    emoji: "⛏️",
    facilities_req: ["FORGE", "SAUVAGE"],
    duree: 60, 
    cooldown: 1800, // 30 min
    energie: 10,
    xp_gain: 15,
    loots: [
      { item: "Pierre", chance: 50, min_lvl: 1, max_lvl: 200 },
      { item: "Ferraille", chance: 30, min_lvl: 1, max_lvl: 50 },
      { item: "Fer brut", chance: 25, min_lvl: 20, max_lvl: 200 },
      { item: "Sel marin", chance: 15, min_lvl: 20, max_lvl: 100 },
      { item: "Or", chance: 5, min_lvl: 60, max_lvl: 200 },
      { item: "Diamant", chance: 2, min_lvl: 80, max_lvl: 200 },
      { item: "Mithril", chance: 1, min_lvl: 100, max_lvl: 200 },
      { item: "Granit marin", chance: 1, min_lvl: 100, max_lvl: 200 }
    ]
  },

  // --- 🪵 CUEILLETTE ---
  CUEILLETTE: {
    id: 'CUEILLETTE',
    nom: "Cueillette & Coupe",
    description: "Récoltez des plantes et du bois.",
    emoji: "🪵",
    facilities_req: ["SAUVAGE", "VILLE"],
    duree: 45, 
    cooldown: 900, // 15 min
    energie: 5,
    xp_gain: 10,
    loots: [
      { item: "Bois", chance: 40, min_lvl: 1, max_lvl: 200 },
      { item: "Fruits", chance: 30, min_lvl: 1, max_lvl: 200 },
      { item: "Chanvre", chance: 20, min_lvl: 10, max_lvl: 100 },
      { item: "Coton", chance: 20, min_lvl: 20, max_lvl: 100 },
      { item: "Herbe médicinale", chance: 10, min_lvl: 15, max_lvl: 200 },
      { item: "Bois de teck", chance: 5, min_lvl: 50, max_lvl: 200 },
      { item: "Bois d'adam", chance: 1, min_lvl: 100, max_lvl: 200 },
      { item: "Mandragore adulte", chance: 0.5, min_lvl: 100, max_lvl: 200 }
    ]
  },

  // --- 🍺 TOURNÉE (XP ÉQUIPAGE) ---
  TOURNEE: {
    id: 'TOURNEE',
    nom: "Payer une tournée",
    description: "Motivez vos troupes avec à boire !",
    emoji: "🍺",
    facilities_req: ["TAVERNE"],
    duree: 10,
    cooldown: 3600, // 1h
    energie: 0,
    cout_berrys: 500,
    xp_gain: 0, // Pas d'XP Joueur
    crew_xp: 100, // ✅ XP ÉQUIPAGE
    loots: [] 
  },

  // --- ⚔️ ENTRAINEMENT (XP JOUEUR) ---
  ENTRAINEMENT: {
    id: 'ENTRAINEMENT',
    nom: "Entraînement Intensif",
    description: "Frappez le mannequin pour gagner de l'expérience.",
    emoji: "⚔️",
    facilities_req: ["ARENE"],
    duree: 600, // 10 min
    cooldown: 7200, // 2h
    energie: 20,
    xp_gain: 200, // ✅ GROS XP JOUEUR
    loots: []
  },

  // --- 🏺 FOUILLE ---
  FOUILLE: {
    id: 'FOUILLE',
    nom: "Fouille des Ruines",
    description: "Explorez les profondeurs du donjon.",
    emoji: "🏺",
    facilities_req: ["DONJON"],
    duree: 900, // 15 min
    cooldown: 14400, // 4h
    energie: 30,
    xp_gain: 50,
    loots: [
        { item: "Coffre rare", chance: 50, min_lvl: 30, max_lvl: 200 },
        { item: "Coffre légendaire", chance: 10, min_lvl: 80, max_lvl: 200 },
        { item: "Morceau de ponéglyphe", chance: 1, min_lvl: 100, max_lvl: 200 }
    ]
  },

  // --- FACTIONS ---
  VOL: {
    id: 'VOL',
    nom: "Vol à la tire",
    description: "Dérobez discrètement quelques objets...",
    emoji: "🕵️",
    faction_req: "Pirate",
    facilities_req: ["SHOP"],
    duree: 60,
    cooldown: 1800,
    energie: 5,
    xp_gain: 20,
    // Loot spécial géré dynamiquement (catégorie food/items)
    loots: [
        { item: "Fruits", chance: 40, min_lvl: 1, max_lvl: 50 },
        { item: "Pain de campagne", chance: 30, min_lvl: 1, max_lvl: 100 },
        { item: "Potion mineure", chance: 20, min_lvl: 10, max_lvl: 100 },
        { item: "Potion moyenne", chance: 10, min_lvl: 50, max_lvl: 200 }
    ]
  },

  PATROUILLE: {
    id: 'PATROUILLE',
    nom: "Patrouille de Ville",
    description: "Maintenez l'ordre et gagnez une prime.",
    emoji: "⚖️",
    faction_req: "Marine",
    facilities_req: ["VILLE", "QG_MARINE"],
    duree: 300,
    cooldown: 1800,
    energie: 5,
    xp_gain: 30,
    gain_berrys_base: 500, // + bonus selon niveau île
    loots: []
  },

  SABOTAGE: {
    id: 'SABOTAGE',
    nom: "Sabotage",
    description: "Déstabilisez les infrastructures locales.",
    emoji: "💣",
    faction_req: "Révolutionnaire",
    facilities_req: ["VILLE", "QG_MARINE"],
    duree: 300,
    cooldown: 1800,
    energie: 5,
    xp_gain: 40,
    gain_berrys_base: 300,
    loots: [
        { item: "Poudre à canon", chance: 30, min_lvl: 20, max_lvl: 200 },
        { item: "Bandeau du Révolutionnaire", chance: 1, min_lvl: 50, max_lvl: 200 }
    ]
  }
};