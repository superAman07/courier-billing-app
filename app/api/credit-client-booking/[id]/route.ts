import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const booking = await prisma.creditClientBooking.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!booking) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const data = await req.json();
    const booking = await prisma.creditClientBooking.update({
      where: { id },
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
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error updating booking" }, { status: 500 });
  }
}
 
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await prisma.creditClientBooking.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting booking" }, { status: 500 });
  }
}