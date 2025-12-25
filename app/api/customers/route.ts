import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // --- FIX: Handle Empty Strings for Unique Fields ---
        // If email is empty string, set it to null so Unique Constraint ignores it
        if (body.email === "") body.email = null;
        
        // Optional: Clean up other empty fields to keep DB clean
        if (body.mobile === "") body.mobile = null;
        if (body.phone === "") body.phone = null;
        if (body.panNo === "") body.panNo = null;
        if (body.gstNo === "") body.gstNo = null;
        // --------------------------------------------------

        // Ensure numeric fields are numbers
        if (body.defaultShipperCost) body.defaultShipperCost = parseFloat(body.defaultShipperCost);
        if (body.fuelSurchargePercent) body.fuelSurchargePercent = parseFloat(body.fuelSurchargePercent);
        if (body.discountPercent) body.discountPercent = parseFloat(body.discountPercent);
        if (body.openingBalance) body.openingBalance = parseFloat(body.openingBalance);

        const newCustomer = await prisma.customerMaster.create({
            data: body,
        });
        return NextResponse.json(newCustomer, { status: 201 });
    } catch (error: any) {
        console.error("Error creating customer:", error);

        // Handle Unique Constraint Error specifically
        if (error.code === 'P2002') {
            const field = error.meta?.target ? error.meta.target : 'field';
            return NextResponse.json(
                { message: `A customer with this ${field} already exists.` },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Error creating customer" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    try {
        const customers = await prisma.customerMaster.findMany({
            where: query ? {
                OR: [
                    { customerName: { contains: query, mode: 'insensitive' } },
                    { customerCode: { contains: query, mode: 'insensitive' } },
                ]
            } : {},
            take: query ? 10 : undefined,
            orderBy: {
                customerName: 'asc'
            } 
        });
        return NextResponse.json(customers);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error fetching customers" },
            { status: 500 }
        );
    }
}