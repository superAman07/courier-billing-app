import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.creditClientBooking.findMany({
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
    const booking = await prisma.creditClientBooking.create({
      data: {
        bookingDate: new Date(data.bookingDate),
        consignmentNo: data.consignmentNo,
        customerId: data.customerId,
        docType: data.docType,
        serviceType: data.serviceType,
        pincode: data.pincode,
        city: data.city,
        weight: Number(data.weight),
        courierAmount: Number(data.courierAmount),
        vasAmount: data.vasAmount !== undefined ? Number(data.vasAmount) : null,
        chargeAmount: Number(data.chargeAmount),
        consigneeName: data.consigneeName,
      }
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating booking" }, { status: 500 });
  }
}