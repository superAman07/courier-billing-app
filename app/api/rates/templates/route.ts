import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ message: "customerId is required" }, { status: 400 });
  }

  const mode = searchParams.get("mode") || "ALL";
  const consignmentType = searchParams.get("consignmentType") || "ALL";
  const zone = searchParams.get("zone") || "ALL";
  const state = searchParams.get("state") || "ALL";
  const city = (searchParams.get("city") || "").trim();

  const where: any = {
    customerId,
    ...(mode !== "ALL" ? { mode } : {}),
    ...(consignmentType !== "ALL" ? { consignmentType } : {}),
    ...(zone !== "ALL" ? { zone } : {}),
    ...(state !== "ALL" ? { state } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
  };

  const groups = await prisma.rateMaster.groupBy({
    by: ["mode", "consignmentType", "zoneId", "stateId", "city"],
    where,
    _count: { _all: true },
  });

  // optional: stable sort
  groups.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  return NextResponse.json(groups);
}