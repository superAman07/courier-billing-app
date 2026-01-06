import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        let settings = await prisma.employeeSettings.findUnique({ where: { id: "global" } });
        if (!settings) {
            settings = await prisma.employeeSettings.create({ data: { id: "global", ratePerKm: 0 } });
        }
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { ratePerKm } = await req.json();
        const settings = await prisma.employeeSettings.upsert({
            where: { id: "global" },
            update: { ratePerKm: parseFloat(ratePerKm) },
            create: { id: "global", ratePerKm: parseFloat(ratePerKm) }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}