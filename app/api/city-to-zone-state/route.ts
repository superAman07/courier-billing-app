import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    if (!city) {
        return NextResponse.json({ message: "city is required" }, { status: 400 });
    }
    console.log("City from Smart Booking page is: ", city)
    const cityRecord = await prisma.cityMaster.findFirst({
        where: { name: { equals: city, mode: "insensitive" } }, // Case-insensitive match
        include: { state: { include: { zone: true } } }
    });
    console.log("cityRecord", cityRecord);
    if (!cityRecord) {
        return NextResponse.json({ message: "City not found" }, { status: 404 });
    }
    return NextResponse.json({
        cityId: cityRecord.id,
        stateId: cityRecord.stateId,
        zoneId: cityRecord.state.zoneId,
        stateName: cityRecord.state.name,
        zoneName: cityRecord.state.zone.name,
    });
}