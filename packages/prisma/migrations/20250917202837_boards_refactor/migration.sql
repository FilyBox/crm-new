/*
  Warnings:

  - You are about to drop the column `color` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `pinned` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `boardId` on the `Task` table. All the data in the column will be lost.
  - Added the required column `listId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_boardId_fkey";

-- DropIndex
DROP INDEX "public"."Board_teamId_idx";

-- AlterTable
ALTER TABLE "public"."Board" DROP COLUMN "color",
DROP COLUMN "pinned",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "boardId",
ADD COLUMN     "listId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."List" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "color" "public"."event_colors",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "List_teamId_idx" ON "public"."List"("teamId");

-- AddForeignKey
ALTER TABLE "public"."List" ADD CONSTRAINT "List_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."List" ADD CONSTRAINT "List_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "public"."List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
