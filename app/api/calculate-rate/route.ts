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
    "mumbai": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "hyderabad": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "chennai": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "banglore": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)", // As per image
    "bangalore": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)", // Common spelling
    "bengaluru": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)", // Official spelling
    "kolkata": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "calcutta": "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
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
        const { customerId, destinationPincode, chargeWeight, isDox, mode, invoiceValue, state, city } = await req.json();

        if (!customerId || !destinationPincode || !chargeWeight || !mode) {
            return NextResponse.json({ error: "Missing required fields for rate calculation." }, { status: 400 });
        }

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
            }
            else {
                const metroKeywords = [
                    "bangalore", "bengaluru", "banglore", 
                    "mumbai", "bombay",
                    "hyderabad", "secunderabad",
                    "chennai", "madras", 
                    "kolkata", "calcutta"
                ];
                
                if (metroKeywords.some(keyword => normalizedCity.includes(keyword))) {
                    sectorName = "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)";
                    cityMatched = true;
                }
            }
        }

        // 3. Fallback to STATE Logic (Only if City didn't match a sector)
        if (!cityMatched) {
            if (pincodeData?.state?.sector) {
                sectorName = pincodeData.state.sector;
            }
            else if (state) {
                // Check if the passed 'state' string is actually a mapped key (could be a state or city name passed loosely)
                const normalizedInput = normalize(state);
                
                if (STATIC_SECTOR_MAP[normalizedInput]) {
                    sectorName = STATIC_SECTOR_MAP[normalizedInput];
                } else {
                    // DB State lookup
                    const stateRecord = await prisma.stateMaster.findFirst({
                        where: { name: { equals: state, mode: 'insensitive' } }
                    });
    
                    if (stateRecord?.sector) {
                        sectorName = stateRecord.sector;
                    }
                }
            }
        }

        console.log(`Calculating rate for: ${destinationPincode} (City: ${pincodeData?.city?.name}, State: ${pincodeData?.state?.name || state}) -> Sector: ${sectorName}`);

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
            // if (weightInKg <= 0.25) {
            //     const rate250 = sectorRate.premiumUpto250g || 0;
            //     const rate500 = sectorRate.premiumUpto500g || 0;
            //     frCharge = rate250 > 0 ? rate250 : rate500;
            // } else {
            //     frCharge = calculateSlabRate(weightInKg, sectorRate.premiumUpto500g || 0, 0.5, sectorRate.premiumAdd500g || 0, 0.5);
            // }
            if ((sectorRate.premiumAdd250g || 0) > 0) {
                frCharge = calculateSlabRate(
                    weightInKg, 
                    sectorRate.premiumUpto250g || 0, // Base Rate (e.g. 125)
                    0.25,                            // Base Weight (250g)
                    sectorRate.premiumAdd250g || 0,  // Add Rate (e.g. 40)
                    0.25                             // Add Weight Increment (250g)
                );
            } 
            // Fallback: Check if "Add 500g" rate exists. Use 500g Slab Logic
            else if ((sectorRate.premiumAdd500g || 0) > 0) {
                 // Handle specific small weight case for 500g slab users who have a specific 250g price
                 if (weightInKg <= 0.25 && (sectorRate.premiumUpto250g || 0) > 0) {
                    frCharge = sectorRate.premiumUpto250g || 0;
                 } else {
                    frCharge = calculateSlabRate(
                        weightInKg, 
                        sectorRate.premiumUpto500g || 0, 
                        0.5, 
                        sectorRate.premiumAdd500g || 0, 
                        0.5
                    );
                 }
            }
            // Fallback for flat rates or incomplete data (Use Upto 250 if tiny weight, else Upto 500)
            else {
                 if (weightInKg <= 0.25) frCharge = sectorRate.premiumUpto250g || 0;
                 if (frCharge === 0) frCharge = sectorRate.premiumUpto500g || 0;
            }
        } else if (isDox) {
            // if (weightInKg <= 0.1) {
            //      const rate100 = sectorRate.doxUpto100g || 0;
            //      const rate250 = sectorRate.doxUpto250g || 0;
            //      const rate500 = sectorRate.doxUpto500g || 0;

            //      if (rate100 > 0) frCharge = rate100;
            //      else if (rate250 > 0) frCharge = rate250;
            //      else frCharge = rate500;
            // } else if (weightInKg <= 0.25) {
            //     const rate250 = sectorRate.doxUpto250g || 0;
            //     const rate500 = sectorRate.doxUpto500g || 0;
                
            //     frCharge = rate250 > 0 ? rate250 : rate500;
            // } else {
            //     frCharge = calculateSlabRate(weightInKg, sectorRate.doxUpto500g || 0, 0.5, sectorRate.doxAdd500g || 0, 0.5);
            // }
            if (weightInKg <= 0.1 && (sectorRate.doxUpto100g || 0) > 0) {
                 frCharge = sectorRate.doxUpto100g || 0;
            } 
            // FIX: Check "Add 250g" rate availability for Dox logic priority
            else if ((sectorRate.doxAdd250g || 0) > 0) {
                 frCharge = calculateSlabRate(
                    weightInKg, 
                    sectorRate.doxUpto250g || 0, 
                    0.25, 
                    sectorRate.doxAdd250g || 0, 
                    0.25
                );
            }
            // Fallback to 500g logic
            else {
                // Handle small weights explicitly if using 500g structure
                if (weightInKg <= 0.25 && (sectorRate.doxUpto250g || 0) > 0) {
                    frCharge = sectorRate.doxUpto250g || 0;
                } else {
                    frCharge = calculateSlabRate(
                        weightInKg, 
                        sectorRate.doxUpto500g || 0, 
                        0.5, 
                        sectorRate.doxAdd500g || 0, 
                        0.5
                    );
                }
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
            calculatedSector: sectorName,
            serviceProvider: sectorRate.serviceProvider
        });

    } catch (error) {
        console.error("Rate calculation error:", error);
        return NextResponse.json({ error: "Failed to calculate rate." }, { status: 500 });
    }
}