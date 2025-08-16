import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();
        const user = await prisma.appUser.findUnique({ where: { username } });
        if (!user || !user.active) {
            return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }
        const { passwordHash, ...userInfo } = user;
 
        const response = NextResponse.json(userInfo, { status: 200 });
        response.cookies.set("auth", JSON.stringify({
            id: user.id,
            username: user.username,
            userType: user.userType,
        }), {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            // secure: true, // enable in production
            maxAge: 60 * 60 * 8 
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}