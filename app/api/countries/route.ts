import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const countries = await prisma.countryMaster.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(countries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const country = await prisma.countryMaster.create({ data: body });
  return NextResponse.json(country, { status: 201 });
}