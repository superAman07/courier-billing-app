-- CreateTable
CREATE TABLE "public"."BookRateMaster" (
    "id" TEXT NOT NULL,
    "bookSeries" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookRateMaster_pkey" PRIMARY KEY ("id")
);
