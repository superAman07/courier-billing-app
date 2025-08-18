import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.internationalCashBooking.findUnique({
      where: { id: params.id },
    });
    if (!booking) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const booking = await prisma.internationalCashBooking.update({
      where: { id: params.id },
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
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error updating booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.internationalCashBooking.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting booking" }, { status: 500 });
  }
}