-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "public"."CustomerMaster" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "city" TEXT,
    "mobile" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "ownership" TEXT,
    "contractNo" TEXT,
    "contractDate" TIMESTAMP(3),
    "panNo" TEXT,
    "gstNo" TEXT,
    "fuelSurchargePercent" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "openingBalance" DOUBLE PRECISION,
    "balanceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateMaster" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "consignmentType" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "fromWeight" DOUBLE PRECISION NOT NULL,
    "toWeight" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "hasAdditionalRate" BOOLEAN NOT NULL DEFAULT false,
    "additionalWeight" DOUBLE PRECISION,
    "additionalRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "RateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaxMaster" (
    "id" TEXT NOT NULL,
    "taxCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ratePercent" DECIMAL(5,3) NOT NULL,
    "withinState" BOOLEAN NOT NULL DEFAULT false,
    "forOtherState" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CountryMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ZoneMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StateMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateMaster_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."InvoiceSettings" (
    "id" TEXT NOT NULL,
    "invoiceNoType" TEXT NOT NULL,
    "invoicePrefix" TEXT,
    "printWithMode" BOOLEAN NOT NULL DEFAULT false,
    "handbillInvoice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegistrationDetails" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "panNo" TEXT,
    "gstNo" TEXT,
    "serviceTaxNo" TEXT,
    "hsnSacCode" TEXT,
    "stateCode" TEXT,
    "associateWith" TEXT,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "ifscCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookRateMaster" (
    "id" TEXT NOT NULL,
    "bookSeries" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookRateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeMaster" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "address" TEXT,
    "pincode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "sex" TEXT,
    "email" TEXT,
    "maritalStatus" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfJoining" TIMESTAMP(3),
    "photoUrl" TEXT,
    "shiftStartTime" TEXT,
    "shiftEndTime" TEXT,
    "workingHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeAttendance" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "totalHours" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION,
    "lateByMinutes" INTEGER,
    "fineAmount" DOUBLE PRECISION,
    "advanceAmount" DOUBLE PRECISION,
    "remarks" TEXT,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userType" "public"."UserType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."SmsTemplate" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingMaster" (
    "id" TEXT NOT NULL,
    "srNo" INTEGER,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "awbNo" TEXT NOT NULL,
    "location" TEXT,
    "destinationCity" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "pcs" INTEGER NOT NULL,
    "pin" TEXT NOT NULL,
    "dsrContents" TEXT,
    "dsrNdxPaper" TEXT,
    "invoiceValue" DOUBLE PRECISION,
    "actualWeight" DOUBLE PRECISION,
    "chargeWeight" DOUBLE PRECISION,
    "fuelSurcharge" DOUBLE PRECISION,
    "shipperCost" DOUBLE PRECISION,
    "otherExp" DOUBLE PRECISION,
    "gst" DOUBLE PRECISION,
    "valumetric" DOUBLE PRECISION,
    "invoiceWt" DOUBLE PRECISION,
    "clientBillingValue" DOUBLE PRECISION,
    "creditCustomerAmount" DOUBLE PRECISION,
    "regularCustomerAmount" DOUBLE PRECISION,
    "customerType" TEXT,
    "senderDetail" TEXT,
    "paymentStatus" TEXT,
    "senderContactNo" TEXT,
    "address" TEXT,
    "adhaarNo" TEXT,
    "customerAttendBy" TEXT,
    "status" TEXT,
    "statusDate" TIMESTAMP(3),
    "pendingDaysNotDelivered" INTEGER,
    "receiverName" TEXT,
    "receiverContactNo" TEXT,
    "ref" TEXT,
    "delivered" TEXT,
    "dateOfDelivery" TIMESTAMP(3),
    "todayDate" TIMESTAMP(3),
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderMobile" TEXT NOT NULL,
    "sourcePincode" TEXT NOT NULL,
    "sourceState" TEXT NOT NULL,
    "sourceCity" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverMobile" TEXT NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierCharged" DOUBLE PRECISION NOT NULL,
    "contents" TEXT,
    "value" DOUBLE PRECISION,
    "vsAmount" DOUBLE PRECISION,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'BOOKED',
    "statusDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InternationalCashBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderMobile" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverMobile" TEXT NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierCharged" DOUBLE PRECISION NOT NULL,
    "contents" TEXT,
    "value" DOUBLE PRECISION,
    "vasAmount" DOUBLE PRECISION,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'BOOKED',
    "statusDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternationalCashBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditClientBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierAmount" DOUBLE PRECISION NOT NULL,
    "vasAmount" DOUBLE PRECISION,
    "chargeAmount" DOUBLE PRECISION NOT NULL,
    "consigneeName" TEXT NOT NULL,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'BOOKED',
    "statusDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditClientBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InternationalCreditClientBooking" (
    "id" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courierAmount" DOUBLE PRECISION NOT NULL,
    "vasAmount" DOUBLE PRECISION,
    "chargeAmount" DOUBLE PRECISION NOT NULL,
    "consigneeName" TEXT NOT NULL,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'BOOKED',
    "statusDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternationalCreditClientBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalTax" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodFrom" TIMESTAMP(3),
    "periodTo" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceBooking" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingType" TEXT NOT NULL,
    "consignmentNo" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "senderName" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "consignmentValue" DOUBLE PRECISION,
    "doxType" TEXT,
    "numPcs" INTEGER,
    "serviceType" TEXT,
    "shipperCost" DOUBLE PRECISION,
    "waybillSurcharge" DOUBLE PRECISION,
    "otherExp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceCounter" (
    "type" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("type")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMaster_customerCode_key" ON "public"."CustomerMaster"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMaster_email_key" ON "public"."CustomerMaster"("email");

-- CreateIndex
CREATE INDEX "RateMaster_customerId_idx" ON "public"."RateMaster"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxMaster_taxCode_key" ON "public"."TaxMaster"("taxCode");

-- CreateIndex
CREATE UNIQUE INDEX "CountryMaster_code_key" ON "public"."CountryMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneMaster_code_key" ON "public"."ZoneMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StateMaster_code_key" ON "public"."StateMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CityMaster_code_key" ON "public"."CityMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PincodeMaster_pincode_key" ON "public"."PincodeMaster"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeMaster_employeeCode_key" ON "public"."EmployeeMaster"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeMaster_email_key" ON "public"."EmployeeMaster"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAttendance_employeeId_date_key" ON "public"."EmployeeAttendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_username_key" ON "public"."AppUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SmsTemplate_templateName_key" ON "public"."SmsTemplate"("templateName");

-- CreateIndex
CREATE UNIQUE INDEX "BookingMaster_awbNo_key" ON "public"."BookingMaster"("awbNo");

-- CreateIndex
CREATE UNIQUE INDEX "CashBooking_consignmentNo_key" ON "public"."CashBooking"("consignmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "InternationalCashBooking_consignmentNo_key" ON "public"."InternationalCashBooking"("consignmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "CreditClientBooking_consignmentNo_key" ON "public"."CreditClientBooking"("consignmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "InternationalCreditClientBooking_consignmentNo_key" ON "public"."InternationalCreditClientBooking"("consignmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "public"."Invoice"("invoiceNo");

-- AddForeignKey
ALTER TABLE "public"."RateMaster" ADD CONSTRAINT "RateMaster_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."ZoneMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateMaster" ADD CONSTRAINT "RateMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateMaster" ADD CONSTRAINT "RateMaster_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StateMaster" ADD CONSTRAINT "StateMaster_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."ZoneMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CityMaster" ADD CONSTRAINT "CityMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PincodeMaster" ADD CONSTRAINT "PincodeMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PincodeMaster" ADD CONSTRAINT "PincodeMaster_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeAttendance" ADD CONSTRAINT "EmployeeAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."EmployeeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingMaster" ADD CONSTRAINT "BookingMaster_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditClientBooking" ADD CONSTRAINT "CreditClientBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternationalCreditClientBooking" ADD CONSTRAINT "InternationalCreditClientBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceBooking" ADD CONSTRAINT "InvoiceBooking_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
