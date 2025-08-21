-- AlterTable
ALTER TABLE "public"."CashBooking" ADD COLUMN     "status" TEXT,
ADD COLUMN     "statusDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."CreditClientBooking" ADD COLUMN     "status" TEXT,
ADD COLUMN     "statusDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."InternationalCashBooking" ADD COLUMN     "status" TEXT,
ADD COLUMN     "statusDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."InternationalCreditClientBooking" ADD COLUMN     "status" TEXT,
ADD COLUMN     "statusDate" TIMESTAMP(3);
