-- CreateTable
CREATE TABLE "public"."Consignee" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "gstNo" TEXT,
    "landmark" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consignee_customerId_idx" ON "public"."Consignee"("customerId");

-- AddForeignKey
ALTER TABLE "public"."Consignee" ADD CONSTRAINT "Consignee_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
