-- AlterTable
ALTER TABLE "public"."AllMusic" ADD COLUMN     "recordLabelId" INTEGER;

-- CreateTable
CREATE TABLE "public"."RecordLabel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RecordLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecordLabel_name_key" ON "public"."RecordLabel"("name");

-- AddForeignKey
ALTER TABLE "public"."AllMusic" ADD CONSTRAINT "AllMusic_recordLabelId_fkey" FOREIGN KEY ("recordLabelId") REFERENCES "public"."RecordLabel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
