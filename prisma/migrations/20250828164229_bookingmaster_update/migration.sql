/*
  Warnings:

  - You are about to drop the column `childCustomer` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `complainNo` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `countryName` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `domesticInternational` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `internationalMode` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `parentCustomer` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `podStatus` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `shipmentCostOtherMode` on the `BookingMaster` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `BookingMaster` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."BookingMaster" DROP COLUMN "childCustomer",
DROP COLUMN "complainNo",
DROP COLUMN "countryName",
DROP COLUMN "domesticInternational",
DROP COLUMN "internationalMode",
DROP COLUMN "parentCustomer",
DROP COLUMN "podStatus",
DROP COLUMN "remarks",
DROP COLUMN "shipmentCostOtherMode",
ADD COLUMN     "customerType" TEXT,
ADD COLUMN     "dateOfDelivery" TIMESTAMP(3),
ADD COLUMN     "delivered" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "ref" TEXT,
ADD COLUMN     "senderDetail" TEXT,
ADD COLUMN     "todayDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valumetric" DOUBLE PRECISION;
