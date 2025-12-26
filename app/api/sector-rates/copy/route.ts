import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { customerId, sourceSector, targetSectors } = await req.json();

        if (!customerId || !sourceSector || !targetSectors || !Array.isArray(targetSectors)) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        // 1. Get Source Rate
        const sourceRate = await prisma.sectorRate.findUnique({
            where: {
                customerId_sectorName: {
                    customerId,
                    sectorName: sourceSector
                }
            }
        });

        if (!sourceRate) {
            return NextResponse.json({ error: "Source sector rate not found" }, { status: 404 });
        }

        // 2. Prepare data (exclude ID, sectorName, dates)
        const { id, sectorName, createdAt, updatedAt, ...rateData } = sourceRate;

        // 3. Transaction to upsert all targets
        const operations = targetSectors.map((targetSector: string) => 
            prisma.sectorRate.upsert({
                where: {
                    customerId_sectorName: {
                        customerId,
                        sectorName: targetSector
                    }
                },
                update: { ...rateData },
                create: {
                    ...rateData,
                    customerId,
                    sectorName: targetSector
                }
            })
        );

        await prisma.$transaction(operations);

        return NextResponse.json({ message: "Rates copied successfully" });

    } catch (error) {
        console.error("Copy sector rates error:", error);
        return NextResponse.json({ error: "Failed to copy rates" }, { status: 500 });
    }
}