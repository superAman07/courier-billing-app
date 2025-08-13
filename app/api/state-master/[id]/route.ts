import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const updated = await prisma.stateMaster.update({
            where: { id: params.id },
            data: body,
            include: { zone: true }
        });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update state" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.stateMaster.delete({ where: { id: params.id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete state" }, { status: 500 });
    }
}