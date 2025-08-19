import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const booking = await prisma.bookingMaster.findUnique({
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
    const id= (await params).id;
    const data = await req.json();
    const booking = await prisma.bookingMaster.update({
      where: { id },
      data: {
        ...data,
        bookingDate: new Date(data.bookingDate),
        statusDate: data.statusDate ? new Date(data.statusDate) : null,
      },
    });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error updating booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await prisma.bookingMaster.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting booking" }, { status: 500 });
  }
}