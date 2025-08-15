import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(){
    try{
        const items = await prisma.registrationDetails.findMany({
            orderBy: {
                createdAt: "desc"
            }
        })
        return NextResponse.json(items)
    }catch{
        return NextResponse.json({error: "Failed to fetch registration details"}, {status: 500})
    }
}

export async function POST(req: NextRequest){
    try{
        const data = await req.json();
        const items = await prisma.registrationDetails.create({
            data
        })
        return NextResponse.json(items,{status: 201})
    }catch{
        return NextResponse.json({error: "Failed to create registration details"}, {status: 500})
    }
}