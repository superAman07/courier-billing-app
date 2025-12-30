import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

const SECTORS = [
    "Local", "UP", "UK", "Delhi", "Bihaar / Jharkhand",
    "North (Haryana / Punjaab / Rajasthaan)",
    "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "Rest of India", "North East", "Special Sector ( Darjling, Silchaar, Daman)"
];

export async function GET() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sector Rates Import");

    // Define columns matching the SectorRate model
    worksheet.columns = [
        { header: "Customer Code", key: "customerCode", width: 15 },
        { header: "Sector Name", key: "sectorName", width: 20 },
        { header: "Service Provider", key: "serviceProvider", width: 15 },
        
        // Surface Bulk
        { header: "Min Wt Surface", key: "bulkMinWeightSurface", width: 15 },
        { header: "Surf < 10kg", key: "bulkRateSurfaceUpto10", width: 12 },
        { header: "Surf < 15kg", key: "bulkRateSurfaceUpto15", width: 12 },
        { header: "Surf < 20kg", key: "bulkRateSurfaceUpto20", width: 12 },
        { header: "Surf > 20kg", key: "bulkRateSurfaceAbove20", width: 12 },

        // Air Bulk
        { header: "Min Wt Air", key: "bulkMinWeightAir", width: 15 },
        { header: "Air < 10kg", key: "bulkRateAirUpto10", width: 12 },
        { header: "Air < 15kg", key: "bulkRateAirUpto15", width: 12 },
        { header: "Air < 20kg", key: "bulkRateAirUpto20", width: 12 },
        { header: "Air > 20kg", key: "bulkRateAirAbove20", width: 12 },

        // Dox
        { header: "Dox < 100g", key: "doxUpto100g", width: 12 },
        { header: "Dox < 250g", key: "doxUpto250g", width: 12 },
        { header: "Dox Add 250g", key: "doxAdd250g", width: 12 },
        { header: "Dox < 500g", key: "doxUpto500g", width: 12 },
        { header: "Dox Add 500g", key: "doxAdd500g", width: 12 },

        // Premium
        { header: "Prem < 250g", key: "premiumUpto250g", width: 12 },
        { header: "Prem Add 250g", key: "premiumAdd250g", width: 12 },
        { header: "Prem < 500g", key: "premiumUpto500g", width: 12 },
        { header: "Prem Add 500g", key: "premiumAdd500g", width: 12 },
    ];

    // Style the header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F46E5" } // Indigo color
    };

    // Add a sample row
    worksheet.addRow({
        customerCode: "CUST001",
        sectorName: "Delhi",
        serviceProvider: "DTDC",
        bulkMinWeightSurface: 5,
        bulkRateSurfaceUpto10: 10,
        bulkRateSurfaceUpto15: 9,
        bulkRateSurfaceUpto20: 8,
        bulkRateSurfaceAbove20: 7,
        bulkMinWeightAir: 2,
        bulkRateAirUpto10: 50,
        doxUpto100g: 40,
        premiumUpto250g: 100
    });

    const sectorSheet = workbook.addWorksheet("Valid Sectors");
    sectorSheet.columns = [{ header: "Allowed Sector Names", key: "sector", width: 50 }];
    const sectorHeaderRow = sectorSheet.getRow(1);
    sectorHeaderRow.font = { bold: true, color: { argb: "FFFFFF" } };
    sectorHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "22C55E" }
    };

    SECTORS.forEach(sector => {
        sectorSheet.addRow({ sector });
    });

    const buf = await workbook.xlsx.writeBuffer();

    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="Sector_Rates_Sample.xlsx"`,
        },
    });
}