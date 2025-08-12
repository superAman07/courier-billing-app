import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const taxes = await prisma.taxMaster.findMany({
      orderBy: { taxCode: "asc" }
    });
    return NextResponse.json(taxes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching taxes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTax = await prisma.taxMaster.create({
      data: {
        taxCode: body.taxCode,
        description: body.description,
        ratePercent: body.ratePercent,
        withinState: body.withinState,
        forOtherState: body.forOtherState,
        active: body.active,
      }
    });
    return NextResponse.json(newTax, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating tax" }, { status: 500 });
  }
}