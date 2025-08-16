import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { bookSeries, amount } = data;
        const response = await prisma.bookRateMaster.create({
            data: {
                bookSeries,
                amount
            }
        })
        return NextResponse.json(response, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create book rate" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const items = await prisma.bookRateMaster.findMany({
            orderBy: {
                bookSeries: 'asc'
            }
        });
        return NextResponse.json(items);
    } catch {
        return NextResponse.json({ error: "Failed to retrieve book rates" }, { status: 500 });
    }
}