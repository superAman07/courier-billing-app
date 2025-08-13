import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const response = await prisma.zoneMaster.create({
            data
        });
        return NextResponse.json(response, { status: 201 });
    }catch (e){
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
    }
}
export async function GET() {
    try {
        const zones = await prisma.zoneMaster.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(zones);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to retrieve zones' }, { status: 500 });
    }
}