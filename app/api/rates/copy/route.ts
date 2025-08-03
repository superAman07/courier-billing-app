import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
    try {

        const {targetCustomerId, rateIds} = await req.json();
        if(!targetCustomerId || !rateIds || !Array.isArray(rateIds)) {
            return NextResponse.json({error: "Invalid input"}, {status: 400});
        }
        const ratesToCopy = await prisma.rateMaster.findMany({
            where: {
                id: {
                    in: rateIds
                }
            }
        });
        if (ratesToCopy.length === 0) {
            return NextResponse.json({error: "No rates found to copy"}, {status: 404});
        }
        const newRatesData = ratesToCopy.map(rate => {
            const {id,customerId,createdAt, updatedAt, ...restOfRate} = rate;
            return {
                ...restOfRate,
                customerId: targetCustomerId,
            }
        })
        const response = await prisma.rateMaster.createMany({
            data: newRatesData
        });
        return NextResponse.json({message: "Rates copied successfully", count: response.count}, {status: 200});
    }catch (error) {
        console.error("Error copying rates:", error);
        return NextResponse.json({error: "Failed to copy rates"}, {status: 500});
    }
}