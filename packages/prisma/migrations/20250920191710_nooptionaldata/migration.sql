/*
  Warnings:

  - You are about to drop the column `Agregadora` on the `AllMusic` table. All the data in the column will be lost.
  - You are about to drop the column `Disquera` on the `AllMusic` table. All the data in the column will be lost.
  - You are about to drop the column `Distribuitor` on the `AllMusic` table. All the data in the column will be lost.
  - You are about to drop the column `DistribuitorPercentage` on the `AllMusic` table. All the data in the column will be lost.
  - Made the column `name` on table `Agregadora` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `AllMusic` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Distrubidor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Agregadora" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."AllMusic" DROP COLUMN "Agregadora",
DROP COLUMN "Disquera",
DROP COLUMN "Distribuitor",
DROP COLUMN "DistribuitorPercentage",
ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Distrubidor" ALTER COLUMN "name" SET NOT NULL;
