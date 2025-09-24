import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json(
            { success: true, message: "Logged out successfully" },
            { status: 200 }
        );
        response.cookies.set("auth", "", {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: -1,
        });
        return response;
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Logout Failed" },
            { status: 500 }
        );
    }
}