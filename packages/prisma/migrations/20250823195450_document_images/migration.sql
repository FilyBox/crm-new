-- CreateTable
CREATE TABLE "public"."DocumentImages" (
    "id" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentImages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentImages_documentId_idx" ON "public"."DocumentImages"("documentId");

-- AddForeignKey
ALTER TABLE "public"."DocumentImages" ADD CONSTRAINT "DocumentImages_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
