import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const entries = await prisma.dailyLedger.findMany({
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const entry = await prisma.dailyLedger.create({
            data: {
                ...data,
                date: new Date(data.date),
            }
        });
        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create ledger entry" }, { status: 500 });
    }
}