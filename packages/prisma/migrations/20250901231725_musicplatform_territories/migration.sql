-- DropForeignKey
ALTER TABLE "public"."MusicPlatforms" DROP CONSTRAINT "MusicPlatforms_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Territories" DROP CONSTRAINT "Territories_teamId_fkey";

-- AlterTable
ALTER TABLE "public"."MusicPlatforms" ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Territories" ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Territories" ADD CONSTRAINT "Territories_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MusicPlatforms" ADD CONSTRAINT "MusicPlatforms_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
