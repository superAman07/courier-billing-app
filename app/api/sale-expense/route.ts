import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const entries = await prisma.dailyLedger.findMany({
            orderBy: [
                { date: 'asc' },
                { createdAt: 'asc' }
            ]
        });
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const entry = await prisma.dailyLedger.create({
            data: {
                date: new Date(data.date),
                particulars: data.particulars,
                sale: Number(data.sale || 0),
                cashSale: Number(data.cashSale || 0),
                codReceived: Number(data.codReceived || 0),
                digitalSale: Number(data.digitalSale || 0),
                salePending: Number(data.salePending || 0),
                clientPayment: Number(data.clientPayment || 0),
                expenseAmount: Number(data.expenseAmount || 0),
                expenseByDigital: Number(data.expenseByDigital || 0),
                employeeAdvance: Number(data.employeeAdvance || 0),
                bankDeposit: Number(data.bankDeposit || 0),
                remarks: data.remarks || '',
            }
        });
        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create ledger entry" }, { status: 500 });
    }
}