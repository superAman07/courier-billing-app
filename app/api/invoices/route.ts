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
    const { bookingIds, customerId, invoiceDate: invoiceDateStr, customerType, companyId } = await req.json();

    if (
      !bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0 ||
      !invoiceDateStr || !customerType
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const invoiceDate = new Date(invoiceDateStr);
    const invoiceType = customerType === "CREDIT" ? "BookingMaster_CREDIT" : "BookingMaster_CASH";

    const bookings = await prisma.bookingMaster.findMany({
      where: { id: { in: bookingIds } },
    });

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json({ message: "Some selected bookings were not found." }, { status: 404 });
    }

    // 2. Calculate Totals & Prepare Items Array
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
        consignmentValue: b.invoiceValue,
        doxType: b.dsrNdxPaper === 'D' ? 'DOX' : 'NON-DOX',
        serviceType: b.mode,
      };
    });

    // Calculate dates
    const periodFrom = bookings.reduce((min: Date, b: BookingMaster) => b.bookingDate < min ? b.bookingDate : min, bookings[0].bookingDate);
    const periodTo = bookings.reduce((max: Date, b: BookingMaster) => b.bookingDate > max ? b.bookingDate : max, bookings[0].bookingDate);

    const createdInvoice = await runWithRetries(async () => {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        let gstPrefix = "AGS25-26/";
        let gstInfo = { start: 1355 };
        let nonGstPrefix = "ANGS26-";
        let nonGstInfo = { start: 1 };
        if (companyId) {
          const company = await tx.registrationDetails.findUnique({ where: { id: companyId } });
          if (company) {
            const name = company.companyName.trim().toLowerCase();
            if (name.includes("hvs")) {
              gstPrefix = "HVS 25-26/";
              gstInfo = { start: 124 };
              nonGstPrefix = "HNVS25-26-";
              nonGstInfo = { start: 1 };
            }
          }
        }
        let finalPrefix = nonGstPrefix;
        let startNumber = nonGstInfo.start;
        // if (customerType === 'CREDIT' && customerId) {
        if (customerId) {
          const customer = await tx.customerMaster.findUnique({
            where: { id: customerId },
            select: { gstNo: true }
          });

          if (customer?.gstNo && customer.gstNo.length > 2) {
            finalPrefix = gstPrefix;
            startNumber = gstInfo.start;
          }
        }

        const existingInvoices = await tx.invoice.findMany({
          where: {
            invoiceNo: {
              startsWith: finalPrefix
            }
          },
          select: { invoiceNo: true }
        });
        // 2. Extract numeric parts
        const existingNumbers = existingInvoices
          .map(inv => parseInvoiceNumericPart(inv.invoiceNo))
          .filter(n => !isNaN(n) && n > 0)
          .sort((a, b) => a - b);

        let nextNumber = startNumber;
        // 3. Find the first gap
        // We look for a number `i` starting from `startNumber`. 
        // If `i` is not in our sorted array, that's our gap.
        // Optimization: We can just walk the array.

        if (existingNumbers.length > 0) {
          // Find gap
          // existingNumbers is sorted e.g. [124, 125, 127] (126 is missing)

          // First, filter out any numbers smaller than our startNumber (just in case DB has old garbage)
          const standardNumbers = existingNumbers.filter(n => n >= startNumber);

          // Check if startNumber itself is taken
          if (standardNumbers.length === 0) {
            nextNumber = startNumber;
          } else {
            // Check sequentially
            let current = startNumber;
            let foundGap = false;

            for (const num of standardNumbers) {
              if (num === current) {
                current++;
              } else if (num > current) {
                // We found a gap! `current` is missing.
                foundGap = true;
                nextNumber = current;
                break;
              }
            }

            // If no gap found in the middle, use the next number after the max
            if (!foundGap) {
              nextNumber = current;
            }
          }
        }
        // --- C. Format the new Invoice Number ---
        // For AGS/HVS formats (e.g. 1355) we don't necessarily pad with zeros based on your example "1355" vs "001355".
        // Using `String(nextNumber)` preserves it as "1355". If you need "01355", uses .padStart().
        // Based on user request "AGS25-26/1355", it seems no padding or minimal padding is fine. 
        // I will just append the number as is to match your example.

        const invoiceNo = `${finalPrefix}${nextNumber}`;
        // --- D. Create Invoice ---
        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            type: invoiceType,
            invoiceDate,
            totalAmount: grandTotal - totalTax,
            totalTax: totalTax,
            netAmount: grandTotal,
            customerId,
            periodFrom,
            periodTo,
            bookings: {
              create: invoiceBookings,
            },
          },
          include: { bookings: true }
        });
        // Update booking status
        await tx.bookingMaster.updateMany({
          where: { id: { in: bookingIds } },
          data: { status: "INVOICED", statusDate: new Date() }
        });
        return invoice;
      }, { timeout: 20000 });
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