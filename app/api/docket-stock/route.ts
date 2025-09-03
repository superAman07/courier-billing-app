import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const whereClause: any = {};
        if (status && (status.toUpperCase() === 'UNUSED' || status.toUpperCase() === 'USED')) {
            whereClause.status = status.toUpperCase();
        }

        const dockets = await prisma.docketStock.findMany({
            where: whereClause,
            orderBy: {
                awbNo: 'asc'
            }
        });

        const count = await prisma.docketStock.count({ where: whereClause });

        return NextResponse.json({
            data: dockets,
            count: count
        });

    } catch (error) {
        console.error("Failed to fetch docket stock:", error);
        return NextResponse.json({ error: "Failed to fetch docket stock." }, { status: 500 });
    }
}

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