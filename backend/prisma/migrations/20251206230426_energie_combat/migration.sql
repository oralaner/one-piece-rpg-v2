-- AlterTable
ALTER TABLE "public"."joueurs" ADD COLUMN     "energie_actuelle" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "last_energie_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
