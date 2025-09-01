import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    const body = await req.json();
    const { bookingIds, customerId, invoiceDate: invoiceDateStr, customerType } = body;
    if (
      !bookingIds ||
      !Array.isArray(bookingIds) ||
      bookingIds.length === 0 ||
      !customerId ||
      !invoiceDateStr ||
      !customerType
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const allowedCustomerTypes = ["CREDIT", "REGULAR", "WALK-IN"];
    if (!allowedCustomerTypes.includes(customerType)) {
      return NextResponse.json({ message: "Invalid customerType" }, { status: 400 });
    }

    const invoiceDate = new Date(invoiceDateStr);
    if (isNaN(invoiceDate.getTime())) {
      return NextResponse.json({ message: "Invalid invoiceDate" }, { status: 400 });
    }

    const invoiceType = customerType === "CREDIT" ?
      "BookingMaster_CREDIT" : "BookingMaster_CASH";

    const createdInvoice = await runWithRetries(async () => {
      return await prisma.$transaction(async (tx) => {
        const settings = await tx.invoiceSettings.findFirst();
        const prefix = settings?.invoicePrefix || "INV";

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
          where: {
            id: { in: bookingIds },
            customerId,
            customerType
          },
          include: { customer: true }
        });

        if (!bookings.length) throw new Error("No bookings found");

        const alreadyInvoiced = await tx.invoiceBooking.findMany({
          where: {
            bookingId: { in: bookingIds },
            bookingType: invoiceType
          },
          select: { bookingId: true }
        });
        const alreadyInvoicedSet = new Set(alreadyInvoiced.map((r) => r.bookingId));
        const toInvoice = bookings.filter((b) => !alreadyInvoicedSet.has(b.id));
        if (!toInvoice.length) throw new Error("All selected bookings are already invoiced");

        const getAmount = (b: any) =>
          customerType === "CREDIT"
            ? Number(b.clientBillingValue ?? 0)
            : Number(b.regularCustomerAmount ?? 0);

        const totalAmount = toInvoice.reduce((sum, b) => sum + getAmount(b), 0);
        if (totalAmount <= 0) throw new Error("Total amount is zero or invalid");

        // You can add tax/fuel surcharge logic here as needed.
        const totalTax = 0;
        const netAmount = totalAmount + totalTax;

        const periodFrom = toInvoice.reduce((min, b) => b.bookingDate < min ? b.bookingDate : min, toInvoice[0].bookingDate);
        const periodTo = toInvoice.reduce((max, b) => b.bookingDate > max ? b.bookingDate : max, toInvoice[0].bookingDate);

        const createdInvoice = await tx.invoice.create({
          data: {
            invoiceNo,
            type: invoiceType,
            invoiceDate,
            periodFrom,
            periodTo,
            customerId,
            totalAmount: Number(totalAmount.toFixed(2)),
            totalTax: Number(totalTax.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            bookings: {
              create: toInvoice.map((b) => ({
                bookingId: b.id,
                bookingType: invoiceType,
                consignmentNo: b.awbNo,
                bookingDate: b.bookingDate,
                senderName: b.customer?.customerName ?? "",
                receiverName: b.receiverName ?? "",
                city: b.destinationCity || b.location || "",
                amountCharged: getAmount(b),
                taxAmount: 0
              }))
            }
          },
          include: { bookings: true }
        });

        await tx.bookingMaster.updateMany({
          where: { id: { in: toInvoice.map(b => b.id) } },
          data: { status: "INVOICED", statusDate: new Date() }
        });

        return createdInvoice;
      }, { timeout: 15000 });
    }, 3);

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
    
    // Handle new BookingMaster invoice types
    if (type) {
      if (type === "Domestic" || type === "International") {
        // Map UI types to DB types for BookingMaster invoices
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


// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// type CreateInvoiceBody = {
//   type: "CashBooking" | "InternationalCashBooking" | "CreditClientBooking" | "InternationalCreditClientBooking";
//   invoiceDate: string;
//   bookingIds: string[];
//   customerId?: string;
// };

// const ALLOWED_TYPES = ["CashBooking", "InternationalCashBooking", "CreditClientBooking", "InternationalCreditClientBooking"];
// function parseInvoiceNumericPart(invoiceNo: string | undefined) {
//   if (!invoiceNo) return 0;
//   const m = invoiceNo.match(/(\d+)$/);
//   return m ? parseInt(m[1], 10) : 0;
// }
// async function runWithRetries<T>(
//   fn: () => Promise<T>,
//   retries = 3
// ): Promise<T> {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       return await fn();
//     } catch (err: any) {
//       const code = err?.code;
//       const retryable =
//         code === "P2002" ||
//         code === "40001" ||
//         /deadlock|serialization/i.test(err?.message || "");

//       if (!retryable || attempt === retries) {
//         throw err;
//       }
//       await new Promise((res) => setTimeout(res, 50 * attempt));
//     }
//   }
//   throw new Error("Failed after retries");
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body: CreateInvoiceBody = await req.json();
//     if (
//       !body ||
//       !body.type ||
//       !ALLOWED_TYPES.includes(body.type) ||
//       !Array.isArray(body.bookingIds) ||
//       body.bookingIds.length === 0 ||
//       (
//         (body.type === "CreditClientBooking" || body.type === "InternationalCreditClientBooking") &&
//         !body.customerId
//       )
//     ) {
//       return NextResponse.json({ message: "Invalid input" }, { status: 400 });
//     }

//     const invoiceDate = new Date(body.invoiceDate);
//     if (isNaN(invoiceDate.getTime())) {
//       return NextResponse.json({ message: "Invalid invoiceDate" }, { status: 400 });
//     }

//     const createdInvoice = await runWithRetries(async () => {
//       return await prisma.$transaction(async (tx) => {
//         const { type, bookingIds } = body;

//         const settings = await tx.invoiceSettings.findFirst();
//         const prefix = settings?.invoicePrefix || "INV";

//         const lastInvoice = await tx.invoice.findFirst({
//           where: { type },
//           orderBy: { createdAt: "desc" },
//           select: { invoiceNo: true },
//         });
//         const maxExistingNumber = parseInvoiceNumericPart(lastInvoice?.invoiceNo) || 0;

//         const counter = await tx.invoiceCounter.upsert({
//           where: { type },
//           create: { type, lastNumber: maxExistingNumber + 1 },
//           update: { lastNumber: { increment: 1 } },
//         });

//         const nextNumber = counter.lastNumber;
//         const invoiceNo = `${prefix}${String(nextNumber).padStart(5, "0")}`;

//         let bookings: any[] = [];
//         if (type === "CashBooking") {
//           bookings = await tx.cashBooking.findMany({
//             where: { id: { in: bookingIds } },
//           });
//         } else if (type === "InternationalCashBooking") {
//           bookings = await tx.internationalCashBooking.findMany({
//             where: { id: { in: bookingIds } },
//           });
//         } else if (type === "CreditClientBooking") {
//           bookings = await tx.creditClientBooking.findMany({
//             where: { id: { in: bookingIds }, customerId: body.customerId },
//             include: { customer: true }
//           });
//         } else if (type === "InternationalCreditClientBooking") {
//           bookings = await tx.internationalCreditClientBooking.findMany({
//             where: { id: { in: bookingIds }, customerId: body.customerId },
//             include: { customer: true }
//           });
//         }

//         if (!bookings || bookings.length === 0) {
//           throw new Error("No bookings found");
//         }

//         const alreadyInvoiced = await tx.invoiceBooking.findMany({
//           where: {
//             bookingId: { in: bookingIds },
//             bookingType: type,
//           },
//           select: { bookingId: true },
//         });
//         const alreadyInvoicedSet = new Set(alreadyInvoiced.map((r) => r.bookingId));
//         const toInvoice = bookings.filter((b) => !alreadyInvoicedSet.has(b.id));

//         if (toInvoice.length === 0) {
//           throw new Error("All selected bookings are already invoiced");
//         }
//         const totalAmount = toInvoice.reduce(
//           (s, b) =>
//             s +
//             Number(
//               type === "CashBooking" || type === "InternationalCashBooking"
//                 ? b.amountCharged ?? 0
//                 : b.chargeAmount ?? 0
//             ),
//           0
//         );

//         if (totalAmount <= 0) {
//           throw new Error("Total amount is zero or invalid");
//         }

//         let totalTax = 0;
//         if (type === "CashBooking") {
//           const defaultTaxRate = 0.18;
//           totalTax = Number((totalAmount * defaultTaxRate).toFixed(2));
//         } else {
//           totalTax = 0;
//         }

//         const netAmount = Number((totalAmount + totalTax).toFixed(2));
//         const taxAllocations: Record<string, number> = {};
//         let allocatedTax = 0;
//         toInvoice.forEach((b, idx) => {
//           const share = Number(b.amountCharged ?? 0) / totalAmount;
//           const tax = Math.round((share * totalTax) * 100) / 100;
//           taxAllocations[b.id] = tax;
//           allocatedTax += tax;
//         });


//         const roundingRemainder = Number((totalTax - allocatedTax).toFixed(2));
//         if (Math.abs(roundingRemainder) >= 0.01) {
//           const firstId = toInvoice[0].id;
//           taxAllocations[firstId] = Number((taxAllocations[firstId] + roundingRemainder).toFixed(2));
//           allocatedTax = Number((allocatedTax + roundingRemainder).toFixed(2));
//         }

//         const periodFrom = toInvoice.length > 0
//           ? toInvoice.reduce((min, b) => b.bookingDate < min ? b.bookingDate : min, toInvoice[0].bookingDate)
//           : null;

//         const periodTo = toInvoice.length > 0
//           ? toInvoice.reduce((max, b) => b.bookingDate > max ? b.bookingDate : max, toInvoice[0].bookingDate)
//           : null;

//         const createdInvoice = await tx.invoice.create({
//           data: {
//             invoiceNo,
//             type,
//             invoiceDate,
//             periodFrom,
//             periodTo,
//             customerId: (type === "CreditClientBooking" || type === "InternationalCreditClientBooking") ? body.customerId : undefined,
//             totalAmount: Number(totalAmount.toFixed(2)),
//             totalTax: Number(totalTax.toFixed(2)),
//             netAmount: Number(netAmount.toFixed(2)),
//             bookings: {
//               create: toInvoice.map((b) => ({
//                 bookingId: b.id,
//                 bookingType: type,
//                 consignmentNo: b.consignmentNo,
//                 bookingDate: b.bookingDate,
//                 senderName:
//                   type === "CreditClientBooking" || type === "InternationalCreditClientBooking"
//                     ? b.customer?.customerName || ""
//                     : b.senderName,
//                 receiverName:
//                   type === "CreditClientBooking" || type === "InternationalCreditClientBooking"
//                     ? b.consigneeName || b.receiverName || ""
//                     : b.receiverName,
//                 city:
//                   type === "CashBooking"
//                     ? b.city ?? "N/A"
//                     : type === "InternationalCashBooking"
//                       ? b.country ?? "N/A"
//                       : b.city ?? b.country ?? "N/A",
//                 amountCharged: Number(
//                   type === "CashBooking" || type === "InternationalCashBooking"
//                     ? b.amountCharged ?? 0
//                     : b.chargeAmount ?? 0
//                 ),
//                 taxAmount: type === "CashBooking" ? Number((taxAllocations[b.id] ?? 0).toFixed(2)) : 0,
//               })),
//             },
//           },
//           include: { bookings: true },
//         });

//         const idsToUpdate = toInvoice.map((b) => b.id);
//         if (type === "CashBooking") {
//           await tx.cashBooking.updateMany({
//             where: { id: { in: idsToUpdate } },
//             data: { status: "INVOICED", statusDate: new Date() },
//           });
//         } else if (type === "InternationalCashBooking") {
//           await tx.internationalCashBooking.updateMany({
//             where: { id: { in: idsToUpdate } },
//             data: { status: "INVOICED", statusDate: new Date() },
//           });
//         } else if (type === "CreditClientBooking") {
//           await tx.creditClientBooking.updateMany({
//             where: { id: { in: idsToUpdate } },
//             data: { status: "INVOICED", statusDate: new Date() },
//           });
//         } else if (type === "InternationalCreditClientBooking") {
//           await tx.internationalCreditClientBooking.updateMany({
//             where: { id: { in: idsToUpdate } },
//             data: { status: "INVOICED", statusDate: new Date() },
//           });
//         }

//         return createdInvoice;
//       }, { timeout: 15000 });
//     }, 3);

//     return NextResponse.json(createdInvoice, { status: 201 });
//   } catch (error: any) {
//     console.error("Invoice generation error:", error);

//     if (error.code === "P2002" && String(error.meta?.target || "").includes("invoiceNo")) {
//       return NextResponse.json(
//         { message: "Invoice number collision detected. Please try again." },
//         { status: 409 }
//       );
//     }

//     if (error.message === "No bookings found") {
//       return NextResponse.json({ message: error.message }, { status: 404 });
//     }

//     if (error.message === "All selected bookings are already invoiced") {
//       return NextResponse.json({ message: error.message }, { status: 400 });
//     }

//     if (error.message === "Total amount is zero or invalid") {
//       return NextResponse.json({ message: error.message }, { status: 400 });
//     }

//     return NextResponse.json(
//       { message: `Error generating invoice: ${error.message || "unknown"}` },
//       { status: 500 }
//     );
//   }
// }
