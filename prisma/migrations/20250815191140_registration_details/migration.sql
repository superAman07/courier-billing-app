-- CreateTable
CREATE TABLE "public"."RegistrationDetails" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "pincodeId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "panNo" TEXT,
    "gstNo" TEXT,
    "serviceTaxNo" TEXT,
    "hsnSacCode" TEXT,
    "stateCode" TEXT,
    "associateWith" TEXT,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "ifscCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."RegistrationDetails" ADD CONSTRAINT "RegistrationDetails_pincodeId_fkey" FOREIGN KEY ("pincodeId") REFERENCES "public"."PincodeMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
