import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const cities = await prisma.cityMaster.findMany({
            include: { state: true },
            orderBy: { name: "asc" }
        });
        return NextResponse.json(cities);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const city = await prisma.cityMaster.create({ data: body, include: { state: true } });
        return NextResponse.json(city, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create city" }, { status: 500 });
    }
}