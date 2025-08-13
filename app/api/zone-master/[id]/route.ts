import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const id = (await params).id;
        const updatedZone = await prisma.zoneMaster.update({
            where: {
                id
            },
            data: body
        })
        return NextResponse.json(updatedZone, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const response = await prisma.zoneMaster.delete({
            where: {
                id
            }
        })
        return NextResponse.json(response, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
    }
}