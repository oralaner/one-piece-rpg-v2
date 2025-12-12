-- CreateTable
CREATE TABLE "public"."banque_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipage_id" UUID,
    "pseudo_joueur" TEXT,
    "montant" INTEGER,
    "action" TEXT,
    "date_log" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banque_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."combats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "joueur_id" UUID,
    "adversaire_id" UUID,
    "pv_joueur_actuel" INTEGER,
    "pv_adversaire_actuel" INTEGER,
    "tour_numero" INTEGER DEFAULT 1,
    "log_combat" JSONB DEFAULT '[]',
    "est_termine" BOOLEAN DEFAULT false,
    "vainqueur_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "cooldowns" JSONB DEFAULT '{}',

    CONSTRAINT "combats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competences" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type_degats" TEXT,
    "arme_requise" TEXT,
    "puissance" INTEGER DEFAULT 10,
    "precision" INTEGER DEFAULT 90,
    "cout_achat" INTEGER DEFAULT 100,
    "image_url" TEXT,
    "exclusif_pnj" BOOLEAN DEFAULT false,
    "cooldown" INTEGER DEFAULT 0,
    "est_achetable" BOOLEAN DEFAULT true,

    CONSTRAINT "competences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."demandes_adhesion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipage_id" UUID,
    "joueur_id" UUID,
    "pseudo_joueur" TEXT,
    "date_demande" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demandes_adhesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."destinations" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "duree_minutes" INTEGER NOT NULL,
    "niveau_requis" INTEGER DEFAULT 1,
    "gain_estime" INTEGER,
    "image_url" TEXT,
    "pos_x" INTEGER DEFAULT 50,
    "pos_y" INTEGER DEFAULT 50,
    "type_lieu" TEXT DEFAULT 'ILE',
    "region" TEXT DEFAULT 'East Blue',

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "chef_id" UUID,
    "faction" TEXT NOT NULL,
    "date_creation" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "niveau" INTEGER DEFAULT 1,
    "xp" BIGINT DEFAULT 0,
    "berrys_banque" BIGINT DEFAULT 0,
    "expedition_etat" TEXT DEFAULT 'AUCUNE',
    "expedition_cible_id" INTEGER,
    "expedition_fin" TIMESTAMPTZ(6),
    "expedition_participants" UUID[] DEFAULT ARRAY[]::UUID[],
    "expeditions_reussies" INTEGER DEFAULT 0,

    CONSTRAINT "equipages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventaire" (
    "id" SERIAL NOT NULL,
    "joueur_id" UUID NOT NULL,
    "objet_id" INTEGER NOT NULL,
    "quantite" INTEGER DEFAULT 1,
    "stats_perso" JSONB,

    CONSTRAINT "inventaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."joueur_competences" (
    "joueur_id" UUID NOT NULL,
    "competence_id" INTEGER NOT NULL,

    CONSTRAINT "joueur_competences_pkey" PRIMARY KEY ("joueur_id","competence_id")
);

