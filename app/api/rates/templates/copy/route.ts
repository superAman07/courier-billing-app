import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Combo = {
  mode: string;
  consignmentType: string;
  zoneId: string;
  stateId: string;
  city: string;
};

export async function POST(request: Request) {
  try {
    const { sourceCustomerId, targetCustomerId, combos, overwrite } = await request.json() as {
      sourceCustomerId: string;
      targetCustomerId: string;
      combos: Combo[];
      overwrite?: boolean;
    };

    if (!sourceCustomerId || !targetCustomerId || !Array.isArray(combos) || combos.length === 0) {
      return NextResponse.json({ message: "invalid input" }, { status: 400 });
    }

    let total = 0;

    for (const c of combos) {
      const sourceWhere = {
        customerId: sourceCustomerId,
        mode: c.mode,
        consignmentType: c.consignmentType,
        zoneId: c.zoneId,
        stateId: c.stateId,
        city: c.city,
      };

      const slabs = await prisma.rateMaster.findMany({ where: sourceWhere });
      if (slabs.length === 0) continue;

      if (overwrite) {
        await prisma.rateMaster.deleteMany({
          where: {
            customerId: targetCustomerId,
            mode: c.mode,
            consignmentType: c.consignmentType,
            zoneId: c.zoneId,
            stateId: c.stateId,
            city: c.city,
          },
        });
      }

      const data = slabs.map(({ id, customerId, createdAt, updatedAt, ...rest }) => ({
        ...rest,
        customerId: targetCustomerId,
      }));

      const result = await prisma.rateMaster.createMany({ data });
      total += result.count;
    }

    return NextResponse.json({ message: "Copied", count: total }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "copy failed" }, { status: 500 });
  }
}