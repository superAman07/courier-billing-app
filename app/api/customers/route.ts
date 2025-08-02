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

export async function GET() {
    try {
        const customers = await prisma.customerMaster.findMany();
        return NextResponse.json(customers);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error fetching customers" },
            { status: 500 }
        );
    }
}