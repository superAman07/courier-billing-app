/*
  Warnings:

  - You are about to drop the `Consignee` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Consignee" DROP CONSTRAINT "Consignee_customerId_fkey";

-- DropTable
DROP TABLE "public"."Consignee";
