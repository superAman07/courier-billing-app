-- CreateTable
CREATE TABLE "public"."CityMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityMaster_code_key" ON "public"."CityMaster"("code");

-- AddForeignKey
ALTER TABLE "public"."CityMaster" ADD CONSTRAINT "CityMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
