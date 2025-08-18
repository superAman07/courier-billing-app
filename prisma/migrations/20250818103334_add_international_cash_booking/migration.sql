-- CreateTable
CREATE TABLE "public"."InternationalCashBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderMobile" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverMobile" TEXT NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierCharged" DOUBLE PRECISION NOT NULL,
    "contents" TEXT,
    "value" DOUBLE PRECISION,
    "vasAmount" DOUBLE PRECISION,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternationalCashBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternationalCashBooking_consignmentNo_key" ON "public"."InternationalCashBooking"("consignmentNo");
