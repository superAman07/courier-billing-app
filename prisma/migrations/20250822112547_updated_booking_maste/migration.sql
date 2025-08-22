/*
  Warnings:

  - Made the column `createdAt` on table `BookingMaster` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."BookingMaster" ALTER COLUMN "createdAt" SET NOT NULL;