-- CreateTable
CREATE TABLE "public"."joueur_quetes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "joueur_id" UUID,
    "quete_ref_id" INTEGER,
    "avancement" INTEGER DEFAULT 0,
    "est_terminee" BOOLEAN DEFAULT false,
    "est_recoltee" BOOLEAN DEFAULT false,
    "date_attribution" DATE DEFAULT CURRENT_DATE,

    CONSTRAINT "joueur_quetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."joueur_titres" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "joueur_id" UUID,
    "titre_id" INTEGER,
    "date_obtention" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "joueur_titres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."joueurs" (
    "id" UUID NOT NULL,
    "pseudo" TEXT,
    "avatar_url" TEXT,
    "niveau" INTEGER DEFAULT 1,
    "xp" INTEGER DEFAULT 0,
    "berrys" INTEGER DEFAULT 100,
    "faction" TEXT DEFAULT 'Pirate',
    "derniere_activite" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expedition_fin" TIMESTAMPTZ(6),
    "expedition_dest_id" INTEGER,
    "force" INTEGER DEFAULT 10,
    "defense" INTEGER DEFAULT 5,
    "pv_max" INTEGER DEFAULT 100,
    "victoires" INTEGER DEFAULT 0,
    "defaites" INTEGER DEFAULT 0,
    "vitalite" INTEGER DEFAULT 1,
    "sagesse" INTEGER DEFAULT 1,
    "force_brute" INTEGER DEFAULT 1,
    "intelligence" INTEGER DEFAULT 1,
    "agilite" INTEGER DEFAULT 1,
    "chance" INTEGER DEFAULT 1,
    "points_carac" INTEGER DEFAULT 5,
    "pv_actuel" INTEGER DEFAULT 105,
    "pv_max_base" INTEGER DEFAULT 100,
    "last_pv_update" TIMESTAMP(3),
    "combats_journaliers" INTEGER DEFAULT 0,
    "dernier_reset_combats" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "casino_streak" INTEGER DEFAULT 0,
    "derniere_fouille" TIMESTAMPTZ(6) DEFAULT (now() - '01:00:00'::interval),
    "deck_combat" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "is_bot" BOOLEAN DEFAULT false,
    "victoires_pve" INTEGER DEFAULT 0,
    "defaites_pve" INTEGER DEFAULT 0,
    "victoires_pvp" INTEGER DEFAULT 0,
    "defaites_pvp" INTEGER DEFAULT 0,
    "elo_pvp" INTEGER DEFAULT 0,
    "fruit_demon" TEXT,
    "equipage_id" UUID,
    "part_xp_equipage" INTEGER DEFAULT 10,
    "equipage_demande_id" UUID,
    "xp_donnee_equipage" BIGINT DEFAULT 0,
    "prime" BIGINT DEFAULT 0,
    "haki_observation" BOOLEAN DEFAULT false,
    "haki_armement" BOOLEAN DEFAULT false,
    "haki_rois" BOOLEAN DEFAULT false,
    "niveau_navire" INTEGER DEFAULT 1,
    "nom_navire" TEXT DEFAULT 'Radeau de Fortune',
    "titre_actuel" TEXT,
    "nb_expeditions_reussies" INTEGER DEFAULT 0,
    "nb_crafts" INTEGER DEFAULT 0,
    "nb_coffres_ouverts" INTEGER DEFAULT 0,
    "nb_potions_bues" INTEGER DEFAULT 0,
    "nb_activites" INTEGER DEFAULT 0,
    "berrys_depenses_shop" BIGINT DEFAULT 0,
    "berrys_mises_casino" BIGINT DEFAULT 0,
    "a_tout_perdu_casino" BOOLEAN DEFAULT false,
    "equip_arme_id" INTEGER,
    "equip_tete_id" INTEGER,
    "equip_corps_id" INTEGER,
    "equip_bottes_id" INTEGER,
    "equip_bague_id" INTEGER,
    "equip_collier_id" INTEGER,
    "equip_navire_id" INTEGER,
    "last_play_des" TIMESTAMPTZ(6),
    "last_play_pfc" TIMESTAMPTZ(6),
    "last_play_quitte" TIMESTAMPTZ(6),

    CONSTRAINT "joueurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marche" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendeur_id" UUID,
    "objet_id" INTEGER,
    "quantite" INTEGER DEFAULT 1,
    "prix_unitaire" INTEGER NOT NULL,
    "stats_perso" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "joueur_id" UUID,
    "pseudo" TEXT NOT NULL,
    "faction" TEXT,
    "canal" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date_envoi" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meteo" (
    "region" TEXT NOT NULL,
    "climat" TEXT DEFAULT 'SOLEIL',
    "derniere_maj" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meteo_pkey" PRIMARY KEY ("region")
);

-- CreateTable
CREATE TABLE "public"."navires_ref" (
    "niveau" INTEGER NOT NULL,
    "nom_type" TEXT NOT NULL,
    "vitesse" DECIMAL DEFAULT 1.0,
    "bonus_chance" INTEGER DEFAULT 0,
    "cout_berrys" INTEGER DEFAULT 0,
    "materiaux" JSONB DEFAULT '{}',

    CONSTRAINT "navires_ref_pkey" PRIMARY KEY ("niveau")
);

-- CreateTable
CREATE TABLE "public"."objets" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "rarete" TEXT NOT NULL,
    "description" TEXT,
    "prix_vente" INTEGER DEFAULT 0,
    "image_url" TEXT,
    "prix_achat" INTEGER DEFAULT 0,
    "en_boutique" BOOLEAN DEFAULT false,
    "type_equipement" TEXT,
    "stats_bonus" JSONB DEFAULT '{}',
    "stock" INTEGER,
    "est_unique" BOOLEAN DEFAULT false,
    "nom_set" TEXT,

    CONSTRAINT "objets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quetes_ref" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "type_action" TEXT NOT NULL,
    "objectif_qte" INTEGER DEFAULT 1,
    "gain_xp" INTEGER DEFAULT 0,
    "gain_berrys" INTEGER DEFAULT 0,
    "categorie" TEXT DEFAULT 'JOURNALIERE',

    CONSTRAINT "quetes_ref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recettes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "objet_resultat_id" INTEGER,
    "ingredients" JSONB NOT NULL,
    "categorie" TEXT DEFAULT 'Autre',

    CONSTRAINT "recettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."titres_ref" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "condition_type" TEXT,
    "condition_valeur" BIGINT DEFAULT 0,
    "est_secret" BOOLEAN DEFAULT false,

    CONSTRAINT "titres_ref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banque_logs_equipage_id_idx" ON "public"."banque_logs"("equipage_id");

