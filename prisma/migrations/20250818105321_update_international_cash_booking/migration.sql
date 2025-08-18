/*
  Warnings:

  - You are about to drop the column `sourceCity` on the `InternationalCashBooking` table. All the data in the column will be lost.
  - You are about to drop the column `sourcePincode` on the `InternationalCashBooking` table. All the data in the column will be lost.
  - You are about to drop the column `sourceState` on the `InternationalCashBooking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."InternationalCashBooking" DROP COLUMN "sourceCity",
DROP COLUMN "sourcePincode",
DROP COLUMN "sourceState";
