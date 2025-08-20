import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
    try {
        const bookings = await prisma.bookingMaster.findMany({ orderBy: { bookingDate: "desc" } });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Bookings");

        worksheet.columns = [
            { header: "SR NO.", key: "srNo", width: 8 },
            { header: "Booking Date", key: "bookingDate", width: 16 },
            { header: "AwbNo", key: "awbNo", width: 18 },
            { header: "Destination City", key: "destinationCity", width: 18 },
            { header: "Mode", key: "mode", width: 8 },
            { header: "PCS", key: "pcs", width: 6 },
            { header: "Pin", key: "pin", width: 10 },
            { header: "DSR_CONTENTS", key: "dsrContents", width: 16 },
            { header: "DSR_NDX_PAPER", key: "dsrNdxPaper", width: 16 },
            { header: "Invoice Value", key: "invoiceValue", width: 14 },
            { header: "Actual Weight", key: "actualWeight", width: 12 },
            { header: "Charge Weight", key: "chargeWeight", width: 12 },
            { header: "Invoice Wt", key: "invoiceWt", width: 12 },
            { header: "Client Billing Value", key: "clientBillingValue", width: 18 },
            { header: "Credit Customer Amount", key: "creditCustomerAmount", width: 20 },
            { header: "Regular Customer Amount", key: "regularCustomerAmount", width: 22 },
            { header: "Child Customer", key: "childCustomer", width: 16 },
            { header: "Parent Customer", key: "parentCustomer", width: 16 },
            { header: "Payment Status", key: "paymentStatus", width: 16 },
            { header: "Sender Contact No", key: "senderContactNo", width: 16 },
            { header: "Address", key: "address", width: 28 },
            { header: "Adhaar No", key: "adhaarNo", width: 16 },
            { header: "Customer Attend By", key: "customerAttendBy", width: 18 },
            { header: "Status", key: "status", width: 10 },
            { header: "Status Date", key: "statusDate", width: 16 },
            { header: "Pending Days of Not Delivered", key: "pendingDaysNotDelivered", width: 24 },
            { header: "Receiver Name", key: "receiverName", width: 18 },
            { header: "Receiver Contact No", key: "receiverContactNo", width: 18 },
            { header: "Complain No.", key: "complainNo", width: 16 },
            { header: "Shipment Cost by other Mode", key: "shipmentCostOtherMode", width: 24 },
            { header: "POD Status", key: "podStatus", width: 12 },
            { header: "Remarks", key: "remarks", width: 22 },
            { header: "Country Name", key: "countryName", width: 16 },
            { header: "Domestic / International", key: "domesticInternational", width: 22 },
            { header: "International Mode", key: "internationalMode", width: 16 },
        ];

        bookings.forEach((b, idx) => {
            worksheet.addRow({ ...b, srNo: idx + 1 });
        });
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "DEE6EF" }
            };
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        const buf = await workbook.xlsx.writeBuffer();

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="BookingMaster.xlsx"`,
            },
        });
    } catch (error) {
        return NextResponse.json({ message: "Error exporting bookings" }, { status: 500 });
    }
}