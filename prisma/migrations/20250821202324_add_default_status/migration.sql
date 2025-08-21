-- AlterTable
ALTER TABLE "public"."CashBooking" ALTER COLUMN "status" SET DEFAULT 'BOOKED',
ALTER COLUMN "statusDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."CreditClientBooking" ALTER COLUMN "status" SET DEFAULT 'BOOKED',
ALTER COLUMN "statusDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."InternationalCashBooking" ALTER COLUMN "status" SET DEFAULT 'BOOKED',
ALTER COLUMN "statusDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."InternationalCreditClientBooking" ALTER COLUMN "status" SET DEFAULT 'BOOKED',
ALTER COLUMN "statusDate" SET DEFAULT CURRENT_TIMESTAMP;
