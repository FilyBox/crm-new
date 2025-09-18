/*
  Warnings:

  - The `visibility` column on the `Board` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."BoardVisibility" AS ENUM ('EVERYONE', 'MANAGER_AND_ABOVE', 'ADMIN', 'ONLY_ME');

-- AlterTable
ALTER TABLE "public"."Board" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "public"."BoardVisibility" NOT NULL DEFAULT 'EVERYONE';
