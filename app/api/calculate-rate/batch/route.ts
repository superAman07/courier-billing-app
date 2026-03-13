import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const normalize = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

const STATIC_SECTOR_MAP: Record<string, string> = {
    "uttarpradesh": "UP", "uttarakhand": "UK", "delhi": "Delhi",
    "bihar": "Bihaar / Jharkhand", "jharkhand": "Bihaar / Jharkhand",
    "haryana": "North (Haryana / Punjaab / Rajasthaan)",
    "punjab": "North (Haryana / Punjaab / Rajasthaan)",
    "rajasthan": "North (Haryana / Punjaab / Rajasthaan)",
    "assam": "North East", "sikkim": "North East", "manipur": "North East",
    "meghalaya": "North East", "tripura": "North East", "mizoram": "North East",
    "nagaland": "North East", "arunachalpradesh": "North East",
    "mumbai": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "hyderabad": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "chennai": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "banglore": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "bangalore": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "bengaluru": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "kolkata": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "calcutta": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "darjeeling": "Special Sector ( Darjling, Silchaar, Daman)",
    "darjling": "Special Sector ( Darjling, Silchaar, Daman)",
    "silchar": "Special Sector ( Darjling, Silchaar, Daman)",
    "silchaar": "Special Sector ( Darjling, Silchaar, Daman)",
    "daman": "Special Sector ( Darjling, Silchaar, Daman)",
    "damananddiu": "Special Sector ( Darjling, Silchaar, Daman)",
};

const calculateSlabRate = (weight: number, baseRate: number, baseWeight: number, additionalRate: number, additionalWeightIncrement: number) => {
    if (weight <= 0) return 0;
    if (weight <= baseWeight) return baseRate;
    const additionalWeight = weight - baseWeight;
    const additionalParcels = Math.ceil(additionalWeight / additionalWeightIncrement);
    return baseRate + (additionalParcels * additionalRate);
};

function calculateSingleRate(sectorRate: any, weightInKg: number, isDox: boolean, mode: string, invoiceValue: number) {
    let frCharge = 0;
    const roundedWeight = Math.ceil(weightInKg);

    if (mode === 'PREMIUM') {
        if ((sectorRate.premiumAdd250g || 0) > 0) {
            frCharge = calculateSlabRate(weightInKg, sectorRate.premiumUpto250g || 0, 0.25, sectorRate.premiumAdd250g || 0, 0.25);
        } else if ((sectorRate.premiumAdd500g || 0) > 0) {
            if (weightInKg <= 0.25 && (sectorRate.premiumUpto250g || 0) > 0) {
                frCharge = sectorRate.premiumUpto250g || 0;
            } else {
                frCharge = calculateSlabRate(weightInKg, sectorRate.premiumUpto500g || 0, 0.5, sectorRate.premiumAdd500g || 0, 0.5);
            }
        } else {
            if (weightInKg <= 0.25) frCharge = sectorRate.premiumUpto250g || 0;
            if (frCharge === 0) frCharge = sectorRate.premiumUpto500g || 0;
        }
    } else if (isDox) {
        if (weightInKg <= 0.1 && (sectorRate.doxUpto100g || 0) > 0) {
            frCharge = sectorRate.doxUpto100g || 0;
        } else if ((sectorRate.doxAdd250g || 0) > 0) {
            frCharge = calculateSlabRate(weightInKg, sectorRate.doxUpto250g || 0, 0.25, sectorRate.doxAdd250g || 0, 0.25);
        } else {
            if (weightInKg <= 0.25 && (sectorRate.doxUpto250g || 0) > 0) {
                frCharge = sectorRate.doxUpto250g || 0;
            } else {
                frCharge = calculateSlabRate(weightInKg, sectorRate.doxUpto500g || 0, 0.5, sectorRate.doxAdd500g || 0, 0.5);
            }
        }
    } else {
        if (mode === 'SURFACE') {
            const minWeight = sectorRate.bulkMinWeightSurface || 0;
            let rate = 0;
            if (weightInKg <= 10 && sectorRate.bulkRateSurfaceUpto10) rate = sectorRate.bulkRateSurfaceUpto10;
            else if (weightInKg <= 15 && sectorRate.bulkRateSurfaceUpto15) rate = sectorRate.bulkRateSurfaceUpto15;
            else if (weightInKg <= 20) rate = sectorRate.bulkRateSurfaceUpto20 || 0;
            else rate = sectorRate.bulkRateSurfaceAbove20 || 0;
            frCharge = rate * Math.max(roundedWeight, minWeight);
        } else if (mode === 'AIR') {
            const minWeight = sectorRate.bulkMinWeightAir || 0;
            let rate = 0;
            if (weightInKg <= 10 && sectorRate.bulkRateAirUpto10) rate = sectorRate.bulkRateAirUpto10;
            else if (weightInKg <= 15 && sectorRate.bulkRateAirUpto15) rate = sectorRate.bulkRateAirUpto15;
            else if (weightInKg <= 20) rate = sectorRate.bulkRateAirUpto20 || 0;
            else rate = sectorRate.bulkRateAirAbove20 || 0;
            frCharge = rate * Math.max(roundedWeight, minWeight);
        }
    }

    let waybillSurcharge = 0;
    const value = Number(invoiceValue) || 0;
    if (sectorRate.serviceProvider === 'DTDC' && value > 49999) {
        waybillSurcharge = value * 0.002;
    }

    return { frCharge, waybillSurcharge, otherExp: 0, serviceProvider: sectorRate.serviceProvider };
}

