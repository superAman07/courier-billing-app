-- CreateTable
CREATE TABLE "public"."SmsApiSettings" (
    "id" TEXT NOT NULL,
    "apiPart1" TEXT NOT NULL,
    "apiPart2" TEXT NOT NULL,
    "apiPart3" TEXT,
    "companyName" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsApiSettings_pkey" PRIMARY KEY ("id")
);
