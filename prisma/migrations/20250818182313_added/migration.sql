-- CreateTable
CREATE TABLE "public"."CreditClientBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierAmount" DOUBLE PRECISION NOT NULL,
    "vasAmount" DOUBLE PRECISION,
    "chargeAmount" DOUBLE PRECISION NOT NULL,
    "consigneeName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditClientBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditClientBooking_consignmentNo_key" ON "public"."CreditClientBooking"("consignmentNo");

-- AddForeignKey
ALTER TABLE "public"."CreditClientBooking" ADD CONSTRAINT "CreditClientBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
