import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getNextInvoiceNo(type: string) {
  const settings = await prisma.invoiceSettings.findFirst();
  const prefix = settings?.invoicePrefix || "INV";
  const lastInvoice = await prisma.invoice.findFirst({
    where: { type },
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
    if (!["CashBooking", "InternationalCashBooking"].includes(type) || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // 1. Fetch bookings from correct table
    let bookings: any[] = [];
    if (type === "CashBooking") {
      bookings = await prisma.cashBooking.findMany({ where: { id: { in: bookingIds } } });
    } else if (type === "InternationalCashBooking") {
      bookings = await prisma.internationalCashBooking.findMany({ where: { id: { in: bookingIds } } });
    }

    if (bookings.length === 0) {
      return NextResponse.json({ message: "No bookings found" }, { status: 404 });
    }

    // 2. Prevent double invoicing
    const alreadyInvoicedIds = await prisma.invoiceBooking.findMany({
      where: { bookingId: { in: bookingIds } },
      select: { bookingId: true }
    });
    const alreadyInvoicedSet = new Set(alreadyInvoicedIds.map(b => b.bookingId));
    const toInvoice = bookings.filter(b => !alreadyInvoicedSet.has(b.id));
    if (toInvoice.length === 0) {
      return NextResponse.json({ message: "All selected bookings are already invoiced" }, { status: 400 });
    }

    // 3. Calculate totals and tax
    const totalAmount = toInvoice.reduce((sum, b) => sum + Number(b.amountCharged), 0);
    let totalTax = 0;
    let taxBreakdown: any[] = [];

    if (type === "CashBooking") {
      // Domestic: Calculate GST
      const taxes = await prisma.taxMaster.findMany({ where: { active: true } });
      // Assume all bookings are same state for cash booking (use first booking)
      const isWithinState = toInvoice.every(b => b.sourceState === b.state);
      const applicableTaxes = taxes.filter(t =>
        isWithinState ? t.withinState : t.forOtherState
      );
      taxBreakdown = applicableTaxes.map(tax => {
        const amount = totalAmount * Number(tax.ratePercent) / 100;
        totalTax += amount;
        return { taxCode: tax.taxCode, rate: Number(tax.ratePercent), amount };
      });
    } else {
      // International: No GST
      totalTax = 0;
      taxBreakdown = [{ taxCode: "EXPORT", rate: 0, amount: 0 }];
    }

    const netAmount = totalAmount + totalTax;
    const invoiceNo = await getNextInvoiceNo(type);

    // 4. Create invoice and invoice bookings
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type,
        invoiceDate: new Date(invoiceDate),
        totalAmount,
        totalTax,
        netAmount,
        // Optionally: store taxBreakdown as JSON if you want
        bookings: {
          create: toInvoice.map(b => ({
            bookingId: b.id,
            bookingType: type,
            consignmentNo: b.consignmentNo,
            bookingDate: b.bookingDate,
            senderName: b.senderName,
            receiverName: b.receiverName,
            city: type === "CashBooking" ? b.city : b.country,
            amountCharged: b.amountCharged,
            taxAmount: type === "CashBooking" ? totalTax : 0
          }))
        }
      },
      include: { bookings: true }
    });

    if (type === "CashBooking") {
      await prisma.cashBooking.updateMany({
        where: { id: { in: toInvoice.map(b => b.id) } },
        data: { status: "INVOICED" }
      });
    } else if (type === "InternationalCashBooking") {
      await prisma.internationalCashBooking.updateMany({
        where: { id: { in: toInvoice.map(b => b.id) } },
        data: { status: "INVOICED" }
      });
    }

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