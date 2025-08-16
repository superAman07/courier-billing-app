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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeMaster_employeeCode_key" ON "public"."EmployeeMaster"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeMaster_email_key" ON "public"."EmployeeMaster"("email");
