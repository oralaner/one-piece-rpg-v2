/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `destinations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."destinations" ADD COLUMN     "difficulte" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "loots_possibles" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "xp_gain" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN "duree_minutes" SET DEFAULT 5,
ALTER COLUMN "gain_estime" SET DEFAULT 100;

-- CreateIndex
CREATE UNIQUE INDEX "destinations_nom_key" ON "public"."destinations"("nom");
