-- CreateTable
CREATE TABLE "public"."SmsTemplate" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsTemplate_templateName_key" ON "public"."SmsTemplate"("templateName");
