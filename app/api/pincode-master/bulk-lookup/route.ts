import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/pincode-master/bulk-lookup
// Body: { pincodes: ["110001", "400001", ...] }
// Returns: { "110001": { city: "NEW DELHI", cityCode: "NEWDE", state: "DELHI" }, ... }
export async function POST(req: NextRequest) {
    try {
        const { pincodes } = await req.json();

        if (!pincodes || !Array.isArray(pincodes) || pincodes.length === 0) {
            return NextResponse.json({ error: "Provide an array of pincodes" }, { status: 400 });
        }

        const results = await prisma.pincodeMaster.findMany({
            where: { pincode: { in: pincodes } },
            include: { state: true, city: true },
        });

        // Build a map: pincode → { city, cityCode, state }
        const map: Record<string, { city: string; cityCode: string; state: string }> = {};
        for (const r of results) {
            map[r.pincode] = {
                city: r.city?.name || "",
                cityCode: r.city?.code || "",
                state: r.state?.name || "",
            };
        }

        return NextResponse.json(map);
    } catch (error) {
        console.error("Bulk lookup error:", error);
        return NextResponse.json({ error: "Failed to lookup pincodes" }, { status: 500 });
    }
}