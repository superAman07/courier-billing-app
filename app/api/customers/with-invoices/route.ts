import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'Domestic' or 'International'

    try {
        const isInternational = type === 'International';

        // 1. Find all distinct Customer IDs that exist in the Invoice table
        // specifically for Credit Clients ("BookingMaster_CREDIT")
        const invoices = await prisma.invoice.findMany({
            where: {
                type: 'BookingMaster_CREDIT',
                customerId: { not: null }
            },
            select: {
                customerId: true
            },
            distinct: ['customerId']
        });

        const customerIds = invoices
            .map(inv => inv.customerId)
            .filter((id): id is string => id !== null);

        if (customerIds.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch details Only for these filtered IDs
        const customers = await prisma.customerMaster.findMany({
            where: {
                id: { in: customerIds },
                isInternational: isInternational
            },
            select: {
                id: true,
                customerName: true,
                customerCode: true
            },
            orderBy: { customerName: 'asc' }
        });

        return NextResponse.json(customers);

    } catch (error) {
        console.error("Error fetching customers with invoices:", error);
        return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
    }
}