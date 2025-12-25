import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const normalize = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

const STATIC_SECTOR_MAP: Record<string, string> = {
    "uttarpradesh": "UP",
    "uttarakhand": "UK",
    "delhi": "Delhi",
    "bihar": "Bihaar / Jharkhand",
    "jharkhand": "Bihaar / Jharkhand",
    "haryana": "North (Haryana / Punjaab / Rajasthaan)",
    "punjab": "North (Haryana / Punjaab / Rajasthaan)",
    "rajasthan": "North (Haryana / Punjaab / Rajasthaan)",
    "assam": "North East",
    "sikkim": "North East",
    "manipur": "North East",
    "meghalaya": "North East",
    "tripura": "North East",
    "mizoram": "North East",
    "nagaland": "North East",
    "arunachalpradesh": "North East",
};

const calculateSlabRate = (weight: number, baseRate: number, baseWeight: number, additionalRate: number, additionalWeightIncrement: number) => {
    if (weight <= 0) return 0;
    if (weight <= baseWeight) return baseRate;
    
    const additionalWeight = weight - baseWeight;
    const additionalParcels = Math.ceil(additionalWeight / additionalWeightIncrement);
    return baseRate + (additionalParcels * additionalRate);
};

export async function POST(req: NextRequest) {
    try {
        const { customerId, destinationPincode, chargeWeight, isDox, mode, invoiceValue, state } = await req.json();

        if (!customerId || !destinationPincode || !chargeWeight || !mode) {
            return NextResponse.json({ error: "Missing required fields for rate calculation." }, { status: 400 });
        }

        let sectorName = "Rest of India";
        const pincodeData = await prisma.pincodeMaster.findUnique({
            where: { pincode: destinationPincode },
            include: { state: true },
        });

        if (pincodeData?.state?.sector) {
            sectorName = pincodeData.state.sector;
        }
        else if (state) {
            const stateRecord = await prisma.stateMaster.findFirst({
                where: { name: { equals: state, mode: 'insensitive' } }
            });

            if (stateRecord?.sector) {
                sectorName = stateRecord.sector;
            } else {
                const normalizedState = normalize(state);
                if (STATIC_SECTOR_MAP[normalizedState]) {
                    sectorName = STATIC_SECTOR_MAP[normalizedState];
                }
            }
        }

        console.log(`Calculating rate for: ${destinationPincode} (${state}) -> Sector: ${sectorName}`);

        const sectorRate = await prisma.sectorRate.findUnique({
            where: { customerId_sectorName: { customerId, sectorName } },
        });

        if (!sectorRate) {
            return NextResponse.json({ 
                error: `No rate card found for sector '${sectorName}' (State: ${state || 'Unknown'}). Please add rates for this sector.` 
            }, { status: 404 });
        }

        let frCharge = 0;
        const weightInKg = parseFloat(chargeWeight);
        const roundedWeight = Math.ceil(weightInKg);

        if (mode === 'PREMIUM') {
            if (weightInKg <= 0.25) {
                frCharge = sectorRate.premiumUpto250g || 0;
            } else {
                frCharge = calculateSlabRate(weightInKg, sectorRate.premiumUpto500g || 0, 0.5, sectorRate.premiumAdd500g || 0, 0.5);
            }
        } else if (isDox) {
            if (weightInKg <= 0.1) {
                 frCharge = sectorRate.doxUpto100g || 0;
            } else if (weightInKg <= 0.25) {
                frCharge = sectorRate.doxUpto250g || 0;
            } else {
                frCharge = calculateSlabRate(weightInKg, sectorRate.doxUpto500g || 0, 0.5, sectorRate.doxAdd500g || 0, 0.5);
            }
        } else {
            if (mode === 'SURFACE') {
                const minWeight = sectorRate.bulkMinWeightSurface || 0;
                let rate = 0;
                if (weightInKg <= 10 && sectorRate.bulkRateSurfaceUpto10) {
                    rate = sectorRate.bulkRateSurfaceUpto10;
                } else if (weightInKg <= 15 && sectorRate.bulkRateSurfaceUpto15) {
                    rate = sectorRate.bulkRateSurfaceUpto15;
                } else if (weightInKg <= 20) {
                    rate = sectorRate.bulkRateSurfaceUpto20 || 0;
                } else {
                    rate = sectorRate.bulkRateSurfaceAbove20 || 0;
                }
                const chargeableWeight = Math.max(roundedWeight, minWeight);
                frCharge = rate * chargeableWeight;
            } else if (mode === 'AIR') {
                const minWeight = sectorRate.bulkMinWeightAir || 0;
                let rate = 0;
                if (weightInKg <= 10 && sectorRate.bulkRateAirUpto10) {
                    rate = sectorRate.bulkRateAirUpto10;
                } else if (weightInKg <= 15 && sectorRate.bulkRateAirUpto15) {
                    rate = sectorRate.bulkRateAirUpto15;
                } else if (weightInKg <= 20) {
                    rate = sectorRate.bulkRateAirUpto20 || 0;
                } else {
                    rate = sectorRate.bulkRateAirAbove20 || 0;
                }
                const chargeableWeight = Math.max(roundedWeight, minWeight);
                frCharge = rate * chargeableWeight;
            }
        }
        let waybillSurcharge = 0;
        const value = parseFloat(invoiceValue) || 0;

        if (sectorRate.serviceProvider === 'DTDC' && value > 49999) {
            waybillSurcharge = value * 0.002;
        }
        
        return NextResponse.json({ 
            frCharge, 
            waybillSurcharge, 
            otherExp: 0,
            calculatedSector: sectorName 
        });

    } catch (error) {
        console.error("Rate calculation error:", error);
        return NextResponse.json({ error: "Failed to calculate rate." }, { status: 500 });
    }
}