import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const employees = await prisma.employeeMaster.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const employee = await prisma.employeeMaster.create({ data });
    return NextResponse.json(employee, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}