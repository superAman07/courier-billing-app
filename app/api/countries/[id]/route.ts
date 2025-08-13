import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json();
  const id = (await params).id;
  const updated = await prisma.countryMaster.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  await prisma.countryMaster.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}