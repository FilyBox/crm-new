/*
  Warnings:

  - You are about to drop the column `documentId` on the `DocumentImages` table. All the data in the column will be lost.
  - Added the required column `recipientId` to the `DocumentImages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DocumentImages" DROP CONSTRAINT "DocumentImages_documentId_fkey";

-- DropIndex
DROP INDEX "public"."DocumentImages_documentId_idx";

-- AlterTable
ALTER TABLE "public"."DocumentImages" DROP COLUMN "documentId",
ADD COLUMN     "recipientId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "DocumentImages_recipientId_idx" ON "public"."DocumentImages"("recipientId");

-- AddForeignKey
ALTER TABLE "public"."DocumentImages" ADD CONSTRAINT "DocumentImages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
