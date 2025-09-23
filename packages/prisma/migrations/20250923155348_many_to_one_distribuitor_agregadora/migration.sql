/*
  Warnings:

  - You are about to drop the column `allMusicId` on the `Distribuidor` table. All the data in the column will be lost.
  - You are about to drop the `DistribuidorAllMusic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AgregadoraToAllMusic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" DROP CONSTRAINT "DistribuidorAllMusic_allMusicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" DROP CONSTRAINT "DistribuidorAllMusic_distribuidorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" DROP CONSTRAINT "DistribuidorAllMusic_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" DROP CONSTRAINT "DistribuidorAllMusic_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" DROP CONSTRAINT "_AgregadoraToAllMusic_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" DROP CONSTRAINT "_AgregadoraToAllMusic_B_fkey";

-- AlterTable
ALTER TABLE "public"."AllMusic" ADD COLUMN     "agregadoraId" INTEGER,
ADD COLUMN     "distribuidorId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Distribuidor" DROP COLUMN "allMusicId";

-- DropTable
DROP TABLE "public"."DistribuidorAllMusic";

-- DropTable
DROP TABLE "public"."_AgregadoraToAllMusic";

-- AddForeignKey
ALTER TABLE "public"."AllMusic" ADD CONSTRAINT "AllMusic_agregadoraId_fkey" FOREIGN KEY ("agregadoraId") REFERENCES "public"."Agregadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AllMusic" ADD CONSTRAINT "AllMusic_distribuidorId_fkey" FOREIGN KEY ("distribuidorId") REFERENCES "public"."Distribuidor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
