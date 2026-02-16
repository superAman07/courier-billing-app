import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const rates = await prisma.sectorRate.findMany({
            select: { sectorName: true },
        });
        return NextResponse.json(rates);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}