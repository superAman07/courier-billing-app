import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
    try {
        const customers = await prisma.customerMaster.findMany({
            select: {
                customerCode: true,
                customerName: true,
                childCustomer: true
            },
            orderBy: {
                customerName: 'asc'
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Customer Mapping");

        // Set up columns
        worksheet.columns = [
            { header: "Customer Code", key: "customerCode", width: 15 },
            { header: "Customer Name", key: "customerName", width: 40 },
            { header: "Child Customer", key: "childCustomer", width: 40 }
        ];

        // Style the header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563EB' }  // Blue color
        };

        // Add data
        customers.forEach(customer => {
            worksheet.addRow({
                customerCode: customer.customerCode,
                customerName: customer.customerName,
                childCustomer: customer.childCustomer || customer.customerName
            });
        });

        // Auto-filter
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: 3 }
        };

        const buf = await workbook.xlsx.writeBuffer();

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=Customer_Mapping_List.xlsx"
            }
        });

    } catch (error) {
        console.error("Error exporting customers:", error);
        return NextResponse.json(
            { error: "Failed to export customer mapping" },
            { status: 500 }
        );
    }
}