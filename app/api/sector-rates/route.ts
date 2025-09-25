import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
        return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    try {
        const rates = await prisma.sectorRate.findMany({
            where: { customerId },
            orderBy: { sectorName: 'asc' }
        });
        return NextResponse.json(rates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { customerId, sectorName, ...rateData } = data;

        const rate = await prisma.sectorRate.upsert({
            where: { customerId_sectorName: { customerId, sectorName } },
            update: rateData,
            create: { customerId, sectorName, ...rateData },
        });

        return NextResponse.json(rate, { status: 200 });
    } catch (error) {
        console.error("Failed to save sector rate:", error);
        return NextResponse.json({ error: "Failed to save rate" }, { status: 500 });
    }
}