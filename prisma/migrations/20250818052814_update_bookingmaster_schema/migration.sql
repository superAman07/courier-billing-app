-- CreateTable
CREATE TABLE "public"."BookingMaster" (
    "id" TEXT NOT NULL,
    "awbNo" TEXT NOT NULL,
    "customerRefNo" TEXT,
    "pickupRequestDate" TIMESTAMP(3),
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "bookingRo" TEXT,
    "bookingBranch" TEXT,
    "bookingCity" TEXT,
    "customerCode" TEXT,
    "consignee" TEXT,
    "destinationRo" TEXT,
    "destinationBranch" TEXT,
    "destinationCity" TEXT,
    "destinationPin" TEXT,
    "mode" TEXT,
    "pieces" INTEGER,
    "actualWeight" DOUBLE PRECISION,
    "chargeWeight" DOUBLE PRECISION,
    "invoiceValue" DOUBLE PRECISION,
    "status" TEXT,
    "statusDate" TIMESTAMP(3),
    "remarkDetails" TEXT,
    "currentRo" TEXT,
    "currentBranch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "destinationCityId" TEXT,

    CONSTRAINT "BookingMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingMaster_awbNo_key" ON "public"."BookingMaster"("awbNo");

-- AddForeignKey
ALTER TABLE "public"."BookingMaster" ADD CONSTRAINT "BookingMaster_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingMaster" ADD CONSTRAINT "BookingMaster_destinationCityId_fkey" FOREIGN KEY ("destinationCityId") REFERENCES "public"."CityMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
