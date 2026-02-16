import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT: Update a sector
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const id = (await params).id;

        // Don't allow changing the name if SectorRate records reference the old name
        const existing = await prisma.sectorMaster.findUnique({ where: { id } });
        if (existing && body.name && body.name !== existing.name) {
            const usageCount = await prisma.sectorRate.count({
                where: { sectorName: existing.name }
            });
            if (usageCount > 0) {
                return NextResponse.json(
                    { error: `Cannot rename: ${usageCount} rate record(s) reference "${existing.name}". Update those rates first.` },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.sectorMaster.update({
            where: { id },
            data: {
                code: body.code?.toUpperCase(),
                name: body.name,
                active: body.active,
            },
        });
        return NextResponse.json(updated, { status: 200 });
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: "Sector code or name already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to update sector" }, { status: 500 });
    }
}

// DELETE: Delete a sector (with protection)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;

        // 🛡️ SAFETY: Check if any SectorRate or StateMaster references this sector
        const sector = await prisma.sectorMaster.findUnique({ where: { id } });
        if (!sector) {
            return NextResponse.json({ error: "Sector not found" }, { status: 404 });
        }

        const rateUsage = await prisma.sectorRate.count({
            where: { sectorName: sector.name }
        });
        const stateUsage = await prisma.stateMaster.count({
            where: { sector: sector.name }
        });

        if (rateUsage > 0 || stateUsage > 0) {
            return NextResponse.json(
                { error: `Cannot delete "${sector.name}": used by ${rateUsage} rate record(s) and ${stateUsage} state(s). Remove those references first.` },
                { status: 409 }
            );
        }

        const deleted = await prisma.sectorMaster.delete({ where: { id } });
        return NextResponse.json(deleted, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete sector" }, { status: 500 });
    }
}