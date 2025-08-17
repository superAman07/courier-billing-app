import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    const data = await req.json();
    const template = await prisma.smsTemplate.update({ where: { id }, data });
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    await prisma.smsTemplate.delete({ where: { id } });
    return NextResponse.json({ message: "Template deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}