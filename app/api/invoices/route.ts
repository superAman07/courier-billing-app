import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BookingMaster, Prisma } from "@prisma/client";

function parseInvoiceNumericPart(invoiceNo: string | undefined) {
  if (!invoiceNo) return 0;
  const m = invoiceNo.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function runWithRetries<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const code = err?.code;
      const retryable =
        code === "P2002" ||
        code === "40001" ||
        /deadlock|serialization/i.test(err?.message || "");

      if (!retryable || attempt === retries) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, 50 * attempt));
    }
  }
  throw new Error("Failed after retries");
}

export async function POST(req: NextRequest) {
  try {
    const { bookingIds, customerId, invoiceDate: invoiceDateStr, customerType } = await req.json();

    if (
      !bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0 ||
      !invoiceDateStr || !customerType
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const invoiceDate = new Date(invoiceDateStr);
    const invoiceType = customerType === "CREDIT" ? "BookingMaster_CREDIT" : "BookingMaster_CASH";

    const createdInvoice = await runWithRetries(async () => {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        let prefix = 'ANGS-';
        if (customerType === 'CREDIT' && customerId) {
          const customer = await tx.customerMaster.findUnique({
            where: { id: customerId },
            select: { gstNo: true }
          });
          if (customer?.gstNo) {
            prefix = 'AGS-';
          }
        }

        const lastInvoice = await tx.invoice.findFirst({
          where: { type: invoiceType },
          orderBy: { createdAt: "desc" },
          select: { invoiceNo: true }
        });
        const maxExistingNumber = parseInvoiceNumericPart(lastInvoice?.invoiceNo) || 0;

        const counter = await tx.invoiceCounter.upsert({
          where: { type: invoiceType },
          create: { type: invoiceType, lastNumber: maxExistingNumber + 1 },
          update: { lastNumber: { increment: 1 } }
        });

        const nextNumber = counter.lastNumber;
        const invoiceNo = `${prefix}${String(nextNumber).padStart(5, "0")}`;

        const bookings = await tx.bookingMaster.findMany({
          where: { id: { in: bookingIds } },
        });

        if (bookings.length !== bookingIds.length) {
          throw new Error("Some bookings were not found");
        }

        let grandTotal = 0;
        let totalTax = 0;

        const invoiceBookings = bookings.map((b: BookingMaster) => {
          const clientBillingValue = Number(b.clientBillingValue || 0);
          const creditAmount = Number(b.creditCustomerAmount || 0);
          const regularAmount = Number(b.regularCustomerAmount || 0);

          const finalBookingAmount = clientBillingValue + creditAmount + regularAmount;
          const taxAmount = Number(b.gst || 0);

          grandTotal += finalBookingAmount;
          totalTax += taxAmount;

          return {
            bookingId: b.id,
            bookingType: "BookingMaster",
            consignmentNo: b.awbNo,
            bookingDate: b.bookingDate,
            senderName: b.senderDetail || '',
            receiverName: b.receiverName || '',
            city: b.destinationCity,
            amountCharged: finalBookingAmount,
            taxAmount: taxAmount,
            weight: b.invoiceWt,
            numPcs: b.pcs,
            frCharge: b.frCharge,
            shipperCost: b.shipperCost,
            waybillSurcharge: b.waybillSurcharge,
            otherExp: b.otherExp,
            fuelSurcharge: b.fuelSurcharge,
            gst: b.gst,
            consignmentValue: b.invoiceValue, // Maps Material Value
            doxType: b.dsrNdxPaper === 'D' ? 'DOX' : 'NON-DOX', // Maps Dox/Non-Dox
            serviceType: b.mode,
          };
        });

        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            type: invoiceType,
            invoiceDate,
            totalAmount: grandTotal - totalTax,
            totalTax: totalTax,
            netAmount: grandTotal,
            customerId,
            periodFrom: bookings.reduce((min: Date, b: BookingMaster) => b.bookingDate < min ? b.bookingDate : min, bookings[0].bookingDate),
            periodTo: bookings.reduce((max: Date, b: BookingMaster) => b.bookingDate > max ? b.bookingDate : max, bookings[0].bookingDate),
            bookings: {
              create: invoiceBookings,
            },
          },
          include: { bookings: true }
        });

        await tx.bookingMaster.updateMany({
          where: { id: { in: bookingIds } },
          data: { status: "INVOICED", statusDate: new Date() }
        });

        return invoice;
      }, { timeout: 15000 });
    });

    return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error: any) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { message: `Error generating invoice: ${error.message || "unknown"}` },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || undefined;
    const customerId = url.searchParams.get("customerId") || undefined;
    const pageParam = url.searchParams.get("page") || "1";
    const limitParam = url.searchParams.get("limit") || "50";

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(limitParam, 10) || 50));
    const skip = (page - 1) * limit;
    const invoiceNo = url.searchParams.get("invoiceNo") || undefined;

    const where: any = {};

    if (type) {
      if (type === "Domestic" || type === "BookingMaster_CREDIT") {
        where.type = "BookingMaster_CREDIT";
      } else if (type === "International" || type === "InternationalCreditClientBooking") {
        where.type = "BookingMaster_CREDIT";
      } else {
        where.type = type;
      }
    }

    if (customerId) where.customerId = customerId;
    if (invoiceNo) where.invoiceNo = { contains: invoiceNo, mode: "insensitive" };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { invoiceDate: "desc" },
        include: {
          bookings: true,
          customer: true,
        },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      meta: { total, page, limit },
      data: invoices,
    });
  } catch (error: any) {
    console.error("Get invoices error:", error);
    return NextResponse.json({ message: "Error fetching invoices" }, { status: 500 });
  }
}