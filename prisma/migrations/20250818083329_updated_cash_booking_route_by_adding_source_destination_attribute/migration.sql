/*
  Warnings:

  - Added the required column `sourceCity` to the `CashBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceState` to the `CashBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CashBooking" ADD COLUMN     "sourceCity" TEXT NOT NULL,
ADD COLUMN     "sourceState" TEXT NOT NULL;
