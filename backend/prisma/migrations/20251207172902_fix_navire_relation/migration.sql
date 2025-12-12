/*
  Warnings:

  - You are about to drop the column `bonus_chance` on the `navires_ref` table. All the data in the column will be lost.
  - You are about to drop the column `cout_berrys` on the `navires_ref` table. All the data in the column will be lost.
  - You are about to drop the column `materiaux` on the `navires_ref` table. All the data in the column will be lost.
  - You are about to drop the column `nom_type` on the `navires_ref` table. All the data in the column will be lost.
  - You are about to drop the column `vitesse` on the `navires_ref` table. All the data in the column will be lost.
  - Added the required column `nom` to the `navires_ref` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."navires_ref" DROP COLUMN "bonus_chance",
DROP COLUMN "cout_berrys",
DROP COLUMN "materiaux",
DROP COLUMN "nom_type",
DROP COLUMN "vitesse",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "prix_berrys" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."navire_upgrade_couts" (
    "id" SERIAL NOT NULL,
    "navire_niveau" INTEGER NOT NULL,
    "objet_id" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "navire_upgrade_couts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."navire_upgrade_couts" ADD CONSTRAINT "navire_upgrade_couts_navire_niveau_fkey" FOREIGN KEY ("navire_niveau") REFERENCES "public"."navires_ref"("niveau") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."navire_upgrade_couts" ADD CONSTRAINT "navire_upgrade_couts_objet_id_fkey" FOREIGN KEY ("objet_id") REFERENCES "public"."objets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
