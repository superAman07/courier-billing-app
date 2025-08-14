import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const body = await request.json();
    const id = (await params).id;
    try {
        const city = await prisma.cityMaster.update({
            where: { id },
            data: body,
            include: { state: true }
        });
        return NextResponse.json(city, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update city" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    try {
        await prisma.cityMaster.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete city" }, { status: 500 });
    }
}