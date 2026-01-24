import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'Domestic' or 'International'

    try {
        const isInternational = type === 'International';

        // 1. Find all distinct Customer IDs that have uninvoiced CREDIT bookings
        const pendingBookings = await prisma.bookingMaster.groupBy({
            by: ['customerId'],
            where: {
                customerType: 'CREDIT',
                // We assume 'BOOKED' or 'DELIVERED' means ready for invoice. 
                // Adjust if you have other statuses like 'manualStatus'.
                status: { in: ['BOOKED', 'DELIVERED'] }, 
                customerId: { not: null }
            }
        });

        const customerIds = pendingBookings
            .map(b => b.customerId)
            .filter((id): id is string => id !== null);

        if (customerIds.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch Customer Details (Name, Code) only for these IDs
        // AND Apply the Domestic/International filter
        const customers = await prisma.customerMaster.findMany({
            where: {
                id: { in: customerIds },
                isInternational: isInternational
            },
            select: {
                id: true,
                customerName: true,
                customerCode: true,
                isInternational: true
            },
            orderBy: { customerName: 'asc' }
        });

        return NextResponse.json(customers);

    } catch (error) {
        console.error("Error fetching pending customers:", error);
        return NextResponse.json({ message: "Error fetching pending customers" }, { status: 500 });
    }
}