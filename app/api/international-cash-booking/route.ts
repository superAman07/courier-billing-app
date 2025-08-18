import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.internationalCashBooking.findMany({
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
    const booking = await prisma.internationalCashBooking.create({
      data: {
        bookingDate: new Date(data.bookingDate),
        senderName: data.senderName,
        senderMobile: data.senderMobile,
        receiverName: data.receiverName,
        receiverMobile: data.receiverMobile,
        consignmentNo: data.consignmentNo,
        docType: data.docType,
        mode: data.mode,
        country: data.country,
        pieces: Number(data.pieces),
        weight: Number(data.weight),
        courierCharged: Number(data.courierCharged),
        contents: data.contents,
        value: data.value !== undefined ? Number(data.value) : null,
        vasAmount: data.vasAmount !== undefined ? Number(data.vasAmount) : null,
        amountCharged: Number(data.amountCharged),
      }
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating booking" }, { status: 500 });
  }
}