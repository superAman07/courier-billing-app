import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const assignedBookings = await prisma.bookingMaster.findMany({
            where: {
                customerId: {
                    not: null
                }
            },
            include: {
                customer: true,
            },
            orderBy: {
                bookingDate: 'desc',
            },
        });
        return NextResponse.json(assignedBookings);
    } catch (error) {
        console.error("Failed to fetch assigned bookings:", error);
        return NextResponse.json({ message: "Error fetching assigned bookings" }, { status: 500 });
    }
}