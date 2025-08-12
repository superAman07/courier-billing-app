import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedTax = await prisma.taxMaster.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(updatedTax);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating tax" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.taxMaster.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error deleting tax" }, { status: 500 });
  }
}