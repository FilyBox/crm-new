-- CreateEnum
CREATE TYPE "public"."event_colors" AS ENUM ('blue', 'orange', 'violet', 'rose', 'emerald');

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "color" "public"."event_colors";
