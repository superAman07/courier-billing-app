/*
  Warnings:

  - You are about to drop the column `clientPaymentReceived` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `depositInBank` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `digitalSaleAmount` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `officeAdvance` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `others` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `physicalMatch` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `saleAmount` on the `DailyLedger` table. All the data in the column will be lost.
  - You are about to drop the column `tsDeposit` on the `DailyLedger` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailyLedger" DROP COLUMN "clientPaymentReceived",
DROP COLUMN "depositInBank",
DROP COLUMN "digitalSaleAmount",
DROP COLUMN "officeAdvance",
DROP COLUMN "others",
DROP COLUMN "physicalMatch",
DROP COLUMN "saleAmount",
DROP COLUMN "tsDeposit",
ADD COLUMN     "bankDeposit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "cashSale" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "clientPayment" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "codReceived" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "digitalSale" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sale" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "salePending" DOUBLE PRECISION DEFAULT 0;
