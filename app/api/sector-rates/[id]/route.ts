import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = (await params);
        await prisma.sectorRate.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Rate deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete rate:", error);
        return NextResponse.json({ error: "Failed to delete rate" }, { status: 500 });
    }
}