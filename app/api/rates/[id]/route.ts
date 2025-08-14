import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    if (!body.zoneId || !body.stateId) {
      return NextResponse.json({ message: "zoneId and stateId are required" }, { status: 400 });
    }
    if (!body.hasAdditionalRate) {
      body.additionalWeight = null;
      body.additionalRate = null;
    }
    const { zoneId, stateId, customerId, ...rest } = body;
    const updatedRate = await prisma.rateMaster.update({
      where: { id: (await params).id },
      data: {
        ...rest,
        zone: { connect: { id: zoneId } },
        state: { connect: { id: stateId } },
        customer: { connect: { id: customerId } },
      },
      include: {
        zone: true,
        state: true
      }
    });
    return NextResponse.json(updatedRate);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error updating rate" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await prisma.rateMaster.delete({
      where: { id: (await params).id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting rate" },
      { status: 500 }
    );
  }
}