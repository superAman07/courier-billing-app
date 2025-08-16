import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    const data = await req.json();
    const { bookSeries, amount } = data;

    try {
        const updatedItem = await prisma.bookRateMaster.update({
            where: { id },
            data: { bookSeries, amount }
        });
        return NextResponse.json(updatedItem);
    } catch {
        return NextResponse.json({ error: "Failed to update book rate" }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;

    try {
        await prisma.bookRateMaster.delete({
            where: { id }
        });
        return NextResponse.json({ message: "Book rate deleted successfully" });
    } catch {
        return NextResponse.json({ error: "Failed to delete book rate" }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;

    try {
        const item = await prisma.bookRateMaster.findUnique({
            where: { id }
        });
        return NextResponse.json(item);
    } catch {
        return NextResponse.json({ error: "Failed to retrieve book rate" }, { status: 500 });
    }
}