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

    // Normalize all bookings to a common structure
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
        smsSent: false, // You can update this if you add SMS tracking
      })),
      ...cashBookings.map(b => ({
        type: "CashBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.senderName,
        destination: b.city,
        bookingDate: b.bookingDate,
        deliveryStatus: "", // Add if you have a status field
        deliveryDate: null, // Add if you have a delivery date field
        smsSent: false,
      })),
      ...creditBookings.map(b => ({
        type: "CreditClientBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.customer?.customerName ?? "",
        destination: b.city,
        bookingDate: b.bookingDate,
        deliveryStatus: "", // Add if you have a status field
        deliveryDate: null, // Add if you have a delivery date field
        smsSent: false,
      })),
      ...intlCashBookings.map(b => ({
        type: "InternationalCashBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.senderName,
        destination: b.country,
        bookingDate: b.bookingDate,
        deliveryStatus: "", // Add if you have a status field
        deliveryDate: null, // Add if you have a delivery date field
        smsSent: false,
      })),
      ...intlCreditBookings.map(b => ({
        type: "InternationalCreditClientBooking",
        id: b.id,
        consignmentNo: b.consignmentNo,
        customer: b.customer?.customerName ?? "",
        destination: b.country,
        bookingDate: b.bookingDate,
        deliveryStatus: "", // Add if you have a status field
        deliveryDate: null, // Add if you have a delivery date field
        smsSent: false,
      })),
    ];

    return NextResponse.json(all);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching delivery status data" }, { status: 500 });
  }
}