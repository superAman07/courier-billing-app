/*
  Warnings:

  - You are about to drop the column `bookingBranch` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `bookingCity` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `bookingRo` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `consignee` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `currentBranch` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `currentRo` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `customerCode` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `customerRefNo` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `destinationBranch` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `destinationCityId` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `destinationPin` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `destinationRo` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `pickupRequestDate` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `pieces` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `remarkDetails` on the `BookingMaster` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `BookingMaster` table. All the data in the column will be lost.
  - Added the required column `pcs` to the `BookingMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pin` to the `BookingMaster` table without a default value. This is not possible if the table is not empty.
  - Made the column `destinationCity` on table `BookingMaster` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mode` on table `BookingMaster` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."BookingMaster" DROP CONSTRAINT "BookingMaster_destinationCityId_fkey";

-- AlterTable
ALTER TABLE "public"."BookingMaster" DROP COLUMN "bookingBranch",
DROP COLUMN "bookingCity",
DROP COLUMN "bookingRo",
DROP COLUMN "consignee",
DROP COLUMN "currentBranch",
DROP COLUMN "currentRo",
DROP COLUMN "customerCode",
DROP COLUMN "customerRefNo",
DROP COLUMN "destinationBranch",
DROP COLUMN "destinationCityId",
DROP COLUMN "destinationPin",
DROP COLUMN "destinationRo",
DROP COLUMN "pickupRequestDate",
DROP COLUMN "pieces",
DROP COLUMN "remarkDetails",
DROP COLUMN "updatedAt",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "adhaarNo" TEXT,
ADD COLUMN     "childCustomer" TEXT,
ADD COLUMN     "clientBillingValue" DOUBLE PRECISION,
ADD COLUMN     "complainNo" TEXT,
ADD COLUMN     "countryName" TEXT,
ADD COLUMN     "creditCustomerAmount" DOUBLE PRECISION,
ADD COLUMN     "customerAttendBy" TEXT,
ADD COLUMN     "domesticInternational" TEXT,
ADD COLUMN     "dsrContents" TEXT,
ADD COLUMN     "dsrNdxPaper" TEXT,
ADD COLUMN     "internationalMode" TEXT,
ADD COLUMN     "invoiceWt" DOUBLE PRECISION,
ADD COLUMN     "parentCustomer" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "pcs" INTEGER NOT NULL,
ADD COLUMN     "pendingDaysNotDelivered" INTEGER,
ADD COLUMN     "pin" TEXT NOT NULL,
ADD COLUMN     "podStatus" TEXT,
ADD COLUMN     "receiverContactNo" TEXT,
ADD COLUMN     "receiverName" TEXT,
ADD COLUMN     "regularCustomerAmount" DOUBLE PRECISION,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "senderContactNo" TEXT,
ADD COLUMN     "shipmentCostOtherMode" DOUBLE PRECISION,
ADD COLUMN     "srNo" INTEGER,
ALTER COLUMN "destinationCity" SET NOT NULL,
ALTER COLUMN "mode" SET NOT NULL;
