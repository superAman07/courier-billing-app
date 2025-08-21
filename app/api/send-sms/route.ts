import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json(); 
  console.log("Simulated SMS sent to:", data.mobile, "for consignment:", data.consignmentNo);
  return NextResponse.json({ message: "SMS sent (simulated)" });
}