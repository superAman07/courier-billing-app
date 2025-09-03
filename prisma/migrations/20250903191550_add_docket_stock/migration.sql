-- CreateTable
CREATE TABLE "public"."DocketStock" (
    "id" TEXT NOT NULL,
    "awbNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNUSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocketStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocketStock_awbNo_key" ON "public"."DocketStock"("awbNo");
