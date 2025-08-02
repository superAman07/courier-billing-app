/*
  Warnings:

  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Customer";

-- CreateTable
CREATE TABLE "CustomerMaster" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "city" TEXT,
    "mobile" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "ownership" TEXT,
    "contractNo" TEXT,
    "contractDate" TIMESTAMP(3),
    "panNo" TEXT,
    "gstNo" TEXT,
    "fuelSurchargePercent" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "openingBalance" DOUBLE PRECISION,
    "balanceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMaster_customerCode_key" ON "CustomerMaster"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMaster_email_key" ON "CustomerMaster"("email");
