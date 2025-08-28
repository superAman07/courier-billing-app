import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || "";
  const mode = searchParams.get("mode") || "";
  const consignmentType = searchParams.get("consignmentType") || "";
  const zoneId = searchParams.get("zoneId") || "";
  const stateId = searchParams.get("stateId") || "";
  const city = searchParams.get("city") ?? "";

  console.log("City:", city);

  if (!customerId || !mode || !consignmentType || !zoneId || !stateId || city === null) {
    return NextResponse.json({ message: "missing params" }, { status: 400 });
  }

  const slabs = await prisma.rateMaster.findMany({
    where: {
      customerId,
      mode,
      consignmentType,
      zoneId,
      stateId,
      city: { equals: city, mode: "insensitive" },
    },
    orderBy: [{ fromWeight: "asc" }],
  });

  console.log("Slabs fetched From API :", slabs);

  // const slabs = await prisma.rateMaster.findMany({
  //   where: { customerId, mode, consignmentType, zoneId, stateId, city },
  //   orderBy: [{ fromWeight: "asc" }],
  // });

  return NextResponse.json(slabs);
}