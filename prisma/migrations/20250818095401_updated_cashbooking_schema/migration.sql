-- AlterTable
ALTER TABLE "public"."CashBooking" ADD COLUMN     "sourcePincode" TEXT,
ALTER COLUMN "sourceCity" DROP NOT NULL,
ALTER COLUMN "sourceState" DROP NOT NULL;
