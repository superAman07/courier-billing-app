import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.cashBooking.findMany({
      orderBy: { bookingDate: "desc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching cash bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Cashbooking form payload sent data:", data);
    const booking = await prisma.cashBooking.create({
      data: {
        bookingDate: new Date(data.bookingDate),
        senderName: data.senderName,
        senderMobile: data.senderMobile,
        sourcePincode: data.sourcePincode,
        sourceState: data.sourceState,
        sourceCity: data.sourceCity,
        receiverName: data.receiverName,
        receiverMobile: data.receiverMobile,
        consignmentNo: data.consignmentNo,
        docType: data.docType,
        mode: data.mode,
        pincode: data.pincode,
        city: data.city,
        pieces: Number(data.pieces),
        weight: Number(data.weight),
        courierCharged: Number(data.courierCharged),
        contents: data.contents,
        value: data.value !== undefined ? Number(data.value) : null,
        vsAmount: data.vsAmount !== undefined ? Number(data.vsAmount) : null,
        amountCharged: Number(data.amountCharged),
        smsSent: data.smsSent ?? false,
        smsDate: data.smsDate ? new Date(data.smsDate) : null,
      }
    });
    console.log("Booking cashbook response from schema: ",booking);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.log("Error creating cash booking: ", error);
    return NextResponse.json({ message: "Error creating cash booking" }, { status: 500 });
  }
}