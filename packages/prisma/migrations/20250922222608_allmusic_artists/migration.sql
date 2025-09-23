/*
  Warnings:

  - You are about to drop the `_AllMusicToArtist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_AllMusicToArtist" DROP CONSTRAINT "_AllMusicToArtist_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AllMusicToArtist" DROP CONSTRAINT "_AllMusicToArtist_B_fkey";

-- DropTable
DROP TABLE "public"."_AllMusicToArtist";

-- CreateTable
CREATE TABLE "public"."ArtistsAllMusic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarImageId" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "url" TEXT,

    CONSTRAINT "ArtistsAllMusic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AllMusicToArtistsAllMusic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AllMusicToArtistsAllMusic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistsAllMusic_name_key" ON "public"."ArtistsAllMusic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistsAllMusic_url_key" ON "public"."ArtistsAllMusic"("url");

-- CreateIndex
CREATE INDEX "_AllMusicToArtistsAllMusic_B_index" ON "public"."_AllMusicToArtistsAllMusic"("B");

-- AddForeignKey
ALTER TABLE "public"."ArtistsAllMusic" ADD CONSTRAINT "ArtistsAllMusic_avatarImageId_fkey" FOREIGN KEY ("avatarImageId") REFERENCES "public"."AvatarImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToArtistsAllMusic" ADD CONSTRAINT "_AllMusicToArtistsAllMusic_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToArtistsAllMusic" ADD CONSTRAINT "_AllMusicToArtistsAllMusic_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ArtistsAllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
