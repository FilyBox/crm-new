-- AlterTable
ALTER TABLE "public"."DistributionStatement" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."IsrcSongs" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Releases" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."lpm" ADD COLUMN     "Deleted At" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."tuStreams" ADD COLUMN     "deletedAt" TIMESTAMP(3);
