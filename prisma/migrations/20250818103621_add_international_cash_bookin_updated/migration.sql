/*
  Warnings:

  - Added the required column `sourceCity` to the `InternationalCashBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourcePincode` to the `InternationalCashBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceState` to the `InternationalCashBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."InternationalCashBooking" ADD COLUMN     "sourceCity" TEXT NOT NULL,
ADD COLUMN     "sourcePincode" TEXT NOT NULL,
ADD COLUMN     "sourceState" TEXT NOT NULL;
