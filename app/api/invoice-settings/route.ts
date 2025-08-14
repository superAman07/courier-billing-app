import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.invoiceSettings.findFirst();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const settings = await prisma.invoiceSettings.upsert({
    where: { id: body.id ?? "singleton" },
    update: {
      invoiceNoType: body.invoiceNoType,
      invoicePrefix: body.invoicePrefix,
      printWithMode: body.printWithMode,
      handbillInvoice: body.handbillInvoice,
    },
    create: {
      invoiceNoType: body.invoiceNoType,
      invoicePrefix: body.invoicePrefix,
      printWithMode: body.printWithMode,
      handbillInvoice: body.handbillInvoice,
    },
  });
  return NextResponse.json(settings);
}