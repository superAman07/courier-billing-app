import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const status = searchParams.get("status") || "BOOKED";

  if (!fromDate || !toDate) {
    return NextResponse.json({ message: "fromDate and toDate are required" }, { status: 400 });
  }

  try {
    const bookings = await prisma.cashBooking.findMany({
      where: {
        bookingDate: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
        status,
      },
      orderBy: { bookingDate: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching cash bookings" }, { status: 500 });
  }
}