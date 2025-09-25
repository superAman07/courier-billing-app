import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const calculateSlabRate = (weight: number, baseRate: number, baseWeight: number, additionalRate: number, additionalWeightIncrement: number) => {
    if (weight <= 0) return 0;
    if (weight <= baseWeight) return baseRate;
    
    const additionalWeight = weight - baseWeight;
    const additionalParcels = Math.ceil(additionalWeight / additionalWeightIncrement);
    return baseRate + (additionalParcels * additionalRate);
};

export async function POST(req: NextRequest) {
    try {
        const { customerId, destinationPincode, chargeWeight, isDox, mode, invoiceValue } = await req.json();

        if (!customerId || !destinationPincode || !chargeWeight || !mode) {
            return NextResponse.json({ error: "Missing required fields for rate calculation." }, { status: 400 });
        }

        const pincodeData = await prisma.pincodeMaster.findUnique({
            where: { pincode: destinationPincode },
            include: { state: true },
        });

        const sectorName = pincodeData?.state?.sector || "Rest of India";

        const sectorRate = await prisma.sectorRate.findUnique({
            where: { customerId_sectorName: { customerId, sectorName } },
        });

        if (!sectorRate) {
            return NextResponse.json({ error: `No rate card found for sector '${sectorName}' for this customer.` }, { status: 404 });
        }

        let frCharge = 0;
        const weightInKg = parseFloat(chargeWeight);

        if (mode === 'PREMIUM') {
            if (weightInKg <= 0.25) {
                frCharge = sectorRate.premiumUpto250g || 0;
            } else {
                frCharge = calculateSlabRate(weightInKg, sectorRate.premiumUpto500g || 0, 0.5, sectorRate.premiumAdd500g || 0, 0.5);
            }
        } else if (isDox) {
            if (weightInKg <= 0.25) {
                frCharge = sectorRate.doxUpto250g || 0;
            } else {
                frCharge = calculateSlabRate(weightInKg, sectorRate.doxUpto500g || 0, 0.5, sectorRate.doxAdd500g || 0, 0.5);
            }
        } else {
            if (mode === 'SURFACE') {
                const minWeight = sectorRate.bulkMinWeightSurface || 0;
                const rate = weightInKg <= 20 ? sectorRate.bulkRateSurfaceUpto20 : sectorRate.bulkRateSurfaceAbove20;
                const calculatedCharge = (rate || 0) * weightInKg;
                const minCharge = (rate || 0) * minWeight;
                frCharge = Math.max(calculatedCharge, minCharge);
            } else if (mode === 'AIR') {
                const minWeight = sectorRate.bulkMinWeightAir || 0;
                const rate = weightInKg <= 20 ? sectorRate.bulkRateAirUpto20 : sectorRate.bulkRateAirAbove20;
                const calculatedCharge = (rate || 0) * weightInKg;
                const minCharge = (rate || 0) * minWeight;
                frCharge = Math.max(calculatedCharge, minCharge);
            }
        }
        let riskSurcharge = 0;
        if (sectorRate.serviceProvider === 'DTDC' && invoiceValue > 5000) {
            riskSurcharge = parseFloat(invoiceValue) * 0.002;
        }
        
        return NextResponse.json({ frCharge, otherExp: riskSurcharge, calculatedSector: sectorName });

    } catch (error) {
        console.error("Rate calculation error:", error);
        return NextResponse.json({ error: "Failed to calculate rate." }, { status: 500 });
    }
}