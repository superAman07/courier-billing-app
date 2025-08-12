-- CreateTable
CREATE TABLE "TaxMaster" (
    "id" TEXT NOT NULL,
    "taxCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ratePercent" DECIMAL(5,3) NOT NULL,
    "withinState" BOOLEAN NOT NULL DEFAULT false,
    "forOtherState" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxMaster_taxCode_key" ON "TaxMaster"("taxCode");
