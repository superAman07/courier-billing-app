-- CreateTable
CREATE TABLE "public"."DailyLedger" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "particulars" TEXT NOT NULL,
    "saleAmount" DOUBLE PRECISION DEFAULT 0,
    "clientPaymentReceived" DOUBLE PRECISION DEFAULT 0,
    "digitalSaleAmount" DOUBLE PRECISION DEFAULT 0,
    "expenseAmount" DOUBLE PRECISION DEFAULT 0,
    "employeeAdvance" DOUBLE PRECISION DEFAULT 0,
    "expenseByDigital" DOUBLE PRECISION DEFAULT 0,
    "officeAdvance" DOUBLE PRECISION DEFAULT 0,
    "depositInBank" DOUBLE PRECISION DEFAULT 0,
    "tsDeposit" DOUBLE PRECISION DEFAULT 0,
    "physicalMatch" BOOLEAN DEFAULT false,
    "others" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLedger_pkey" PRIMARY KEY ("id")
);
