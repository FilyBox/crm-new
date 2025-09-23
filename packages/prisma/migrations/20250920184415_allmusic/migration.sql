-- CreateTable
CREATE TABLE "public"."Virgin" (
    "id" SERIAL NOT NULL,
    "isrcVideo" TEXT,
    "isrcSong" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Virgin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Album" (
    "id" SERIAL NOT NULL,
    "isrcVideo" TEXT,
    "isrcSong" TEXT,
    "UPC" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AllMusic" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "isrcVideo" TEXT,
    "isrcSong" TEXT,
    "UPC" TEXT,
    "Agregadora" TEXT,
    "Disquera" TEXT,
    "Distribuitor" TEXT,
    "DistribuitorPercentage" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AllMusic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agregadora" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "percentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Agregadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Distrubidor" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "percentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Distrubidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoLinks" (
    "id" SERIAL NOT NULL,
    "isrcVideo" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lyrics" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VideoLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralLinks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GeneralLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AlbumToAllMusic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AlbumToAllMusic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AllMusicToArtist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AllMusicToArtist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AllMusicToDistrubidor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AllMusicToDistrubidor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AllMusicToVideoLinks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AllMusicToVideoLinks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AllMusicToGeneralLinks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AllMusicToGeneralLinks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AgregadoraToAllMusic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AgregadoraToAllMusic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AlbumToAllMusic_B_index" ON "public"."_AlbumToAllMusic"("B");

-- CreateIndex
CREATE INDEX "_AllMusicToArtist_B_index" ON "public"."_AllMusicToArtist"("B");

-- CreateIndex
CREATE INDEX "_AllMusicToDistrubidor_B_index" ON "public"."_AllMusicToDistrubidor"("B");

-- CreateIndex
CREATE INDEX "_AllMusicToVideoLinks_B_index" ON "public"."_AllMusicToVideoLinks"("B");

-- CreateIndex
CREATE INDEX "_AllMusicToGeneralLinks_B_index" ON "public"."_AllMusicToGeneralLinks"("B");

-- CreateIndex
CREATE INDEX "_AgregadoraToAllMusic_B_index" ON "public"."_AgregadoraToAllMusic"("B");

-- AddForeignKey
ALTER TABLE "public"."_AlbumToAllMusic" ADD CONSTRAINT "_AlbumToAllMusic_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AlbumToAllMusic" ADD CONSTRAINT "_AlbumToAllMusic_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToArtist" ADD CONSTRAINT "_AllMusicToArtist_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToArtist" ADD CONSTRAINT "_AllMusicToArtist_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToDistrubidor" ADD CONSTRAINT "_AllMusicToDistrubidor_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToDistrubidor" ADD CONSTRAINT "_AllMusicToDistrubidor_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Distrubidor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToVideoLinks" ADD CONSTRAINT "_AllMusicToVideoLinks_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToVideoLinks" ADD CONSTRAINT "_AllMusicToVideoLinks_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."VideoLinks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToGeneralLinks" ADD CONSTRAINT "_AllMusicToGeneralLinks_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AllMusicToGeneralLinks" ADD CONSTRAINT "_AllMusicToGeneralLinks_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."GeneralLinks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" ADD CONSTRAINT "_AgregadoraToAllMusic_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Agregadora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AgregadoraToAllMusic" ADD CONSTRAINT "_AgregadoraToAllMusic_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."AllMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
