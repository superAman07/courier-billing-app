-- AlterTable
ALTER TABLE "public"."BookingMaster" ALTER COLUMN "bookingDate" SET DATA TYPE DATE,
ALTER COLUMN "statusDate" SET DATA TYPE DATE,
ALTER COLUMN "dateOfDelivery" SET DATA TYPE DATE,
ALTER COLUMN "todayDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."CashBooking" ALTER COLUMN "bookingDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."CreditClientBooking" ALTER COLUMN "bookingDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."CustomerMaster" ALTER COLUMN "dateOfBirth" SET DATA TYPE DATE,
ALTER COLUMN "contractDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."CustomerPayment" ALTER COLUMN "paymentDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."EmployeeMaster" ALTER COLUMN "dateOfBirth" SET DATA TYPE DATE,
ALTER COLUMN "dateOfJoining" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."InternationalCashBooking" ALTER COLUMN "bookingDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."InternationalCreditClientBooking" ALTER COLUMN "bookingDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."Invoice" ALTER COLUMN "invoiceDate" SET DATA TYPE DATE,
ALTER COLUMN "periodFrom" SET DATA TYPE DATE,
ALTER COLUMN "periodTo" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."InvoiceBooking" ALTER COLUMN "bookingDate" SET DATA TYPE DATE;
