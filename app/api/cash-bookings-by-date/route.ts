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
        const cashBookings = await prisma.cashBooking.findMany({
            where: {
                bookingDate: {
                    gte: new Date(fromDate),
                    lte: new Date(toDate),
                },
                status,
            },
            orderBy: { bookingDate: "asc" },
        });
        console.log("Cash Bookings:", cashBookings);

        const intlBookings = await prisma.internationalCashBooking.findMany({
            where: {
                bookingDate: {
                    gte: new Date(fromDate),
                    lte: new Date(toDate),
                },
                status,
            },
            orderBy: { bookingDate: "asc" },
        });
        console.log("International Bookings:", intlBookings);

        // Add a type field to distinguish in UI if needed
        const allBookings = [
            ...cashBookings.map(b => ({ ...b, bookingType: "CashBooking" })),
            ...intlBookings.map(b => ({ ...b, bookingType: "InternationalCashBooking" })),
        ];

        // Optionally, sort allBookings by bookingDate if you want a single sorted list
        allBookings.sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
        console.log("Fetched bookings:", allBookings);

        return NextResponse.json(allBookings);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
    }
}