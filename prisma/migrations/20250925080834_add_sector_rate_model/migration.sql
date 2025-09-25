-- CreateTable
CREATE TABLE "public"."SectorRate" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "bulkMinWeightSurface" DOUBLE PRECISION,
    "bulkMinWeightAir" DOUBLE PRECISION,
    "bulkRateSurfaceUpto20" DOUBLE PRECISION,
    "bulkRateSurfaceAbove20" DOUBLE PRECISION,
    "bulkRateAirUpto20" DOUBLE PRECISION,
    "bulkRateAirAbove20" DOUBLE PRECISION,
    "doxUpto100g" DOUBLE PRECISION,
    "doxUpto250g" DOUBLE PRECISION,
    "doxAdd250g" DOUBLE PRECISION,
    "doxUpto500g" DOUBLE PRECISION,
    "doxAdd500g" DOUBLE PRECISION,
    "premiumUpto250g" DOUBLE PRECISION,
    "premiumAdd250g" DOUBLE PRECISION,
    "premiumUpto500g" DOUBLE PRECISION,
    "premiumAdd500g" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectorRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SectorRate_customerId_sectorName_key" ON "public"."SectorRate"("customerId", "sectorName");

-- AddForeignKey
ALTER TABLE "public"."SectorRate" ADD CONSTRAINT "SectorRate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
