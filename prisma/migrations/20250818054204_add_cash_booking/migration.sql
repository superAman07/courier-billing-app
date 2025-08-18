-- CreateTable
CREATE TABLE "public"."CashBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderMobile" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverMobile" TEXT NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierCharged" DOUBLE PRECISION NOT NULL,
    "contents" TEXT,
    "value" DOUBLE PRECISION,
    "vsAmount" DOUBLE PRECISION,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashBooking_consignmentNo_key" ON "public"."CashBooking"("consignmentNo");
