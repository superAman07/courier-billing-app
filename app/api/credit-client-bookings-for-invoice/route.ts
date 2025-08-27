import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!customerId || !fromDate || !toDate) {
      return NextResponse.json({ message: "Missing filters" }, { status: 400 });
    }

    const bookings = await prisma.creditClientBooking.findMany({
      where: {
        customerId,
        bookingDate: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
        status: "BOOKED",
      },
      include: { customer: true },
      orderBy: { bookingDate: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
  }
}