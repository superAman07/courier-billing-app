-- CreateTable
CREATE TABLE "public"."DeliveryStatus" (
    "id" TEXT NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT,
    "destination" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "deliveryStatus" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryStatus_consignmentNo_idx" ON "public"."DeliveryStatus"("consignmentNo");

-- CreateIndex
CREATE INDEX "DeliveryStatus_bookingId_idx" ON "public"."DeliveryStatus"("bookingId");

-- CreateIndex
CREATE INDEX "DeliveryStatus_customerId_idx" ON "public"."DeliveryStatus"("customerId");

-- AddForeignKey
ALTER TABLE "public"."DeliveryStatus" ADD CONSTRAINT "DeliveryStatus_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."BookingMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryStatus" ADD CONSTRAINT "DeliveryStatus_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
