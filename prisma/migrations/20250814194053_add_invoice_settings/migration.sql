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
