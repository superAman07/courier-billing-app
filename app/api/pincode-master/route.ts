import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const pincodes = await prisma.pincodeMaster.findMany({
            include: { state: true, city: true },
            orderBy: { pincode: "asc" }
        });
        return NextResponse.json(pincodes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch pincodes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const pincode = await prisma.pincodeMaster.create({
            data: body,
            include: { state: true, city: true }
        });
        return NextResponse.json(pincode, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create pincode" }, { status: 500 });
    }
}