/*
  Warnings:

  - You are about to drop the column `pincodeId` on the `RegistrationDetails` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RegistrationDetails" DROP CONSTRAINT "RegistrationDetails_pincodeId_fkey";

-- AlterTable
ALTER TABLE "public"."RegistrationDetails" DROP COLUMN "pincodeId";
