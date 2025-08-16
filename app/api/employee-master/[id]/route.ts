import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    const employee = await prisma.employeeMaster.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const data = await req.json();
  try {
    const employee = await prisma.employeeMaster.update({ where: { id }, data });
    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    await prisma.employeeMaster.delete({ where: { id } });
    return NextResponse.json({ message: "Employee deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}