-- AlterTable
ALTER TABLE "public"."objets" ADD COLUMN     "categorie" TEXT,
ADD COLUMN     "est_craftable" BOOLEAN DEFAULT false,
ADD COLUMN     "est_lootable" BOOLEAN DEFAULT true,
ADD COLUMN     "soin" INTEGER DEFAULT 0;
