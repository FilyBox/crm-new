-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "boardId" TEXT;

-- CreateTable
CREATE TABLE "public"."Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "useToChat" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_teamId_idx" ON "public"."Board"("teamId");

-- AddForeignKey
ALTER TABLE "public"."Board" ADD CONSTRAINT "Board_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