export async function POST(req: NextRequest) {
    try {
        const { items } = await req.json();
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Items array is required" }, { status: 400 });
        }

        const results = await Promise.all(items.map(async (item: any, index: number) => {
            try {
                const { customerId, destinationPincode, chargeWeight, isDox, mode, invoiceValue, state, city } = item;
                if (!customerId || !destinationPincode || !chargeWeight || !mode) {
                    return { index, error: "Missing required fields", success: false };
                }

                // Resolve sector (same logic as single calculate-rate)
                let sectorName = "Rest of India";
                const pincodeData = await prisma.pincodeMaster.findUnique({
                    where: { pincode: destinationPincode },
                    include: { state: true, city: true },
                });

                const resolvedCityName = pincodeData?.city?.name || city || "";
                let cityMatched = false;

                if (resolvedCityName) {
                    const normalizedCity = normalize(resolvedCityName);
                    if (STATIC_SECTOR_MAP[normalizedCity]) {
                        sectorName = STATIC_SECTOR_MAP[normalizedCity];
                        cityMatched = true;
                    } else {
                        const specialKeywords = ["darjling", "darjeeling", "silchar", "silchaar", "daman"];
                        if (specialKeywords.some(k => normalizedCity.includes(k))) {
                            sectorName = "Special Sector ( Darjling, Silchaar, Daman)";
                            cityMatched = true;
                        } else {
                            const metroKeywords = ["bangalore", "bengaluru", "banglore", "mumbai", "bombay", "hyderabad", "secunderabad", "chennai", "madras", "kolkata", "calcutta"];
                            if (metroKeywords.some(k => normalizedCity.includes(k))) {
                                sectorName = "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)";
                                cityMatched = true;
                            }
                        }
                    }
                }

                if (!cityMatched) {
                    if (pincodeData?.state?.sector) {
                        sectorName = pincodeData.state.sector;
                    } else if (state) {
                        const normalizedInput = normalize(state);
                        if (STATIC_SECTOR_MAP[normalizedInput]) {
                            sectorName = STATIC_SECTOR_MAP[normalizedInput];
                        } else {
                            const stateRecord = await prisma.stateMaster.findFirst({
                                where: { name: { equals: state, mode: 'insensitive' } }
                            });
                            if (stateRecord?.sector) sectorName = stateRecord.sector;
                        }
                    }
                }

                const sectorRate = await prisma.sectorRate.findUnique({
                    where: { customerId_sectorName: { customerId, sectorName } },
                });

                if (!sectorRate) {
                    return { index, error: `No rate for sector: ${sectorName}`, success: false };
                }

                const result = calculateSingleRate(sectorRate, parseFloat(chargeWeight), isDox, mode, invoiceValue);
                return { index, success: true, ...result };
            } catch (err) {
                return { index, error: "Calculation failed", success: false };
            }
        }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Batch rate calculation error:", error);
        return NextResponse.json({ error: "Batch calculation failed" }, { status: 500 });
    }
}