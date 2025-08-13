import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const states = await prisma.stateMaster.findMany({
            include: { zone: true },
            orderBy: { name: "asc" }
        });
        return NextResponse.json(states);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const state = await prisma.stateMaster.create({ data: body, include: { zone: true } });
        return NextResponse.json(state, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create state" }, { status: 500 });
    }
}