/*
  Warnings:

  - You are about to drop the column `ingredients` on the `recettes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."recettes" DROP COLUMN "ingredients",
ADD COLUMN     "temps_craft" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "xp_craft" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "public"."recette_ingredients" (
    "id" SERIAL NOT NULL,
    "recette_id" INTEGER NOT NULL,
    "objet_ingredient_id" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "recette_ingredients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."recette_ingredients" ADD CONSTRAINT "recette_ingredients_recette_id_fkey" FOREIGN KEY ("recette_id") REFERENCES "public"."recettes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recette_ingredients" ADD CONSTRAINT "recette_ingredients_objet_ingredient_id_fkey" FOREIGN KEY ("objet_ingredient_id") REFERENCES "public"."objets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
