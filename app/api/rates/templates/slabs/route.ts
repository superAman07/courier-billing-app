import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || "";
  const mode = searchParams.get("mode") || "";
  const consignmentType = searchParams.get("consignmentType") || "";
  const zone = searchParams.get("zone") || "";
  const state = searchParams.get("state") || "";
  const city = searchParams.get("city") ?? "";

  if (!customerId || !mode || !consignmentType || !zone || !state || city === null) {
    return NextResponse.json({ message: "missing params" }, { status: 400 });
  }

  const slabs = await prisma.rateMaster.findMany({
    where: { customerId, mode, consignmentType, zone, state, city },
    orderBy: [{ fromWeight: "asc" }],
  });

  return NextResponse.json(slabs);
}