import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getNextInvoiceNo() {
  const settings = await prisma.invoiceSettings.findFirst();
  const prefix = settings?.invoicePrefix || "INV";
  const lastInvoice = await prisma.invoice.findFirst({
    where: { type: "CashBooking" },
    orderBy: { createdAt: "desc" }
  });
  let nextNo = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNo.match(/\d+$/);
    if (match) nextNo = parseInt(match[0]) + 1;
  }
  return `${prefix}${String(nextNo).padStart(5, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const { type, invoiceDate, bookingIds } = await req.json();
    if (type !== "CashBooking" || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const bookings = await prisma.cashBooking.findMany({
      where: { id: { in: bookingIds } }
    });

    if (bookings.length === 0) {
      return NextResponse.json({ message: "No bookings found" }, { status: 404 });
    }

    const alreadyInvoicedIds = await prisma.invoiceBooking.findMany({
      where: { bookingId: { in: bookingIds } },
      select: { bookingId: true }
    });
    const alreadyInvoicedSet = new Set(alreadyInvoicedIds.map(b => b.bookingId));
    const toInvoice = bookings.filter(b => !alreadyInvoicedSet.has(b.id));
    if (toInvoice.length === 0) {
      return NextResponse.json({ message: "All selected bookings are already invoiced" }, { status: 400 });
    }

    const totalAmount = bookings.reduce((sum, b) => sum + Number(b.amountCharged), 0);
    const totalTax = 0;
    const netAmount = totalAmount + totalTax;

    const invoiceNo = await getNextInvoiceNo();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type,
        invoiceDate: new Date(invoiceDate),
        totalAmount,
        totalTax,
        netAmount,
        bookings: {
          create: bookings.map(b => ({
            bookingId: b.id,
            bookingType: "CashBooking",
            consignmentNo: b.consignmentNo,
            bookingDate: b.bookingDate,
            senderName: b.senderName,
            receiverName: b.receiverName,
            city: b.city,
            amountCharged: b.amountCharged,
            taxAmount: 0
          }))
        }
      },
      include: { bookings: true }
    });

    await prisma.cashBooking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: "INVOICED" }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error generating invoice" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || undefined;
  const customerId = url.searchParams.get("customerId") || undefined;

  const where: any = {};
  if (type) where.type = type;
  if (customerId) where.customerId = customerId;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    include: { bookings: true, customer: true },
  });

  return NextResponse.json(invoices);
}