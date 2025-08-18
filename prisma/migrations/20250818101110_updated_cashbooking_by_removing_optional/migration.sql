/*
  Warnings:

  - Made the column `sourceCity` on table `CashBooking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sourceState` on table `CashBooking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sourcePincode` on table `CashBooking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."CashBooking" ALTER COLUMN "sourceCity" SET NOT NULL,
ALTER COLUMN "sourceState" SET NOT NULL,
ALTER COLUMN "sourcePincode" SET NOT NULL;
