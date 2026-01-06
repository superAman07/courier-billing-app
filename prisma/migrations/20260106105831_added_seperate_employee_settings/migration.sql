/*
  Warnings:

  - You are about to drop the column `ratePerKm` on the `EmployeeMaster` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeMaster" DROP COLUMN "ratePerKm";

-- CreateTable
CREATE TABLE "EmployeeSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "ratePerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSettings_pkey" PRIMARY KEY ("id")
);
