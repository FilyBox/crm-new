/*
  Warnings:

  - You are about to drop the column `percentage` on the `Agregadora` table. All the data in the column will be lost.
  - You are about to drop the `Distrubidor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AgregadoraToAllMusic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AllMusicToDistrubidor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" DROP CONSTRAINT "_AgregadoraToAllMusic_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" DROP CONSTRAINT "_AgregadoraToAllMusic_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AllMusicToDistrubidor" DROP CONSTRAINT "_AllMusicToDistrubidor_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AllMusicToDistrubidor" DROP CONSTRAINT "_AllMusicToDistrubidor_B_fkey";

-- AlterTable
ALTER TABLE "public"."Agregadora" DROP COLUMN "percentage",
ADD COLUMN     "allMusicId" INTEGER;

-- DropTable
DROP TABLE "public"."Distrubidor";

-- DropTable
DROP TABLE "public"."_AgregadoraToAllMusic";

-- DropTable
DROP TABLE "public"."_AllMusicToDistrubidor";

-- CreateTable
CREATE TABLE "public"."AgregadoraAllMusic" (
    "id" SERIAL NOT NULL,
    "agregadoraId" INTEGER NOT NULL,
    "percentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "allMusicId" INTEGER NOT NULL,

    CONSTRAINT "AgregadoraAllMusic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DistribuidorAllMusic" (
    "id" SERIAL NOT NULL,
    "distribuidorId" INTEGER NOT NULL,
    "percentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "allMusicId" INTEGER NOT NULL,

    CONSTRAINT "DistribuidorAllMusic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Distribuidor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "allMusicId" INTEGER,

    CONSTRAINT "Distribuidor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Distribuidor_name_key" ON "public"."Distribuidor"("name");

-- AddForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" ADD CONSTRAINT "AgregadoraAllMusic_allMusicId_fkey" FOREIGN KEY ("allMusicId") REFERENCES "public"."AllMusic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" ADD CONSTRAINT "AgregadoraAllMusic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" ADD CONSTRAINT "AgregadoraAllMusic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" ADD CONSTRAINT "AgregadoraAllMusic_agregadoraId_fkey" FOREIGN KEY ("agregadoraId") REFERENCES "public"."Agregadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" ADD CONSTRAINT "DistribuidorAllMusic_allMusicId_fkey" FOREIGN KEY ("allMusicId") REFERENCES "public"."AllMusic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" ADD CONSTRAINT "DistribuidorAllMusic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" ADD CONSTRAINT "DistribuidorAllMusic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DistribuidorAllMusic" ADD CONSTRAINT "DistribuidorAllMusic_distribuidorId_fkey" FOREIGN KEY ("distribuidorId") REFERENCES "public"."Distribuidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
