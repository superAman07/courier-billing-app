import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: {params: Promise<{ id: string }>}) {
  try {
    const customer = await prisma.customerMaster.findUnique({
      where: { id: (await params).id },
    });
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching customer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: {params: Promise<{id: string}>}) {
  try {
    const body = await request.json();
    const updatedCustomer = await prisma.customerMaster.update({
      where: { id: (await params).id },
      data: body,
    });
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error updating customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: {params: Promise<{id: string}>}) {
  try {
    await prisma.customerMaster.delete({
      where: { id: (await params).id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting customer" },
      { status: 500 }
    );
  }
}