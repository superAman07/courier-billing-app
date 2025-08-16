import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    try {
        const data = await req.json();
        const updateData: any = {
            username: data.username,
            userType: data.userType,
            active: data.active,
        }; 
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        const user = await prisma.appUser.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(user);
    } catch {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    try {
        await prisma.appUser.delete({ where: { id } });
        return NextResponse.json({ message: "User deleted" });
    } catch {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}