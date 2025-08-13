import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.customerId) {
      return NextResponse.json(
        { message: "Customer ID is required" },
        { status: 400 }
      );
    }
    const newRate = await prisma.rateMaster.create({
      data: {
        ...body,
      },include: {
        zone: true,
        state: true,
      }
    });
    return NextResponse.json(newRate, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating rate" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json(
      { message: "A customerId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const rates = await prisma.rateMaster.findMany({
      where: { customerId: customerId },
      orderBy: { fromWeight: 'asc' },
      include: { zone: true, state: true },
    });
    return NextResponse.json(rates);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching rates" },
      { status: 500 }
    );
  }
}