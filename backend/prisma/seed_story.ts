import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✨ Début du seeding Histoire COMPLET (Chapitres 1 à 4) - Narration Immersive...');

  // 1. NETTOYAGE
  await prisma.histoire_chapitres.deleteMany({});
  await prisma.histoire_etapes.deleteMany({});

  // 2. RÉCUPÉRATION DES ÎLES 
  const fuchsia = await prisma.destinations.findFirst({ where: { nom: "Village de Fuchsia" } });
  const shellsTown = await prisma.destinations.findFirst({ where: { nom: "Shells Town" } });
  const goatIsland = await prisma.destinations.findFirst({ where: { nom: "Goat Island" } });
  const shimotsuki = await prisma.destinations.findFirst({ where: { nom: "Village de Shimotsuki" } });
  const orangeTown = await prisma.destinations.findFirst({ where: { nom: "Village d'Orange" } }); 
  const siropVillage = await prisma.destinations.findFirst({ where: { nom: "Village de Sirop" } }); 

  // Vérification de sécurité
  if (!orangeTown || !siropVillage) console.warn("⚠️ ATTENTION: Orange Town ou Sirop Village introuvables !");

  const DATA = [
    // =====================================================================================
    //                                  CHAPITRE 1 : LE DÉPART
    // =====================================================================================
    {
      faction: "MARINE", numero: 1, titre: "L'Acier de la Justice Absolue",
      desc: "La base de Shells Town est le berceau de l'ordre à East Blue. Ici, la faiblesse est un crime. Tu es une nouvelle recrue, et le chemin vers la gloire commence dans la poussière de la cour d'entraînement.",
      recompense_xp: 500, recompense_berrys: 1000, unlock_island_id: shellsTown?.id,
      etapes: [
        { ordre: 1, type: "DIALOGUE", description: "Le Sergent Instructeur te hurle dessus, postillonant à deux centimètres de ton visage : 'Toi ! Tu te crois taillé pour la Justice ? Prouve-le, larve !'", target_nom: "Sergent Instructeur" },
        { ordre: 2, type: "ACTION", description: "La discipline est mère de la force. Écrase-toi au sol et fais des pompes jusqu'à ce que tes bras brûlent !", target_nom: "Faire des pompes", quantite: 10 },
        { ordre: 3, type: "ACTION", description: "La douleur t'a éveillé. Ouvre l'onglet STATS et distribue tes 5 points pour sculpter le soldat que tu deviendras.", target_nom: "J'ai distribué mes points", quantite: 1 },
        { ordre: 4, type: "LIVRAISON", description: "Tu as mérité ton équipement. Va à l'armurerie récupérer ton 'Pistolet basique' de service. Ne le perds pas.", target_nom: "Pistolet basique", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Un Marine armé est un Marine utile. Ouvre ton SAC et équipe ton Pistolet immédiatement.", target_nom: "Arme équipée", quantite: 1 },
        { ordre: 6, type: "DIALOGUE", description: "Sergent : 'Une arme sans technique ne vaut rien. Tiens, prends cette solde anticipée pour ta formation.' (1000 Berrys reçus).", target_nom: "Sergent Instructeur" },
        { ordre: 7, type: "ACTION", description: "Va dans l'onglet SKILLS. Achète tes premières techniques de combat et équipe-les dans ton Deck.", target_nom: "Compétences prêtes", quantite: 1 },
        { ordre: 8, type: "COMBAT_PVE", description: "Alerte ! Un pirate tente de s'évader de la prison ! C'est ton premier test en conditions réelles. Arrête-le !", target_nom: "Pirate Évadé", quantite: 1 },
        { ordre: 9, type: "LIVRAISON", description: "Beau travail, soldat. Prends ce 'Pain de campagne' à la cantine pour récupérer de tes blessures.", target_nom: "Pain de campagne", quantite: 1 },
        { ordre: 10, type: "DIALOGUE", description: "Le Capitaine Morgan t'observe depuis son balcon. Il hoche la tête et t'assigne une chaloupe de patrouille.", target_nom: "Capitaine Morgan" }
      ]
    },
    {
      faction: "PIRATE", numero: 1, titre: "Le Radeau des Rêves",
      desc: "Plage de Dawn Island. Le vent de l'aventure souffle. Tu n'as pas de navire, pas d'équipage, juste une ambition démesurée : conquérir Grand Line. Tout commence par un premier pas.",
      recompense_xp: 500, recompense_berrys: 1000, unlock_island_id: fuchsia?.id,
      etapes: [
        { ordre: 1, type: "DIALOGUE", description: "Rends-toi au Partys Bar. Makino, la patronne, est la seule qui ne se moque pas de tes rêves.", target_nom: "Makino" },
        { ordre: 2, type: "ACTION", description: "Pour payer ta dette au bar et t'assurer un départ propre, aide Makino à déplacer les lourds tonneaux de rhum.", target_nom: "Déplacer tonneaux", quantite: 10 },
        { ordre: 3, type: "ACTION", description: "Le travail physique paie. Ouvre l'onglet STATS et distribue tes points pour définir ton style de pirate.", target_nom: "J'ai distribué mes points", quantite: 1 },
        { ordre: 4, type: "LIVRAISON", description: "Un client ivre a oublié son 'Pistolet basique' sur une table. C'est la loi de la mer : il est à toi maintenant.", target_nom: "Pistolet basique", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Ouvre ton SAC et équipe l'arme. Tu commences à ressembler à un vrai flibustier.", target_nom: "Arme équipée", quantite: 1 },
        { ordre: 6, type: "DIALOGUE", description: "Makino te sourit tristement et te donne ses économies : 'Le monde est dangereux. Prépare-toi bien.'", target_nom: "Makino" },
        { ordre: 7, type: "ACTION", description: "Va dans l'onglet SKILLS. Utilise les Berrys pour acheter et équiper tes premières techniques de bagarre.", target_nom: "Compétences prêtes", quantite: 1 },
        { ordre: 8, type: "COMBAT_PVE", description: "Le bandit Higuma t'attend à la sortie ! Il veut ta prime avant même que tu ne sois parti. Défends-toi !", target_nom: "Bandit Higuma", quantite: 1 },
        { ordre: 9, type: "LIVRAISON", description: "Le combat fut rude. Makino te soigne avec un bon 'Pain de campagne' pour la route.", target_nom: "Pain de campagne", quantite: 1 },
        { ordre: 10, type: "DIALOGUE", description: "Ton radeau de fortune flotte dans la baie. Lève l'ancre, le Roi des Pirates, ce sera toi !", target_nom: "Radeau" }
      ]
    },
    {
      faction: "REVOLUTIONNAIRE", numero: 1, titre: "Le Secret du Terminal Gray",
      desc: "Terminal Gray. Une décharge immense où s'entassent les rebuts de la société noble. C'est dans cette ombre et cette fumée que la flamme de la rébellion est en train de naître.",
      recompense_xp: 500, recompense_berrys: 1000, unlock_island_id: fuchsia?.id,
      etapes: [
        { ordre: 1, type: "DIALOGUE", description: "Faufile-toi entre les ordures et trouve l'homme encapuchonné près de l'épave calcinée.", target_nom: "Agent Infiltré" },
        { ordre: 2, type: "ACTION", description: "La Révolution se bâtit dans l'effort. Transporte ces caisses de munitions pour renforcer notre cachette secrète.", target_nom: "Porter caisses", quantite: 10 },
        { ordre: 3, type: "ACTION", description: "L'Agent t'observe. Ouvre l'onglet STATS et distribue tes points. Nous avons besoin de soldats forts.", target_nom: "J'ai distribué mes points", quantite: 1 },
        { ordre: 4, type: "LIVRAISON", description: "L'agent te tend un 'Pistolet basique' dissimulé dans un chiffon. Prends-le, c'est l'outil de notre libération.", target_nom: "Pistolet basique", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Ouvre ton SAC et équipe ton arme discrètement. Reste vigilant.", target_nom: "Arme équipée", quantite: 1 },
        { ordre: 6, type: "DIALOGUE", description: "Agent : 'Tiens, voici des fonds du mouvement. Utilise-les pour apprendre à te défendre.'", target_nom: "Agent Infiltré" },
        { ordre: 7, type: "ACTION", description: "Va dans SKILLS. Achète et équipe des techniques de combat. Tu en auras besoin.", target_nom: "Compétences prêtes", quantite: 1 },
        { ordre: 8, type: "COMBAT_PVE", description: "Un Garde Royal s'est perdu dans la décharge et t'a repéré ! Fais-le taire avant qu'il ne rapporte notre position !", target_nom: "Garde Royal", quantite: 1 },
        { ordre: 9, type: "LIVRAISON", description: "Le combat est fini. Prends ce 'Pain de campagne' pour reprendre des forces.", target_nom: "Pain de campagne", quantite: 1 },
        { ordre: 10, type: "DIALOGUE", description: "Une barque t'attend sur la côte. Pars rejoindre nos frères d'armes. Le vent du changement souffle.", target_nom: "Agent Infiltré" }
      ]
    },

    // =====================================================================================
    //                                  CHAPITRE 2 : L'EXPÉDITION
    // =====================================================================================

    {
      faction: "MARINE", numero: 2, titre: "Nettoyage Côtier",
      desc: "Ta première mission t'envoie sur Goat Island. C'est un repaire connu de la pirate Alvida. L'entraînement est terminé, la réalité du terrain t'attend.",
      recompense_xp: 800, recompense_berrys: 1500, 
      unlock_island_id: goatIsland?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Prends ta chaloupe et navigue vers Goat Island en utilisant la Carte.", target_nom: "Goat Island" },
        { ordre: 2, type: "DIALOGUE", description: "Un éclaireur marine gît sur la plage, blessé. Il grimace : 'Ils sont violents... Fais attention...'", target_nom: "Éclaireur Marine" },
        { ordre: 3, type: "ACTION", description: "L'éclaireur te tend sa bourse tachée de sang : 'Je ne peux pas bouger. Va au Shop du village voisin et achète une Potion.'", target_nom: "Aller au Shop", quantite: 1 },
        { ordre: 4, type: "LIVRAISON", description: "Reviens et montre-lui la 'Potion mineure' pour prouver que tu es prêt à te soigner si besoin.", target_nom: "Potion mineure", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Si tu prends des coups durant ton voyage, bois la potion pour être au maximum de ta forme.", target_nom: "Ok c'est noté !", quantite: 1 },
        { ordre: 6, type: "ACTION", description: "Grimpe sur la colline et observe les environs pour localiser le campement d'Alvida.", target_nom: "Observer environs", quantite: 3 },
        { ordre: 7, type: "COMBAT_PVE", description: "Un pirate à la solde d'Alvida surgit des buissons ! Montre-lui la Justice !", target_nom: "Pirate à Massue", quantite: 1 },
        { ordre: 8, type: "DIALOGUE", description: "La zone est sécurisée. Utilise ta radio pour faire ton rapport au QG.", target_nom: "Radio Marine" }
      ]
    },
    {
      faction: "PIRATE", numero: 2, titre: "L'Ombre de la Marine",
      desc: "Tu arrives à Shells Town, une ville sous le joug de la Marine. C'est risqué, mais c'est ici que se trouvent les meilleures affaires pour un pirate débutant.",
      recompense_xp: 800, recompense_berrys: 1500, 
      unlock_island_id: shellsTown?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Utilise ton radeau pour naviguer discrètement jusqu'à Shells Town.", target_nom: "Shells Town" },
        { ordre: 2, type: "DIALOGUE", description: "Un informateur louche t'accoste dans une ruelle sombre. 'T'as une sale tête petit. La traversée a été dure ?'", target_nom: "Informateur Louche" },
        { ordre: 3, type: "ACTION", description: "Il te glisse quelques pièces : 'Va au Marché Noir (Shop) et achète une Potion. Un pirate mort ne paie pas ses dettes.'", target_nom: "Aller au Shop", quantite: 1 },
        { ordre: 4, type: "LIVRAISON", description: "Prouve à l'informateur que tu as récupéré la marchandise. Montre la 'Potion mineure'.", target_nom: "Potion mineure", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Si tu prends des coups durant ton voyage, bois la potion pour être au maximum de ta forme.", target_nom: "Ok c'est noté !", quantite: 1 },
        { ordre: 6, type: "ACTION", description: "Fonds-toi dans la masse et écoute les rumeurs près de la base de la Marine.", target_nom: "Écouter rumeurs", quantite: 3 },
        { ordre: 7, type: "COMBAT_PVE", description: "Une recrue de la Marine t'a reconnu ! Fais-le taire avant qu'il ne donne l'alerte !", target_nom: "Recrue de la Marine", quantite: 1 },
        { ordre: 8, type: "DIALOGUE", description: "Une petite fille nommée Rika t'a vu te battre. Impressionnée, elle t'offre un onigiri.", target_nom: "Rika" }
      ]
    },
    {
      faction: "REVOLUTIONNAIRE", numero: 2, titre: "Le Souffle du Samouraï",
      desc: "Tu as trouvé refuge au Village de Shimotsuki. C'est un lieu de paix et de sabre, idéal pour reprendre des forces loin du regard du Gouvernement.",
      recompense_xp: 800, recompense_berrys: 1500, 
      unlock_island_id: shimotsuki?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Mets le cap sur Shimotsuki Village. La traversée est longue pour une petite barque.", target_nom: "Village de Shimotsuki" }, 
        { ordre: 2, type: "DIALOGUE", description: "Un disciple du Dojo t'accueille à l'entrée. Il remarque tes blessures : 'Le Maître n'enseigne pas aux mourants.'", target_nom: "Disciple du Dojo" },
        { ordre: 3, type: "ACTION", description: "Il te tend une bourse : 'Va à l'épicerie du village (Shop) et achète une Potion pour te soigner.'", target_nom: "Aller au Shop", quantite: 1 },
        { ordre: 4, type: "LIVRAISON", description: "Montre la fiole de 'Potion mineure' au disciple pour prouver ta bonne foi.", target_nom: "Potion mineure", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Si tu prends des coups durant ton voyage, bois la potion pour être au maximum de ta forme.", target_nom: "Ok c'est noté !", quantite: 1 },
        { ordre: 6, type: "ACTION", description: "Pour gagner la confiance des locaux, aide à porter de l'eau du puits jusqu'au Dojo.", target_nom: "Porter de l'eau", quantite: 3 },
        { ordre: 7, type: "COMBAT_PVE", description: "Un élève zélé pense que tu es un espion et te provoque en duel au bokken !", target_nom: "Élève du Dojo", quantite: 1 },
        { ordre: 8, type: "DIALOGUE", description: "Le Maître Koushiro intervient calmement. Il t'accepte comme hôte temporaire dans son Dojo.", target_nom: "Koushiro" }
      ]
    },

    // =====================================================================================
    //                                  CHAPITRE 3 : ORANGE TOWN
    // =====================================================================================

    {
      faction: "MARINE", numero: 3, titre: "La Marée Noire du Commerce",
      desc: "Orange Town est tombée sous la coupe de Baggy le Clown. C'est un cirque chaotique où le commerce illégal prospère. La Marine doit rétablir l'ordre et enquêter sur les flux financiers.",
      recompense_xp: 1000, recompense_berrys: 2000, 
      unlock_island_id: orangeTown?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Naviguez jusqu'au Village d'Orange. L'ambiance y est faussement festive.", target_nom: "Le Village d'Orange" },
        { ordre: 2, type: "DIALOGUE", description: "Rencontrez l'agent infiltré dans une ruelle. Il murmure : 'Baggy utilise la ville pour blanchir son butin.'", target_nom: "Agent Marine Secret" },
        { ordre: 3, type: "ACTION", description: "Allez observer l'Hôtel des Ventes. C'est là que les vrais trésors changent de mains.", target_nom: "Inspecter Hôtel des Ventes", quantite: 1 },
        { ordre: 4, type: "ACTION", description: "Infiltrez le Casino. Vous pouvez jouer une partie pour écouter les conversations des pirates ivres.", target_nom: "Aller voir le Casino", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Si vous avez besoin de vous détendre, prouvez votre force à l'Arène et lancez un duel PVP pour intimider les criminels locaux.", target_nom: "Jeter un coup d'oeil à l'Arène", quantite: 1 },
        { ordre: 6, type: "ACTION", description: "Le moral est bas. Motivez les quelques soldats restés fidèles au poste.", target_nom: "Motiver Marines", quantite: 5 },
        { ordre: 7, type: "COMBAT_PVE", description: "Un Lieutenant d'élite de Baggy a repéré votre manège ! Arrêtez-le avant qu'il ne prévienne son capitaine.", target_nom: "Pirate de Baggy (Élite)", quantite: 1 },
        { ordre: 8, type: "DIALOGUE", description: "Rapport effectué. Vous avez perturbé les finances du Clown. L'agent vous donne votre prochaine cible.", target_nom: "Agent Marine Secret" }
      ]
    },
    {
      faction: "PIRATE", numero: 3, titre: "Voler le Show au Clown",
      desc: "Orange Town est le territoire de Baggy. C'est dangereux, mais il n'y a pas meilleur endroit pour s'enrichir rapidement et se faire un nom en défiant un capitaine établi.",
      recompense_xp: 1000, recompense_berrys: 2000, 
      unlock_island_id: orangeTown?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Mettez le cap sur le Village d'Orange. Évitez les boulets de canon spéciaux de Baggy.", target_nom: "Le Village d'Orange" },
        { ordre: 2, type: "DIALOGUE", description: "Un contrebandier vous aborde : 'Si tu veux survivre ici, tu dois maîtriser le flux des Berrys.'", target_nom: "Contrebandier" },
        { ordre: 3, type: "ACTION", description: "Allez observer l'Hôtel des Ventes. C'est là que les vrais trésors changent de mains.", target_nom: "Observer Hôtel des Ventes", quantite: 1 },
        { ordre: 4, type: "ACTION", description: "Vous pouvez tentez votre chance au Casino. Baggy adore les jeux de hasard.", target_nom: "Aller voir le Casino", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Pour vous faire respecter, vous pouvez vous battre dans l'Arène. Attention, vous vous battrez contre d'autres joueurs aguerris", target_nom: "Jeter un coup d'oeil à l'Arène", quantite: 1 },
        { ordre: 6, type: "ACTION", description: "Un contrebandier vous demande de l'aide pour passer de la marchandise, faites bien attention à ne rien faire tomber", target_nom: "Transporter des caisses", quantite: 5 },
        { ordre: 7, type: "COMBAT_PVE", description: "Mohji le Dompteur et son lion Richie vous barrent la route ! Battez-les pour rester en vie !", target_nom: "Mohji le Dompteur", quantite: 1 },
        { ordre: 8, type: "DIALOGUE", description: "Vous quittez la ville les poches pleines. Le contrebandier vous salue avec respect.", target_nom: "Contrebandier" }
      ]
    },
    {
      faction: "REVOLUTIONNAIRE", numero: 3, titre: "L'Abolition du Capital",
      desc: "Baggy le Clown opprime la population d'Orange Town tout en payant tribut pour qu'on le laisse tranquille. Il faut couper ses vivres et soulever le peuple contre cette tyrannie bouffonne.",
      recompense_xp: 1000, recompense_berrys: 2000, 
      unlock_island_id: orangeTown?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Entrez discrètement dans le Village d'Orange par les quais de marchandise.", target_nom: "Le Village d'Orange" },
        { ordre: 2, type: "DIALOGUE", description: "Rencontrez votre contact révolutionnaire caché dans une arrière-boutique.", target_nom: "Agent Révolutionnaire" },
        { ordre: 3, type: "ACTION", description: "Allez observer l'Hôtel des Ventes. C'est là que les vrais trésors changent de mains.", target_nom: "Observer Hôtel des Ventes", quantite: 1 },
        { ordre: 4, type: "ACTION", description: "Espionnez au Casino. C'est là que les notables corrompus dépensent l'argent volé aux travailleurs. *Débloque le Casino*", target_nom: "Jouer au Casino", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Recrutez des combattants à l'Arène. Lancez un duel PVP pour tester la détermination des locaux. *Débloque l'Arène*", target_nom: "Lancer Combat Arène", quantite: 1 },
        { ordre: 6, type: "ACTION", description: "Propagez l'idée de liberté. Distribuez 5 tracts révolutionnaires dans les quartiers pauvres.", target_nom: "Distribuer Tracts", quantite: 5 },
        { ordre: 7, type: "COMBAT_PVE", description: "Un Lieutenant corrompu tabasse un civil. Intervenez immédiatement ! Le peuple doit voir que nous les protégeons.", target_nom: "Lieutenant Pirate Corrompu", quantite: 1 },
        { ordre: 8, type: "DIALOGUE", description: "L'étincelle est allumée. L'Agent vous donne une nouvelle direction pour poursuivre la lutte.", target_nom: "Agent Révolutionnaire" }
      ]
    },

    // =====================================================================================
    //                                  CHAPITRE 4 : SIROP VILLAGE
    // =====================================================================================

    {
      faction: "MARINE", numero: 4, titre: "Enquête au Village des Menteurs",
      desc: "Une menace plane sur la paisible Mademoiselle Kaya au Village de Sirop. Un majordome suspect, Klahadore, semble cacher un lourd passé de pirate. La Marine doit lever le voile.",
      recompense_xp: 1200, recompense_berrys: 2500, 
      unlock_island_id: siropVillage?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Rejoignez le Village de Sirop. Tout semble trop calme ici.", target_nom: "Village de Sirop" },
        { ordre: 2, type: "DIALOGUE", description: "Parlez au Chef de la Garde locale. Il panique : 'Un éboulement bloque l'accès au manoir Kaya ! C'est du sabotage !'", target_nom: "Chef de la Garde" },
        { ordre: 3, type: "ACTION", description: "Il faut déblayer. Récoltez 4 bottes de Chanvre sauvage dans les champs pour fabriquer du matériel de levage.", target_nom: "Récolter Chanvre", quantite: 4 },
        { ordre: 4, type: "ACTION", description: "Ouvrez l'interface CRAFT. Utilisez le chanvre pour tresser une 'Corde' solide.", target_nom: "Crafter la Corde", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Utilisez la corde pour dégager les rochers et ouvrir la voie vers le manoir.", target_nom: "Utiliser la Corde", quantite: 1 },
        { ordre: 6, type: "DIALOGUE", description: "Kuro se tient là devant vous, il vous fixe... Puis avec un grand sourire il vous tend une enveloppe contenant 50 000 Berrys et une bague. La tentative de corruption vous met hors de vous, mais vous n'êtes pas de taille à l'affronter. Vous battez donc en retraite.", target_nom: "Prendre les objets et fuir" },
      ]
    },
    {
      faction: "PIRATE", numero: 4, titre: "L'Astuce du Radeau Bloqué",
      desc: "Le Village de Sirop est une escale tranquille, trop tranquille. En accostant, votre radeau s'est échoué dans la vase. Il va falloir ruser pour repartir avec un trésor.",
      recompense_xp: 1200, recompense_berrys: 2500, 
      unlock_island_id: siropVillage?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Faites voile vers le Village de Sirop. Attention aux récifs à marée basse.", target_nom: "Village de Sirop" },
        { ordre: 2, type: "DIALOGUE", description: "Un jeune homme au long nez, Usopp, se moque de vous : 'Hahaha ! Ton radeau est coincé ! Mais je peux t'aider contre un service...'", target_nom: "Usopp (le menteur)" },
        { ordre: 3, type: "ACTION", description: "Usopp a besoin de matériel. Allez récolter 4 Chanvres de qualité dans la forêt.", target_nom: "Récolter Chanvre", quantite: 4 },
        { ordre: 4, type: "ACTION", description: "Montrez vos talents manuels. Craftez une 'Corde' robuste dans votre menu CRAFT.", target_nom: "Crafter la Corde", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Attachez la corde à l'épave indiquée par Usopp et tirez de toutes vos forces pour révéler ce qui est caché dessous.", target_nom: "Utiliser Corde", quantite: 1 },
        { ordre: 6, type: "DIALOGUE", description: "Usopp est impressionné. Vous prenez le coffre et l'ouvrez, vous trouvez 50 000 Berrys et un anneau. Enhardis par votre trouvaille, vous ne trainez pas plus dans le coin, on ne sait jamais. Et puis vous ne le sentez pas ce 'Usopp'", target_nom: "Prend les items et repartir sur votre embarcation" },
      ]
    },
    {
      faction: "REVOLUTIONNAIRE", numero: 4, titre: "Échapper au Piège",
      desc: "Nos espions ont été repérés au Village de Sirop. La Marine a bouclé la zone et posé des pièges. Vous devez extraire des documents vitaux et vous enfuir sans laisser de trace.",
      recompense_xp: 1200, recompense_berrys: 2500, 
      unlock_island_id: siropVillage?.id, 
      etapes: [
        { ordre: 1, type: "VOYAGE", description: "Débarquez discrètement sur la plage nord du Village de Sirop.", target_nom: "Village de Sirop" },
        { ordre: 2, type: "DIALOGUE", description: "Un jeune garçon guetteur vous prévient : 'La route principale est minée ! Vous ne passerez pas par là !'", target_nom: "Garçon Alerteur" },
        { ordre: 3, type: "ACTION", description: "Il faut passer par les falaises. Récoltez 4 plantes de Chanvre pour fabriquer de quoi grimper.", target_nom: "Récolter Chanvre", quantite: 4 },
        { ordre: 4, type: "ACTION", description: "Soyez ingénieux. Craftez une 'Corde' d'escalade dans le menu CRAFT.", target_nom: "Crafter Corde", quantite: 1 },
        { ordre: 5, type: "ACTION", description: "Lancez la corde sur la paroi rocheuse et escaladez le mur pour contourner le barrage de la Marine.", target_nom: "Utiliser la Corde", quantite: 1 },
        { ordre: 6, type: "DIALOGUE", description: "Vous avez rejoint l'Agent de l'autre côté. Il vous remet votre récompense : 50 000 Berrys et un anneau. Mission accomplie.", target_nom: "Agent Révolutionnaire" },
      ]
    }
  ];

  for (const chap of DATA) {
    await prisma.histoire_chapitres.create({
        data: {
            faction: chap.faction,
            numero: chap.numero,
            titre: chap.titre,
            description: chap.desc,
            recompense_xp: chap.recompense_xp,
            recompense_berrys: chap.recompense_berrys,
            unlock_island_id: chap.unlock_island_id,
            etapes: {
                create: chap.etapes.map(e => ({
                    ordre: e.ordre,
                    type: e.type,
                    description: e.description,
                    target_nom: e.target_nom,
                    quantite: e.quantite || 1
                }))
            }
        }
    });
    console.log(`✅ Chapitre ${chap.numero} créé : ${chap.faction}`);
  }
  console.log('✨ Seeding Histoire COMPLÉTÉ (Storytelling Amélioré) !');
}

main().catch((e) => console.error(e)).finally(async () => await prisma.$disconnect());