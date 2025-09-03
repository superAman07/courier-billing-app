import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { awbNumbers } = await req.json();

        if (!awbNumbers || !Array.isArray(awbNumbers) || awbNumbers.length === 0) {
            return NextResponse.json({ error: "AWB numbers are required." }, { status: 400 });
        }

        const result = await prisma.docketStock.createMany({
            data: awbNumbers.map(awb => ({ awbNo: String(awb) })),
            skipDuplicates: true,
        });

        return NextResponse.json({
            message: "Docket stock updated successfully.",
            count: result.count
        }, { status: 201 });

    } catch (error) {
        console.error("Failed to update docket stock:", error);
        return NextResponse.json({ error: "Failed to update docket stock." }, { status: 500 });
    }
}