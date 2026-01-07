import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Fetch all sector rates with customer info
        const rates = await prisma.sectorRate.findMany({
            include: {
                customer: {
                    select: {
                        customerCode: true,
                        customerName: true
                    }
                }
            },
            orderBy: [
                { customer: { customerName: 'asc' } },
                { sectorName: 'asc' }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("All Sector Rates");

        // Define columns
        worksheet.columns = [
            { header: "Customer Code", key: "customerCode", width: 15 },
            { header: "Customer Name", key: "customerName", width: 30 },
            { header: "Sector Name", key: "sectorName", width: 30 },
            { header: "Service Provider", key: "serviceProvider", width: 15 },
            { header: "Min Wt Surface", key: "bulkMinWeightSurface", width: 12 },
            { header: "Surf < 10kg", key: "bulkRateSurfaceUpto10", width: 12 },
            { header: "Surf < 15kg", key: "bulkRateSurfaceUpto15", width: 12 },
            { header: "Surf < 20kg", key: "bulkRateSurfaceUpto20", width: 12 },
            { header: "Surf > 20kg", key: "bulkRateSurfaceAbove20", width: 12 },
            { header: "Min Wt Air", key: "bulkMinWeightAir", width: 12 },
            { header: "Air < 10kg", key: "bulkRateAirUpto10", width: 12 },
            { header: "Air < 15kg", key: "bulkRateAirUpto15", width: 12 },
            { header: "Air < 20kg", key: "bulkRateAirUpto20", width: 12 },
            { header: "Air > 20kg", key: "bulkRateAirAbove20", width: 12 },
            { header: "Dox < 100g", key: "doxUpto100g", width: 12 },
            { header: "Dox < 250g", key: "doxUpto250g", width: 12 },
            { header: "Dox Add 250g", key: "doxAdd250g", width: 12 },
            { header: "Dox < 500g", key: "doxUpto500g", width: 12 },
            { header: "Dox Add 500g", key: "doxAdd500g", width: 12 },
            { header: "Prem < 250g", key: "premiumUpto250g", width: 12 },
            { header: "Prem Add 250g", key: "premiumAdd250g", width: 12 },
            { header: "Prem < 500g", key: "premiumUpto500g", width: 12 },
            { header: "Prem Add 500g", key: "premiumAdd500g", width: 12 },
        ];

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "2563EB" }
        };

        // Add data
        rates.forEach(rate => {
            worksheet.addRow({
                customerCode: rate.customer.customerCode,
                customerName: rate.customer.customerName,
                sectorName: rate.sectorName,
                serviceProvider: rate.serviceProvider,
                bulkMinWeightSurface: rate.bulkMinWeightSurface,
                bulkRateSurfaceUpto10: rate.bulkRateSurfaceUpto10,
                bulkRateSurfaceUpto15: rate.bulkRateSurfaceUpto15,
                bulkRateSurfaceUpto20: rate.bulkRateSurfaceUpto20,
                bulkRateSurfaceAbove20: rate.bulkRateSurfaceAbove20,
                bulkMinWeightAir: rate.bulkMinWeightAir,
                bulkRateAirUpto10: rate.bulkRateAirUpto10,
                bulkRateAirUpto15: rate.bulkRateAirUpto15,
                bulkRateAirUpto20: rate.bulkRateAirUpto20,
                bulkRateAirAbove20: rate.bulkRateAirAbove20,
                doxUpto100g: rate.doxUpto100g,
                doxUpto250g: rate.doxUpto250g,
                doxAdd250g: rate.doxAdd250g,
                doxUpto500g: rate.doxUpto500g,
                doxAdd500g: rate.doxAdd500g,
                premiumUpto250g: rate.premiumUpto250g,
                premiumAdd250g: rate.premiumAdd250g,
                premiumUpto500g: rate.premiumUpto500g,
                premiumAdd500g: rate.premiumAdd500g,
            });
        });

        const buf = await workbook.xlsx.writeBuffer();

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="All_Sector_Rates_${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        });

    } catch (error) {
        console.error("Error exporting rates:", error);
        return NextResponse.json({ error: "Failed to export rates" }, { status: 500 });
    }
}import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Fetch all sector rates with customer info
        const rates = await prisma.sectorRate.findMany({
            include: {
                customer: {
                    select: {
                        customerCode: true,
                        customerName: true
                    }
                }
            },
            orderBy: [
                { customer: { customerName: 'asc' } },
                { sectorName: 'asc' }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("All Sector Rates");

        // Define columns
        worksheet.columns = [
            { header: "Customer Code", key: "customerCode", width: 15 },
            { header: "Customer Name", key: "customerName", width: 30 },
            { header: "Sector Name", key: "sectorName", width: 30 },
            { header: "Service Provider", key: "serviceProvider", width: 15 },
            { header: "Min Wt Surface", key: "bulkMinWeightSurface", width: 12 },
            { header: "Surf < 10kg", key: "bulkRateSurfaceUpto10", width: 12 },
            { header: "Surf < 15kg", key: "bulkRateSurfaceUpto15", width: 12 },
            { header: "Surf < 20kg", key: "bulkRateSurfaceUpto20", width: 12 },
            { header: "Surf > 20kg", key: "bulkRateSurfaceAbove20", width: 12 },
            { header: "Min Wt Air", key: "bulkMinWeightAir", width: 12 },
            { header: "Air < 10kg", key: "bulkRateAirUpto10", width: 12 },
            { header: "Air < 15kg", key: "bulkRateAirUpto15", width: 12 },
            { header: "Air < 20kg", key: "bulkRateAirUpto20", width: 12 },
            { header: "Air > 20kg", key: "bulkRateAirAbove20", width: 12 },
            { header: "Dox < 100g", key: "doxUpto100g", width: 12 },
            { header: "Dox < 250g", key: "doxUpto250g", width: 12 },
            { header: "Dox Add 250g", key: "doxAdd250g", width: 12 },
            { header: "Dox < 500g", key: "doxUpto500g", width: 12 },
            { header: "Dox Add 500g", key: "doxAdd500g", width: 12 },
            { header: "Prem < 250g", key: "premiumUpto250g", width: 12 },
            { header: "Prem Add 250g", key: "premiumAdd250g", width: 12 },
            { header: "Prem < 500g", key: "premiumUpto500g", width: 12 },
            { header: "Prem Add 500g", key: "premiumAdd500g", width: 12 },
        ];

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "2563EB" }
        };

        // Add data
        rates.forEach(rate => {
            worksheet.addRow({
                customerCode: rate.customer.customerCode,
                customerName: rate.customer.customerName,
                sectorName: rate.sectorName,
                serviceProvider: rate.serviceProvider,
                bulkMinWeightSurface: rate.bulkMinWeightSurface,
                bulkRateSurfaceUpto10: rate.bulkRateSurfaceUpto10,
                bulkRateSurfaceUpto15: rate.bulkRateSurfaceUpto15,
                bulkRateSurfaceUpto20: rate.bulkRateSurfaceUpto20,
                bulkRateSurfaceAbove20: rate.bulkRateSurfaceAbove20,
                bulkMinWeightAir: rate.bulkMinWeightAir,
                bulkRateAirUpto10: rate.bulkRateAirUpto10,
                bulkRateAirUpto15: rate.bulkRateAirUpto15,
                bulkRateAirUpto20: rate.bulkRateAirUpto20,
                bulkRateAirAbove20: rate.bulkRateAirAbove20,
                doxUpto100g: rate.doxUpto100g,
                doxUpto250g: rate.doxUpto250g,
                doxAdd250g: rate.doxAdd250g,
                doxUpto500g: rate.doxUpto500g,
                doxAdd500g: rate.doxAdd500g,
                premiumUpto250g: rate.premiumUpto250g,
                premiumAdd250g: rate.premiumAdd250g,
                premiumUpto500g: rate.premiumUpto500g,
                premiumAdd500g: rate.premiumAdd500g,
            });
        });

        const buf = await workbook.xlsx.writeBuffer();

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="All_Sector_Rates_${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        });

    } catch (error) {
        console.error("Error exporting rates:", error);
        return NextResponse.json({ error: "Failed to export rates" }, { status: 500 });
    }
}