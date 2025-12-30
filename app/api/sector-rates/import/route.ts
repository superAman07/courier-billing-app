import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from 'xlsx';

const VALID_SECTORS = [
    "Local", "UP", "UK", "Delhi", "Bihaar / Jharkhand",
    "North (Haryana / Punjaab / Rajasthaan)",
    "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "Rest of India", "North East", "Special Sector ( Darjling, Silchaar, Daman)"
];

const normalizeSector = (input: string): string | null => {
    if (!input) return null;    
    const trimmed = input.trim();
    const exactMatch = VALID_SECTORS.find(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exactMatch) return exactMatch;
    
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedInput = normalize(trimmed);
    
    const fuzzyMatch = VALID_SECTORS.find(s => normalize(s) === normalizedInput);
    return fuzzyMatch || null;
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
            return NextResponse.json({ error: "File is empty" }, { status: 400 });
        }

        let successCount = 0;
        const errors: Array<{ row: number; customer?: string; sector?: string; reason: string }> = [];

        const customerCodes = [...new Set(rows.map(r => r["Customer Code"]?.toString().trim()).filter(Boolean))];
        
        const customers = await prisma.customerMaster.findMany({
            where: { customerCode: { in: customerCodes as string[] } },
            select: { id: true, customerCode: true }
        });

        const customerMap = new Map(customers.map(c => [c.customerCode, c.id]));

        for (const [index, row] of rows.entries()) {
            const rowNum = index + 2; 
            const code = row["Customer Code"]?.toString().trim();
            const rawSector = row["Sector Name"]?.toString().trim();

            if (!code) {
                errors.push({ row: rowNum, reason: "Missing Customer Code" });
                continue;
            }
            if (!rawSector) {
                errors.push({ row: rowNum, customer: code, reason: "Missing Sector Name" });
                continue;
            }

            const normalizedSector = normalizeSector(rawSector);
            if (!normalizedSector) {
                errors.push({ 
                    row: rowNum, 
                    customer: code, 
                    sector: rawSector, 
                    reason: `Invalid sector: "${rawSector}". Check "Valid Sectors" sheet in sample file.` 
                });
                continue;
            }

            const customerId = customerMap.get(code);
            if (!customerId) {
                errors.push({ row: rowNum, customer: code, sector, reason: `Customer Code '${code}' not found in DB` });
                continue;
            }

            const val = (key: string) => {
                const v = parseFloat(row[key]);
                return isNaN(v) ? null : v;
            };

            try {
                await prisma.sectorRate.upsert({
                    where: {
                        customerId_sectorName: {
                            customerId: customerId,
                            sectorName: normalizedSector
                        }
                    },
                    update: {
                        serviceProvider: row["Service Provider"] || "DTDC",
                        bulkMinWeightSurface: val("Min Wt Surface"),
                        bulkRateSurfaceUpto10: val("Surf < 10kg"),
                        bulkRateSurfaceUpto15: val("Surf < 15kg"),
                        bulkRateSurfaceUpto20: val("Surf < 20kg"),
                        bulkRateSurfaceAbove20: val("Surf > 20kg"),
                        
                        bulkMinWeightAir: val("Min Wt Air"),
                        bulkRateAirUpto10: val("Air < 10kg"),
                        bulkRateAirUpto15: val("Air < 15kg"),
                        bulkRateAirUpto20: val("Air < 20kg"),
                        bulkRateAirAbove20: val("Air > 20kg"),

                        doxUpto100g: val("Dox < 100g"),
                        doxUpto250g: val("Dox < 250g"),
                        doxAdd250g: val("Dox Add 250g"),
                        doxUpto500g: val("Dox < 500g"),
                        doxAdd500g: val("Dox Add 500g"),

                        premiumUpto250g: val("Prem < 250g"),
                        premiumAdd250g: val("Prem Add 250g"),
                        premiumUpto500g: val("Prem < 500g"),
                        premiumAdd500g: val("Prem Add 500g"),
                    },
                    create: {
                        customerId: customerId,
                        sectorName: sector,
                        serviceProvider: row["Service Provider"] || "DTDC",
                        bulkMinWeightSurface: val("Min Wt Surface"),
                        bulkRateSurfaceUpto10: val("Surf < 10kg"),
                        bulkRateSurfaceUpto15: val("Surf < 15kg"),
                        bulkRateSurfaceUpto20: val("Surf < 20kg"),
                        bulkRateSurfaceAbove20: val("Surf > 20kg"),
                        
                        bulkMinWeightAir: val("Min Wt Air"),
                        bulkRateAirUpto10: val("Air < 10kg"),
                        bulkRateAirUpto15: val("Air < 15kg"),
                        bulkRateAirUpto20: val("Air < 20kg"),
                        bulkRateAirAbove20: val("Air > 20kg"),

                        doxUpto100g: val("Dox < 100g"),
                        doxUpto250g: val("Dox < 250g"),
                        doxAdd250g: val("Dox Add 250g"),
                        doxUpto500g: val("Dox < 500g"),
                        doxAdd500g: val("Dox Add 500g"),

                        premiumUpto250g: val("Prem < 250g"),
                        premiumAdd250g: val("Prem Add 250g"),
                        premiumUpto500g: val("Prem < 500g"),
                        premiumAdd500g: val("Prem Add 500g"),
                    }
                });
                successCount++;
            } catch (e) {
                console.error("Error upserting rate:", e);
                errors.push({ row: rowNum, customer: code, sector, reason: "Database error" });
            }
        }

        return NextResponse.json({ 
            message: "Import completed", 
            successCount, 
            errorCount: errors.length,
            errors 
        });

    } catch (error) {
        console.error("Import failed:", error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}