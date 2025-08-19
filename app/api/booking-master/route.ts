import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.bookingMaster.findMany({
      include: { customer: true },
      orderBy: { bookingDate: "desc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Received booking payload:", data);
    const booking = await prisma.bookingMaster.create({
      data: {
        ...data,
        awbNo: String(data.awbNo),
        pin: String(data.pin),
        pcs: Number(data.pcs),
        invoiceValue: Number(data.invoiceValue),
        actualWeight: Number(data.actualWeight),
        chargeWeight: Number(data.chargeWeight),
        invoiceWt: Number(data.invoiceWt),
        clientBillingValue: Number(data.clientBillingValue),
        creditCustomerAmount: Number(data.creditCustomerAmount),
        regularCustomerAmount: Number(data.regularCustomerAmount),
        pendingDaysNotDelivered: Number(data.pendingDaysNotDelivered),
        shipmentCostOtherMode: Number(data.shipmentCostOtherMode),
        bookingDate: new Date(data.bookingDate),
        statusDate: data.statusDate ? new Date(data.statusDate) : null,
      },
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ message: "Error creating booking" }, { status: 500 });
  }
}