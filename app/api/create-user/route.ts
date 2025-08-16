import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { username, password, userType, active = true } = data;
        const existingUser = await prisma.appUser.findUnique({ where: { username } });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }
        const passwordHash = await bcrypt.hash(password,10);
        const isAdminExists = await prisma.appUser.findFirst({ where: { userType: "ADMIN" } })
        if (!isAdminExists && userType !== "ADMIN") {
            return NextResponse.json({ error: "First user must be ADMIN" }, { status: 400 });
        }
        let finalUserType = userType;
        if (isAdminExists && finalUserType === "ADMIN") {
            return NextResponse.json({ error: "Admin already exists" }, { status: 400 });
        }
        if (isAdminExists && userType !== "ADMIN") {
            finalUserType = "USER";
        }
        const user = await prisma.appUser.create({
            data: {
                username,
                passwordHash,
                userType: finalUserType,
                active
            }
        })
        return NextResponse.json(user, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }
}
export async function GET() {
    try {
        const users = await prisma.appUser.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Failed to retrieve users" }, { status: 500 });
    }
}