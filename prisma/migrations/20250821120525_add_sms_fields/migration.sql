-- AlterTable
ALTER TABLE "public"."CashBooking" ADD COLUMN     "smsDate" TIMESTAMP(3),
ADD COLUMN     "smsSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."CreditClientBooking" ADD COLUMN     "smsDate" TIMESTAMP(3),
ADD COLUMN     "smsSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."InternationalCashBooking" ADD COLUMN     "smsDate" TIMESTAMP(3),
ADD COLUMN     "smsSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."InternationalCreditClientBooking" ADD COLUMN     "smsDate" TIMESTAMP(3),
ADD COLUMN     "smsSent" BOOLEAN NOT NULL DEFAULT false;
