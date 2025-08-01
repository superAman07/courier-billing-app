import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
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