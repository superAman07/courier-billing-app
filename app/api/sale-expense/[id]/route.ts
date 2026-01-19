import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const data = await req.json();

        const updatedEntry = await prisma.dailyLedger.update({
            where: { id },
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

        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error("Error updating ledger entry:", error);
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        
        await prisma.dailyLedger.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting ledger entry:", error);
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}