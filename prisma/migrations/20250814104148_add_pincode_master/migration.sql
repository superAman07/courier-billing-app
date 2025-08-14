-- CreateTable
CREATE TABLE "public"."PincodeMaster" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PincodeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PincodeMaster_pincode_key" ON "public"."PincodeMaster"("pincode");

-- AddForeignKey
ALTER TABLE "public"."PincodeMaster" ADD CONSTRAINT "PincodeMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PincodeMaster" ADD CONSTRAINT "PincodeMaster_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
