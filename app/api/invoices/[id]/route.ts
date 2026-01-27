import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { bookings: true, customer: true },
    });
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }
    let enrichedBookings = invoice.bookings;
    if (invoice.bookings.length > 0 && invoice.bookings[0].bookingType === 'BookingMaster') {
        const bookingIds = invoice.bookings.map(b => b.bookingId);
        
        const originalBookings = await prisma.bookingMaster.findMany({
            where: { id: { in: bookingIds } }
        });
        const originalMap = new Map(originalBookings.map(b => [b.id, b]));
        enrichedBookings = invoice.bookings.map(booking => {
            const original = originalMap.get(booking.bookingId);
            if (original) {
                return {
                    ...original, 
                    ...booking
                };
            }
            return booking;
        });
    }
    return NextResponse.json({ ...invoice, bookings: enrichedBookings });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching invoice" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    const data = await req.json();

    const allowedHeaderFields = ["invoiceDate", "periodFrom", "periodTo"];
    const updateData: any = {};
    for (const key of allowedHeaderFields) {
      if (data[key] !== undefined && data[key] !== "") {
        updateData[key] = new Date(data[key]);
      }
    }

    let updatedInvoice = null;
    if (Object.keys(updateData).length > 0) {
      updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: { bookings: true, customer: true }
      });
    }

    if (Array.isArray(data.bookings)) {
      for (const updatedLine of data.bookings) {
        const allowedBookingFields = [
          "amountCharged", "weight", "consignmentValue", "doxType",
          "numPcs", "serviceType", "shipperCost", "waybillSurcharge", "otherExp"
        ];
        const bookingUpdate: any = {};
        for (const key of allowedBookingFields) {
          if (updatedLine[key] !== undefined) {
            bookingUpdate[key] = updatedLine[key];
          }
        }
        if (Object.keys(bookingUpdate).length > 0 && updatedLine.id) {
          await prisma.invoiceBooking.update({
            where: { id: updatedLine.id },
            data: bookingUpdate,
          });
        }
      }
    }

    const refreshedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { bookings: true, customer: true },
    });

    return NextResponse.json(refreshedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ message: "Error updating invoice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }
    const bookingIds = invoice.bookings.map(b => b.bookingId);
    if (
      invoice.type === "BookingMaster_CREDIT" ||
      invoice.type === "BookingMaster_CASH"
    ) {
      await prisma.bookingMaster.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: "BOOKED", statusDate: new Date() },
      });
    }
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting invoice" }, { status: 500 });
  }
}