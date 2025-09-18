/*
  Warnings:

  - Made the column `boardId` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Task" ALTER COLUMN "boardId" SET NOT NULL;
