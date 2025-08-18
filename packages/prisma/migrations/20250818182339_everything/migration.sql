/*
  Warnings:

  - Added the required column `buyerId` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BuyerRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "songRoles" AS ENUM ('WRITER', 'COMPOSER', 'ARRANGER', 'PRODUCER', 'MIXER', 'MASTERING_ENGINEER');

-- CreateEnum
CREATE TYPE "TypeSongAlbum" AS ENUM ('SONG', 'ALBUM');

-- CreateEnum
CREATE TYPE "StatusSongAlbum" AS ENUM ('DELETED', 'RELEASED', 'PENDING', 'DRAFT');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('VIGENTE', 'FINALIZADO', 'NO_ESPECIFICADO');

-- CreateEnum
CREATE TYPE "ExpansionPossibility" AS ENUM ('SI', 'NO', 'NO_ESPECIFICADO');

-- CreateEnum
CREATE TYPE "RetentionAndCollectionPeriod" AS ENUM ('SI', 'NO', 'NO_ESPECIFICADO');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('ARRENDAMIENTOS', 'ALQUILERES', 'VEHICULOS', 'SERVICIOS', 'ARTISTAS');

-- CreateEnum
CREATE TYPE "Release" AS ENUM ('Soft', 'Focus');

-- CreateEnum
CREATE TYPE "TypeOfRelease" AS ENUM ('Sencillo', 'Album', 'EP');

-- CreateEnum
CREATE TYPE "TypeOfTuStreams" AS ENUM ('Sencillo', 'Album', 'Single', 'EP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FolderType" ADD VALUE 'CHAT';
ALTER TYPE "FolderType" ADD VALUE 'CONTRACT';
ALTER TYPE "FolderType" ADD VALUE 'FILE';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "buyerId" TEXT;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "useToChat" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "buyerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "buyerId" TEXT;

-- CreateTable
CREATE TABLE "ContractTemplates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "body" TEXT,
    "url" TEXT,
    "type" TEXT,
    "status" TEXT,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContractTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "documentId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "visibility" VARCHAR(255) NOT NULL DEFAULT 'private',

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageV2" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "parts" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "chatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "isUpvoted" BOOLEAN NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("chatId","messageId")
);

-- CreateTable
CREATE TABLE "Vote_v2" (
    "chatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "isUpvoted" BOOLEAN NOT NULL,

    CONSTRAINT "Vote_v2_pkey" PRIMARY KEY ("chatId","messageId")
);

-- CreateTable
CREATE TABLE "ChatDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "kind" VARCHAR(255) NOT NULL DEFAULT 'text',
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ChatDocument_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentCreatedAt" TIMESTAMP(3) NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "description" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "description" VARCHAR(200),
    "image" TEXT,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "venue" VARCHAR(300),
    "beginning" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescheduled_event_dates" (
    "id" TEXT NOT NULL,
    "event_id" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rescheduled_event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "buyerId" TEXT NOT NULL,
    "ticketTypeId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'In process',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" TEXT NOT NULL,
    "password" TEXT,
    "razon" TEXT,
    "uid" TEXT,
    "name" TEXT,
    "rfc" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phoneNumber" VARCHAR(20),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "BuyerRole" NOT NULL DEFAULT 'USER',
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_current_period_end" TIMESTAMP(3),

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTemplate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" INTEGER,
    "maxQuantityPerUser" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "TicketTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "eventId" INTEGER NOT NULL,
    "price" INTEGER,
    "uid" TEXT,
    "maxQuantityPerUser" INTEGER NOT NULL DEFAULT 5,
    "quantity" INTEGER,
    "available" INTEGER,
    "description" TEXT,
    "seatNumber" INTEGER,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "imageUrl" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'valid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketBuyer" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "eventId" INTEGER NOT NULL,
    "buyerId" TEXT NOT NULL,
    "ticketId" INTEGER,
    "price" INTEGER,
    "quantity" INTEGER,
    "stripeProductId" TEXT,
    "imageUrl" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'valid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TicketBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Writers" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "songroles" "songRoles"[] DEFAULT ARRAY['WRITER']::"songRoles"[],
    "avatarImageId" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "url" TEXT,

    CONSTRAINT "Writers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lpmProductDisplayArtists" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "lpmProductDisplayArtists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releasesArtists" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "releasesArtists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[],
    "avatarImageId" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "url" TEXT,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "artistId" INTEGER NOT NULL,
    "bio" TEXT,

    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Songs" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "author" TEXT,
    "teamId" INTEGER NOT NULL,
    "publisherMexico" TEXT,
    "publisherUSA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "type" "TypeSongAlbum"[],
    "status" "StatusSongAlbum"[],
    "uniqueIdentifier" TEXT,
    "royaltyPercentage" TEXT,

    CONSTRAINT "Songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lpm" (
    "id" SERIAL NOT NULL,
    "productId" TEXT,
    "Product Type" TEXT,
    "Product Title" TEXT,
    "Product Version" TEXT,
    "Product Display Artist" TEXT,
    "Parent Label" TEXT,
    "label" TEXT,
    "Original Release Date" TIMESTAMP(3),
    "Release Date" TIMESTAMP(3),
    "UPC" TEXT,
    "Catalog " TEXT,
    "Product Price Tier" TEXT,
    "Product Genre" TEXT,
    "Submission Status" TEXT,
    "Product C Line" TEXT,
    "Product P Line" TEXT,
    "PreOrder Date" TIMESTAMP(3),
    "Exclusives" TEXT,
    "ExplicitLyrics" TEXT,
    "Product Play Link" TEXT,
    "Liner Notes" TEXT,
    "Primary Metadata Language" TEXT,
    "Compilation" TEXT,
    "PDF Booklet" TEXT,
    "Timed Release Date" TIMESTAMP(3),
    "Timed Release Music Services" TIMESTAMP(3),
    "Last Process Date" TIMESTAMP(3),
    "Import Date" TIMESTAMP(3),
    "Created By" TEXT,
    "Last Modified" TIMESTAMP(3),
    "Submitted At" TIMESTAMP(3),
    "Submitted By" TEXT,
    "Vevo Channel" TEXT,
    "TrackType" TEXT,
    "Track Id" TEXT,
    "Track Volume" BOOLEAN,
    "Track Number" TEXT,
    "Track Name" TEXT,
    "Track Version" TEXT,
    "Track Display Artist" TEXT,
    "Isrc" TEXT,
    "Track Price Tier" TEXT,
    "Track Genre" TEXT,
    "Audio Language" TEXT,
    "Track C Line" TEXT,
    "Track P Line" TEXT,
    "WritersComposers" TEXT,
    "PublishersCollection Societies" TEXT,
    "Withhold Mechanicals" TEXT,
    "PreOrder Type" TEXT,
    "Instant Gratification Date" TIMESTAMP(3),
    "Duration" TEXT,
    "Sample Start Time" TEXT,
    "Explicit Lyrics" TEXT,
    "Album Only" TEXT,
    "Lyrics" TEXT,
    "AdditionalContributorsPerforming" TEXT,
    "AdditionalContributorsNonPerforming" TEXT,
    "Producers" TEXT,
    "Continuous Mix" TEXT,
    "Continuously Mixed Individual Song" TEXT,
    "Track Play Link" TEXT,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "lpm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contracts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "artists" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isPossibleToExpand" "ExpansionPossibility" NOT NULL DEFAULT 'NO_ESPECIFICADO',
    "possibleExtensionTime" TEXT,
    "status" "ContractStatus" DEFAULT 'NO_ESPECIFICADO',
    "collectionPeriod" "RetentionAndCollectionPeriod",
    "retentionPeriod" "RetentionAndCollectionPeriod",
    "retentionPeriodDescription" TEXT,
    "retentionPeriodDuration" TEXT,
    "collectionPeriodDescription" TEXT,
    "collectionPeriodDuration" TEXT,
    "contractType" "ContractType",
    "documentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "folderId" TEXT,

    CONSTRAINT "Contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Territories" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarImageId" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "Territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionStatementTerritories" (
    "id" SERIAL NOT NULL,
    "territoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "DistributionStatementTerritories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionStatementMusicPlatforms" (
    "id" SERIAL NOT NULL,
    "platformId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "DistributionStatementMusicPlatforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicPlatforms" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarImageId" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "url" TEXT,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "MusicPlatforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionStatement" (
    "id" SERIAL NOT NULL,
    "Marketing Owner" TEXT,
    "Nombre Distribucion" TEXT,
    "Projecto" TEXT,
    "Numero de Catalogo" TEXT,
    "UPC" TEXT,
    "Local Product Number" TEXT,
    "ISRC" TEXT,
    "Titulo catalogo" TEXT,
    "Mes Reportado" INTEGER,
    "Territorio" TEXT,
    "Codigo del Territorio" TEXT,
    "Nombre del Territorio" TEXT,
    "Tipo de Precio" TEXT,
    "Tipo de Ingreso" TEXT,
    "Venta" DOUBLE PRECISION,
    "RTL" DOUBLE PRECISION,
    "PPD" DOUBLE PRECISION,
    "RBP" DOUBLE PRECISION,
    "Tipo de Cambio:" DOUBLE PRECISION,
    "Valor Recibido" DOUBLE PRECISION,
    "Regalias Artisticas" DOUBLE PRECISION,
    "Costo Distribucion" DOUBLE PRECISION,
    "Copyright" DOUBLE PRECISION,
    "Cuota Administracion" DOUBLE PRECISION,
    "Costo Carga" DOUBLE PRECISION,
    "Otros Costos" DOUBLE PRECISION,
    "Ingresos Recibidos" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "DistributionStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Releases" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3),
    "artist" TEXT,
    "lanzamiento" TEXT,
    "typeOfRelease" "TypeOfRelease",
    "release" "Release",
    "uploaded" TEXT,
    "streamingLink" TEXT,
    "assets" BOOLEAN,
    "canvas" BOOLEAN,
    "cover" BOOLEAN,
    "audioWAV" BOOLEAN,
    "video" BOOLEAN,
    "banners" BOOLEAN,
    "pitch" BOOLEAN,
    "EPKUpdates" BOOLEAN,
    "WebSiteUpdates" BOOLEAN,
    "Biography" BOOLEAN,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsrcArtists" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "IsrcArtists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsrcSongs" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3),
    "isrc" TEXT,
    "artist" TEXT,
    "duration" TEXT,
    "trackName" TEXT,
    "title" TEXT,
    "license" TEXT,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IsrcSongs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuStreamsArtists" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "tuStreamsArtists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuStreams" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "UPC" TEXT,
    "artist" TEXT,
    "type" "TypeOfTuStreams",
    "total" DOUBLE PRECISION,
    "date" TIMESTAMP(3),
    "userId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tuStreams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilesShareLink" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilesShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Files" (
    "id" SERIAL NOT NULL,
    "qrToken" TEXT,
    "userId" INTEGER NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'EVERYONE',
    "title" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "fileDataId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "teamId" INTEGER NOT NULL,
    "useToChat" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistToEvent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistToEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtistToReleases" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistToReleases_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtistToSongs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistToSongs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtistToIsrcSongs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistToIsrcSongs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtistTolpm" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistTolpm_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtistTotuStreams" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistTotuStreams_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_lpmTolpmProductDisplayArtists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_lpmTolpmProductDisplayArtists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DistributionStatementToDistributionStatementMusicPlatforms" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DistributionStatementToDistributionStatementMusicPlatf_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DistributionStatementToDistributionStatementTerritories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DistributionStatementToDistributionStatementTerritorie_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ReleasesToreleasesArtists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ReleasesToreleasesArtists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IsrcArtistsToIsrcSongs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_IsrcArtistsToIsrcSongs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_tuStreamsTotuStreamsArtists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_tuStreamsTotuStreamsArtists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "rescheduled_event_dates_event_id_idx" ON "rescheduled_event_dates"("event_id");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_ticketTypeId_idx" ON "Order"("ticketTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_buyerId_idx" ON "sessions"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_uid_key" ON "buyers"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_email_key" ON "buyers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_stripe_customer_id_key" ON "buyers"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_stripe_subscription_id_key" ON "buyers"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_buyerId_key" ON "TwoFactorConfirmation"("buyerId");

-- CreateIndex
CREATE INDEX "Queue_buyerId_idx" ON "Queue"("buyerId");

-- CreateIndex
CREATE INDEX "Queue_eventId_idx" ON "Queue"("eventId");

-- CreateIndex
CREATE INDEX "TicketTemplate_teamId_idx" ON "TicketTemplate"("teamId");

-- CreateIndex
CREATE INDEX "TicketTemplate_userId_idx" ON "TicketTemplate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Writers_url_key" ON "Writers"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_url_key" ON "Artist"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_artistId_key" ON "ArtistProfile"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "Songs_url_key" ON "Songs"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Songs_uniqueIdentifier_key" ON "Songs"("uniqueIdentifier");

-- CreateIndex
CREATE INDEX "Contracts_folderId_idx" ON "Contracts"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "Territories_name_key" ON "Territories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPlatforms_name_key" ON "MusicPlatforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPlatforms_url_key" ON "MusicPlatforms"("url");

-- CreateIndex
CREATE INDEX "DistributionStatement_userId_idx" ON "DistributionStatement"("userId");

-- CreateIndex
CREATE INDEX "DistributionStatement_teamId_idx" ON "DistributionStatement"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "FilesShareLink_slug_key" ON "FilesShareLink"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FilesShareLink_fileId_email_key" ON "FilesShareLink"("fileId", "email");

-- CreateIndex
CREATE INDEX "Files_userId_idx" ON "Files"("userId");

-- CreateIndex
CREATE INDEX "Files_status_idx" ON "Files"("status");

-- CreateIndex
CREATE INDEX "Files_folderId_idx" ON "Files"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "Files_fileDataId_key" ON "Files"("fileDataId");

-- CreateIndex
CREATE INDEX "_ArtistToEvent_B_index" ON "_ArtistToEvent"("B");

-- CreateIndex
CREATE INDEX "_ArtistToReleases_B_index" ON "_ArtistToReleases"("B");

-- CreateIndex
CREATE INDEX "_ArtistToSongs_B_index" ON "_ArtistToSongs"("B");

-- CreateIndex
CREATE INDEX "_ArtistToIsrcSongs_B_index" ON "_ArtistToIsrcSongs"("B");

-- CreateIndex
CREATE INDEX "_ArtistTolpm_B_index" ON "_ArtistTolpm"("B");

-- CreateIndex
CREATE INDEX "_ArtistTotuStreams_B_index" ON "_ArtistTotuStreams"("B");

-- CreateIndex
CREATE INDEX "_lpmTolpmProductDisplayArtists_B_index" ON "_lpmTolpmProductDisplayArtists"("B");

-- CreateIndex
CREATE INDEX "_DistributionStatementToDistributionStatementMusicPlatf_B_index" ON "_DistributionStatementToDistributionStatementMusicPlatforms"("B");

-- CreateIndex
CREATE INDEX "_DistributionStatementToDistributionStatementTerritorie_B_index" ON "_DistributionStatementToDistributionStatementTerritories"("B");

-- CreateIndex
CREATE INDEX "_ReleasesToreleasesArtists_B_index" ON "_ReleasesToreleasesArtists"("B");

-- CreateIndex
CREATE INDEX "_IsrcArtistsToIsrcSongs_B_index" ON "_IsrcArtistsToIsrcSongs"("B");

-- CreateIndex
CREATE INDEX "_tuStreamsTotuStreamsArtists_B_index" ON "_tuStreamsTotuStreamsArtists"("B");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTemplates" ADD CONSTRAINT "ContractTemplates_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageV2" ADD CONSTRAINT "MessageV2_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MessageV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatDocument" ADD CONSTRAINT "ChatDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_documentCreatedAt_fkey" FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "ChatDocument"("id", "createdAt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescheduled_event_dates" ADD CONSTRAINT "rescheduled_event_dates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketBuyer" ADD CONSTRAINT "TicketBuyer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketBuyer" ADD CONSTRAINT "TicketBuyer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lpmProductDisplayArtists" ADD CONSTRAINT "lpmProductDisplayArtists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lpmProductDisplayArtists" ADD CONSTRAINT "lpmProductDisplayArtists_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lpmProductDisplayArtists" ADD CONSTRAINT "lpmProductDisplayArtists_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releasesArtists" ADD CONSTRAINT "releasesArtists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releasesArtists" ADD CONSTRAINT "releasesArtists_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releasesArtists" ADD CONSTRAINT "releasesArtists_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfile" ADD CONSTRAINT "ArtistProfile_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Songs" ADD CONSTRAINT "Songs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lpm" ADD CONSTRAINT "lpm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lpm" ADD CONSTRAINT "lpm_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territories" ADD CONSTRAINT "Territories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territories" ADD CONSTRAINT "Territories_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatementTerritories" ADD CONSTRAINT "DistributionStatementTerritories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatementTerritories" ADD CONSTRAINT "DistributionStatementTerritories_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatementTerritories" ADD CONSTRAINT "DistributionStatementTerritories_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatementMusicPlatforms" ADD CONSTRAINT "DistributionStatementMusicPlatforms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatementMusicPlatforms" ADD CONSTRAINT "DistributionStatementMusicPlatforms_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatementMusicPlatforms" ADD CONSTRAINT "DistributionStatementMusicPlatforms_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "MusicPlatforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPlatforms" ADD CONSTRAINT "MusicPlatforms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPlatforms" ADD CONSTRAINT "MusicPlatforms_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatement" ADD CONSTRAINT "DistributionStatement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStatement" ADD CONSTRAINT "DistributionStatement_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Releases" ADD CONSTRAINT "Releases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Releases" ADD CONSTRAINT "Releases_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsrcArtists" ADD CONSTRAINT "IsrcArtists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsrcArtists" ADD CONSTRAINT "IsrcArtists_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsrcArtists" ADD CONSTRAINT "IsrcArtists_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsrcSongs" ADD CONSTRAINT "IsrcSongs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsrcSongs" ADD CONSTRAINT "IsrcSongs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuStreamsArtists" ADD CONSTRAINT "tuStreamsArtists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuStreamsArtists" ADD CONSTRAINT "tuStreamsArtists_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuStreamsArtists" ADD CONSTRAINT "tuStreamsArtists_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuStreams" ADD CONSTRAINT "tuStreams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuStreams" ADD CONSTRAINT "tuStreams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilesShareLink" ADD CONSTRAINT "FilesShareLink_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_fileDataId_fkey" FOREIGN KEY ("fileDataId") REFERENCES "DocumentData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToEvent" ADD CONSTRAINT "_ArtistToEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToEvent" ADD CONSTRAINT "_ArtistToEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToReleases" ADD CONSTRAINT "_ArtistToReleases_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToReleases" ADD CONSTRAINT "_ArtistToReleases_B_fkey" FOREIGN KEY ("B") REFERENCES "Releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToSongs" ADD CONSTRAINT "_ArtistToSongs_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToSongs" ADD CONSTRAINT "_ArtistToSongs_B_fkey" FOREIGN KEY ("B") REFERENCES "Songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToIsrcSongs" ADD CONSTRAINT "_ArtistToIsrcSongs_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToIsrcSongs" ADD CONSTRAINT "_ArtistToIsrcSongs_B_fkey" FOREIGN KEY ("B") REFERENCES "IsrcSongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistTolpm" ADD CONSTRAINT "_ArtistTolpm_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistTolpm" ADD CONSTRAINT "_ArtistTolpm_B_fkey" FOREIGN KEY ("B") REFERENCES "lpm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistTotuStreams" ADD CONSTRAINT "_ArtistTotuStreams_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistTotuStreams" ADD CONSTRAINT "_ArtistTotuStreams_B_fkey" FOREIGN KEY ("B") REFERENCES "tuStreams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_lpmTolpmProductDisplayArtists" ADD CONSTRAINT "_lpmTolpmProductDisplayArtists_A_fkey" FOREIGN KEY ("A") REFERENCES "lpm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_lpmTolpmProductDisplayArtists" ADD CONSTRAINT "_lpmTolpmProductDisplayArtists_B_fkey" FOREIGN KEY ("B") REFERENCES "lpmProductDisplayArtists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DistributionStatementToDistributionStatementMusicPlatforms" ADD CONSTRAINT "_DistributionStatementToDistributionStatementMusicPlatfo_A_fkey" FOREIGN KEY ("A") REFERENCES "DistributionStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DistributionStatementToDistributionStatementMusicPlatforms" ADD CONSTRAINT "_DistributionStatementToDistributionStatementMusicPlatfo_B_fkey" FOREIGN KEY ("B") REFERENCES "DistributionStatementMusicPlatforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DistributionStatementToDistributionStatementTerritories" ADD CONSTRAINT "_DistributionStatementToDistributionStatementTerritories_A_fkey" FOREIGN KEY ("A") REFERENCES "DistributionStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DistributionStatementToDistributionStatementTerritories" ADD CONSTRAINT "_DistributionStatementToDistributionStatementTerritories_B_fkey" FOREIGN KEY ("B") REFERENCES "DistributionStatementTerritories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReleasesToreleasesArtists" ADD CONSTRAINT "_ReleasesToreleasesArtists_A_fkey" FOREIGN KEY ("A") REFERENCES "Releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReleasesToreleasesArtists" ADD CONSTRAINT "_ReleasesToreleasesArtists_B_fkey" FOREIGN KEY ("B") REFERENCES "releasesArtists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IsrcArtistsToIsrcSongs" ADD CONSTRAINT "_IsrcArtistsToIsrcSongs_A_fkey" FOREIGN KEY ("A") REFERENCES "IsrcArtists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IsrcArtistsToIsrcSongs" ADD CONSTRAINT "_IsrcArtistsToIsrcSongs_B_fkey" FOREIGN KEY ("B") REFERENCES "IsrcSongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_tuStreamsTotuStreamsArtists" ADD CONSTRAINT "_tuStreamsTotuStreamsArtists_A_fkey" FOREIGN KEY ("A") REFERENCES "tuStreams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_tuStreamsTotuStreamsArtists" ADD CONSTRAINT "_tuStreamsTotuStreamsArtists_B_fkey" FOREIGN KEY ("B") REFERENCES "tuStreamsArtists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
