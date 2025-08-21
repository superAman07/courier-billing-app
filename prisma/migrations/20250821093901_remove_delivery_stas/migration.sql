/*
  Warnings:

  - You are about to drop the `DeliveryStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DeliveryStatus" DROP CONSTRAINT "DeliveryStatus_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeliveryStatus" DROP CONSTRAINT "DeliveryStatus_customerId_fkey";

-- DropTable
DROP TABLE "public"."DeliveryStatus";
