-- CreateTable
CREATE TABLE "public"."_AlbumToArtist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AlbumToArtist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AlbumToArtist_B_index" ON "public"."_AlbumToArtist"("B");

-- AddForeignKey
ALTER TABLE "public"."_AlbumToArtist" ADD CONSTRAINT "_AlbumToArtist_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AlbumToArtist" ADD CONSTRAINT "_AlbumToArtist_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
