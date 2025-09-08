import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET({ params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const items = await prisma.registrationDetails.findUnique({
            where: {
                id
            }
        })
        if(!items) {
            return NextResponse.json({ error: "Registration details not found" }, { status: 404 })
        }
        return NextResponse.json(items)
    } catch {
        return NextResponse.json({ error: "Failed to fetch registration details" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, {params}: {params: Promise<{id:string}>}){
    try{
        const id = (await params).id;
        const data = await req.json();
        const items = await prisma.registrationDetails.update({
            where: {id},
            data
        })
        return NextResponse.json(items);
    }catch{
        return NextResponse.json({ error: "Failed to update registration details" }, { status: 500 })
    }
}

export async function DELETE({params}:{ params: Promise<{id:string}>}){
    try{
        const id = (await params).id;
        const items = await prisma.registrationDetails.delete({
            where: {id}
        }) 
        return NextResponse.json(items);
    }catch{
        return NextResponse.json({ error: "Failed to delete registration details" }, { status: 500 })
    }
}