-- CreateIndex
CREATE INDEX "banque_logs_date_log_idx" ON "public"."banque_logs"("date_log" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "competences_nom_key" ON "public"."competences"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "unique_demande" ON "public"."demandes_adhesion"("equipage_id", "joueur_id");

-- CreateIndex
CREATE UNIQUE INDEX "nom_unique" ON "public"."equipages"("nom");

-- CreateIndex
CREATE INDEX "inventaire_joueur_id_idx" ON "public"."inventaire"("joueur_id");

-- CreateIndex
CREATE INDEX "inventaire_objet_id_idx" ON "public"."inventaire"("objet_id");

-- CreateIndex
CREATE UNIQUE INDEX "joueur_competences_unique" ON "public"."joueur_competences"("joueur_id", "competence_id");

-- CreateIndex
CREATE UNIQUE INDEX "joueur_titres_joueur_id_titre_id_key" ON "public"."joueur_titres"("joueur_id", "titre_id");

-- CreateIndex
CREATE INDEX "joueurs_equipage_id_idx" ON "public"."joueurs"("equipage_id");

-- CreateIndex
CREATE INDEX "joueurs_niveau_idx" ON "public"."joueurs"("niveau" DESC);

-- CreateIndex
CREATE INDEX "joueurs_elo_pvp_idx" ON "public"."joueurs"("elo_pvp" DESC);

-- CreateIndex
CREATE INDEX "marche_created_at_idx" ON "public"."marche"("created_at" DESC);

-- CreateIndex
CREATE INDEX "marche_prix_unitaire_idx" ON "public"."marche"("prix_unitaire");

-- CreateIndex
CREATE UNIQUE INDEX "objets_nom_key" ON "public"."objets"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "titres_ref_nom_key" ON "public"."titres_ref"("nom");

-- AddForeignKey
ALTER TABLE "public"."banque_logs" ADD CONSTRAINT "banque_logs_equipage_id_fkey" FOREIGN KEY ("equipage_id") REFERENCES "public"."equipages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."demandes_adhesion" ADD CONSTRAINT "demandes_adhesion_equipage_id_fkey" FOREIGN KEY ("equipage_id") REFERENCES "public"."equipages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."demandes_adhesion" ADD CONSTRAINT "demandes_adhesion_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."equipages" ADD CONSTRAINT "equipages_chef_id_fkey" FOREIGN KEY ("chef_id") REFERENCES "public"."joueurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventaire" ADD CONSTRAINT "inventaire_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventaire" ADD CONSTRAINT "inventaire_objet_id_fkey" FOREIGN KEY ("objet_id") REFERENCES "public"."objets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueur_competences" ADD CONSTRAINT "joueur_competences_competence_id_fkey" FOREIGN KEY ("competence_id") REFERENCES "public"."competences"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueur_competences" ADD CONSTRAINT "joueur_competences_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueur_quetes" ADD CONSTRAINT "joueur_quetes_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueur_quetes" ADD CONSTRAINT "joueur_quetes_quete_ref_id_fkey" FOREIGN KEY ("quete_ref_id") REFERENCES "public"."quetes_ref"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueur_titres" ADD CONSTRAINT "joueur_titres_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueur_titres" ADD CONSTRAINT "joueur_titres_titre_id_fkey" FOREIGN KEY ("titre_id") REFERENCES "public"."titres_ref"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equipage_id_fkey" FOREIGN KEY ("equipage_id") REFERENCES "public"."equipages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_expedition_dest_id_fkey" FOREIGN KEY ("expedition_dest_id") REFERENCES "public"."destinations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_arme_id_fkey" FOREIGN KEY ("equip_arme_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_tete_id_fkey" FOREIGN KEY ("equip_tete_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_corps_id_fkey" FOREIGN KEY ("equip_corps_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_bottes_id_fkey" FOREIGN KEY ("equip_bottes_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_bague_id_fkey" FOREIGN KEY ("equip_bague_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_collier_id_fkey" FOREIGN KEY ("equip_collier_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."joueurs" ADD CONSTRAINT "joueurs_equip_navire_id_fkey" FOREIGN KEY ("equip_navire_id") REFERENCES "public"."inventaire"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."marche" ADD CONSTRAINT "marche_objet_id_fkey" FOREIGN KEY ("objet_id") REFERENCES "public"."objets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."marche" ADD CONSTRAINT "marche_vendeur_id_fkey" FOREIGN KEY ("vendeur_id") REFERENCES "public"."joueurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."recettes" ADD CONSTRAINT "recettes_objet_resultat_id_fkey" FOREIGN KEY ("objet_resultat_id") REFERENCES "public"."objets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
