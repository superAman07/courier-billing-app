import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const unassignedBookings = await prisma.bookingMaster.findMany({
            where: {
                customerId: null,
            },
            include: {
                customer: true,
            },
            orderBy: {
                bookingDate: 'desc',
            },
        });
        return NextResponse.json(unassignedBookings);
    } catch (error) {
        console.error("Failed to fetch unassigned bookings:", error);
        return NextResponse.json({ message: "Error fetching unassigned bookings" }, { status: 500 });
    }
}