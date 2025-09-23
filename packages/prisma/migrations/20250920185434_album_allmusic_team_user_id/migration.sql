/*
  Warnings:

  - You are about to drop the `Virgin` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `teamId` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `AllMusic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Album" ADD COLUMN     "teamId" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "public"."AllMusic" ADD COLUMN     "teamId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- DropTable
DROP TABLE "public"."Virgin";

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AllMusic" ADD CONSTRAINT "AllMusic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AllMusic" ADD CONSTRAINT "AllMusic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
