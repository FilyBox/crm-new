/*
  Warnings:

  - You are about to drop the column `allMusicId` on the `Agregadora` table. All the data in the column will be lost.
  - You are about to drop the `AgregadoraAllMusic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" DROP CONSTRAINT "AgregadoraAllMusic_agregadoraId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" DROP CONSTRAINT "AgregadoraAllMusic_allMusicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" DROP CONSTRAINT "AgregadoraAllMusic_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgregadoraAllMusic" DROP CONSTRAINT "AgregadoraAllMusic_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Agregadora" DROP COLUMN "allMusicId";

-- DropTable
DROP TABLE "public"."AgregadoraAllMusic";

-- CreateTable
CREATE TABLE "public"."_AgregadoraToAllMusic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AgregadoraToAllMusic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AgregadoraToAllMusic_B_index" ON "public"."_AgregadoraToAllMusic"("B");

-- AddForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" ADD CONSTRAINT "_AgregadoraToAllMusic_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Agregadora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" ADD CONSTRAINT "_AgregadoraToAllMusic_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
