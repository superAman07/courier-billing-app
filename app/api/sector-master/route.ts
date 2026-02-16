import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch all sectors
export async function GET() {
    try {
        const sectors = await prisma.sectorMaster.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(sectors);
    } catch (error) {
        console.error("Error fetching sectors:", error);
        return NextResponse.json({ error: "Failed to fetch sectors" }, { status: 500 });
    }
}

// POST: Create a new sector
export async function POST(req: NextRequest) {
    try {
        const { code, name } = await req.json();
        if (!code || !name) {
            return NextResponse.json({ error: "Code and Name are required" }, { status: 400 });
        }
        const sector = await prisma.sectorMaster.create({
            data: { code: code.toUpperCase(), name, active: true },
        });
        return NextResponse.json(sector);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Sector code or name already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create sector" }, { status: 500 });
    }
}