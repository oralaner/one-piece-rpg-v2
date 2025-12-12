-- CreateTable
CREATE TABLE "public"."meteo_ref" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coeff_xp" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "coeff_berrys" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "coeff_duree" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "coeff_reussite" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "coeff_loot_chance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "meteo_ref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meteo_ref_nom_key" ON "public"."meteo_ref"("nom");
