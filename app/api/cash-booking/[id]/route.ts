import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id
    const booking = await prisma.cashBooking.findUnique({
      where: { id },
    });
    if (!booking) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching cash booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await req.json();
    const id = (await params).id
    const booking = await prisma.cashBooking.update({
      where: { id },
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
      },
    });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error updating cash booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id
    await prisma.cashBooking.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting cash booking" }, { status: 500 });
  }
}