import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ message: "Invoice ID is required" }, { status: 400 });
    }

    try {
        const paymentsOnInvoice = await prisma.paymentOnInvoice.findMany({
            where: { invoiceId: id },
            include: {
                payment: true,
            },
            orderBy: {
                payment: {
                    paymentDate: 'desc',
                },
            },
        });

        return NextResponse.json(paymentsOnInvoice);
    } catch (error) {
        console.error(`Failed to fetch payment details for invoice ${id}:`, error);
        return NextResponse.json({ message: "Failed to fetch payment details" }, { status: 500 });
    }
}