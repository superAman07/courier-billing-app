import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const body = await request.json();
    try {
        const pincode = await prisma.pincodeMaster.update({
            where: { id: (await params).id },
            data: body,
            include: { state: true, city: true }
        });
        return NextResponse.json(pincode, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update pincode" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await prisma.pincodeMaster.delete({ where: { id: (await params).id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete pincode" }, { status: 500 });
    }
}