import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bookingMaster = await prisma.bookingMaster.findMany({
      include: { customer: true },
      orderBy: { bookingDate: "desc" }
    });

    const cashBookings = await prisma.cashBooking.findMany({
      orderBy: { bookingDate: "desc" }
    });

    const creditBookings = await prisma.creditClientBooking.findMany({
      include: { customer: true },
      orderBy: { bookingDate: "desc" }
    });

    const intlCashBookings = await prisma.internationalCashBooking.findMany({
      orderBy: { bookingDate: "desc" }
    });

    const intlCreditBookings = await prisma.internationalCreditClientBooking.findMany({
      include: { customer: true },
      orderBy: { bookingDate: "desc" }
    });

    const all = [
      ...bookingMaster.map(b => ({
        type: "BookingMaster",
        id: b.id,
        consignmentNo: b.awbNo,
        customer: b.customer?.customerName ?? "",
        destination: b.destinationCity,
        bookingDate: b.bookingDate,
        deliveryStatus: b.status ?? "",
        deliveryDate: b.statusDate,
      })),
      ...cashBookings.map(b => ({
        type: "CashBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.senderName,
        destination: b.city,
        bookingDate: b.bookingDate,
        smsSent: b.smsSent ?? false,
        smsDate: b.smsDate ?? null,
      })),
      ...creditBookings.map(b => ({
        type: "CreditClientBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.customer?.customerName ?? "",
        destination: b.city,
        bookingDate: b.bookingDate,
        smsSent: b.smsSent ?? false,
        smsDate: b.smsDate ?? null,
      })),
      ...intlCashBookings.map(b => ({
        type: "InternationalCashBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.senderName,
        destination: b.country,
        bookingDate: b.bookingDate,
        smsSent: b.smsSent ?? false,
        smsDate: b.smsDate ?? null,
      })),
      ...intlCreditBookings.map(b => ({
        type: "InternationalCreditClientBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.customer?.customerName ?? "",
        destination: b.country,
        bookingDate: b.bookingDate,
        smsSent: b.smsSent ?? false,
        smsDate: b.smsDate ?? null,
      })),
    ];

    return NextResponse.json(all);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching delivery status data" }, { status: 500 });
  }
}