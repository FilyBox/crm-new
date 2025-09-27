/*
  Warnings:

  - You are about to drop the `IsrcArtists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtistToIsrcSongs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_IsrcArtistsToIsrcSongs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."IsrcArtists" DROP CONSTRAINT "IsrcArtists_artistId_fkey";

-- DropForeignKey
ALTER TABLE "public"."IsrcArtists" DROP CONSTRAINT "IsrcArtists_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."IsrcArtists" DROP CONSTRAINT "IsrcArtists_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ArtistToIsrcSongs" DROP CONSTRAINT "_ArtistToIsrcSongs_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ArtistToIsrcSongs" DROP CONSTRAINT "_ArtistToIsrcSongs_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_IsrcArtistsToIsrcSongs" DROP CONSTRAINT "_IsrcArtistsToIsrcSongs_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_IsrcArtistsToIsrcSongs" DROP CONSTRAINT "_IsrcArtistsToIsrcSongs_B_fkey";

-- DropTable
DROP TABLE "public"."IsrcArtists";

-- DropTable
DROP TABLE "public"."_ArtistToIsrcSongs";

-- DropTable
DROP TABLE "public"."_IsrcArtistsToIsrcSongs";

-- CreateTable
CREATE TABLE "public"."_ArtistsAllMusicToIsrcSongs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistsAllMusicToIsrcSongs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArtistsAllMusicToIsrcSongs_B_index" ON "public"."_ArtistsAllMusicToIsrcSongs"("B");

-- AddForeignKey
ALTER TABLE "public"."_ArtistsAllMusicToIsrcSongs" ADD CONSTRAINT "_ArtistsAllMusicToIsrcSongs_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ArtistsAllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ArtistsAllMusicToIsrcSongs" ADD CONSTRAINT "_ArtistsAllMusicToIsrcSongs_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."IsrcSongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
