import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const calculateSlabRate = (weight: number, rateUpto: number, rateAdd: number, slabWeight: number) => {
    if (weight <= 0) return 0;
    if (weight <= slabWeight) return rateUpto;
    const additionalWeight = weight - slabWeight;
    const additionalParcels = Math.ceil(additionalWeight / slabWeight);
    return rateUpto + (additionalParcels * rateAdd);
};

export async function POST(req: NextRequest) {
    try {
        const { customerId, destinationPincode, chargeWeight, isDox, invoiceValue } = await req.json();

        if (!customerId || !destinationPincode || !chargeWeight) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const pincodeData = await prisma.pincodeMaster.findUnique({
            where: { pincode: destinationPincode },
            include: { state: true },
        });

        if (!pincodeData?.state?.sector) {
            return NextResponse.json({ error: "Destination sector not found for the given pincode." }, { status: 404 });
        }
        const sectorName = pincodeData.state.sector;

        const sectorRate = await prisma.sectorRate.findUnique({
            where: { customerId_sectorName: { customerId, sectorName } },
        });

        if (!sectorRate) {
            return NextResponse.json({ error: `No rate found for sector '${sectorName}' for this customer.` }, { status: 404 });
        }

        let frCharge = 0;
        const weight = parseFloat(chargeWeight);

        if (isDox) {
            frCharge = calculateSlabRate(weight, sectorRate.doxUpto250g || 0, sectorRate.doxAdd250g || 0, 0.25);
        } else {
            const rate = weight <= 20 ? sectorRate.bulkRateSurfaceUpto20 : sectorRate.bulkRateSurfaceAbove20;
            frCharge = (rate || 0) * weight;
        }

        let riskSurcharge = 0;
        if (sectorRate.serviceProvider === 'DTDC' && invoiceValue > 5000) {
            riskSurcharge = (parseFloat(invoiceValue) * 0.002); // 0.2%
        }
        
        return NextResponse.json({ frCharge, otherExp: riskSurcharge });

    } catch (error) {
        console.error("Rate calculation error:", error);
        return NextResponse.json({ error: "Failed to calculate rate." }, { status: 500 });
    }
}