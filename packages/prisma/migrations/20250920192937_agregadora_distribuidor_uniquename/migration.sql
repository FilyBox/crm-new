/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Agregadora` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Distrubidor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Agregadora_name_key" ON "public"."Agregadora"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Distrubidor_name_key" ON "public"."Distrubidor"("name");
