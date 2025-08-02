-- CreateTable
CREATE TABLE "RateMaster" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "consignmentType" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "fromWeight" DOUBLE PRECISION NOT NULL,
    "toWeight" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "hasAdditionalRate" BOOLEAN NOT NULL DEFAULT false,
    "additionalWeight" DOUBLE PRECISION,
    "additionalRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "RateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateMaster_customerId_idx" ON "RateMaster"("customerId");

-- AddForeignKey
ALTER TABLE "RateMaster" ADD CONSTRAINT "RateMaster_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
