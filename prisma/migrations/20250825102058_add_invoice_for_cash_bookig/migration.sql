-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
