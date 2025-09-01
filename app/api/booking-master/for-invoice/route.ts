import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const customerType = searchParams.get("customerType") || "CREDIT";
        const statusParam = searchParams.get("status") || "BOOKED";
        const invoiceType = searchParams.get("type");

        if (!customerId || !fromDate || !toDate) {
            return NextResponse.json({ message: "Missing filters" }, { status: 400 });
        }

        const statusList = statusParam.split(",").map(s => s.trim()).filter(Boolean);

        const filters: any = {
            customerId,
            customerType,
            status: { in: statusList },
            bookingDate: {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            },
        };

        if (invoiceType && ["Domestic", "International"].includes(invoiceType)) {
            filters.customer = { isInternational: invoiceType === "International" };
        }

        const bookings = await prisma.bookingMaster.findMany({
            where: filters,
            include: { customer: true },
            orderBy: { bookingDate: "asc" },
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Invoice fetch error:", error);
        return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
    }
}
