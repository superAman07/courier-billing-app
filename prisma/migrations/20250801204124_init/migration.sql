-- CreateTable
CREATE TABLE "Customer" (
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

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
