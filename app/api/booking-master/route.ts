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
    const booking = await prisma.bookingMaster.create({
      data: {
        ...data,
        bookingDate: new Date(data.bookingDate),
        statusDate: data.statusDate ? new Date(data.statusDate) : null,
      },
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating booking" }, { status: 500 });
  }
}