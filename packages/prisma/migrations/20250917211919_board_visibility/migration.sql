-- AlterTable
ALTER TABLE "public"."Board" ADD COLUMN     "visibility" "public"."DocumentVisibility" NOT NULL DEFAULT 'EVERYONE';
