import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await prisma.smsApiSettings.findFirst();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Failed to fetch SMS API settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const settings = await prisma.smsApiSettings.upsert({
      where: { id: data.id ?? "singleton" },
      update: {
        apiPart1: data.apiPart1,
        apiPart2: data.apiPart2,
        apiPart3: data.apiPart3,
        companyName: data.companyName,
        phoneNo: data.phoneNo,
      },
      create: {
        apiPart1: data.apiPart1,
        apiPart2: data.apiPart2,
        apiPart3: data.apiPart3,
        companyName: data.companyName,
        phoneNo: data.phoneNo,
      },
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Failed to save SMS API settings" }, { status: 500 });
  }
}