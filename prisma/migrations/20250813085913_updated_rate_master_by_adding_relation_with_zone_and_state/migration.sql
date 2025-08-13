/*
  Warnings:

  - You are about to drop the column `state` on the `RateMaster` table. All the data in the column will be lost.
  - You are about to drop the column `zone` on the `RateMaster` table. All the data in the column will be lost.
  - Added the required column `stateId` to the `RateMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zoneId` to the `RateMaster` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."RateMaster" DROP COLUMN "state",
DROP COLUMN "zone",
ADD COLUMN     "stateId" TEXT NOT NULL,
ADD COLUMN     "zoneId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."StateMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StateMaster_code_key" ON "public"."StateMaster"("code");

-- AddForeignKey
ALTER TABLE "public"."RateMaster" ADD CONSTRAINT "RateMaster_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."ZoneMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateMaster" ADD CONSTRAINT "RateMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StateMaster" ADD CONSTRAINT "StateMaster_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."ZoneMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
