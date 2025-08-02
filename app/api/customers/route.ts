import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newCustomer = await prisma.customerMaster.create({
            data: body,
        });
        return NextResponse.json(newCustomer, { status: 201 });
    } catch (error) {
        console.error(error);
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