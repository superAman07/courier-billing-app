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
            { header: "Docket", key: "awbNo", width: 18 },
            { header: "Location", key: "location", width: 18 },
            { header: "Destination", key: "destinationCity", width: 18 },
            { header: "Mode", key: "mode", width: 8 },
            { header: "No of Pcs", key: "pcs", width: 10 },
            { header: "Pincode", key: "pin", width: 10 },
            { header: "Content", key: "dsrContents", width: 28 },
            { header: "Dox / Non Dox", key: "dsrNdxPaper", width: 14 },
            { header: "Material Value", key: "invoiceValue", width: 14 },
            { header: "FR Weight", key: "actualWeight", width: 12 },
            { header: "Valumatric", key: "valumetric", width: 12 },
            { header: "Invoice Wt", key: "invoiceWt", width: 12 },
            { header: "Clinet Billing Value", key: "clientBillingValue", width: 18 },
            { header: "Credit Cust.  Amt", key: "creditCustomerAmount", width: 20 },
            { header: "Regular Cust. Amt", key: "regularCustomerAmount", width: 20 },
            { header: "Fuel Surcharge", key: "fuelSurcharge", width: 14 },      // NEW
            { header: "Shipper Cost", key: "shipperCost", width: 14 },          // NEW
            { header: "Other Exp", key: "otherExp", width: 14 },                // NEW
            { header: "GST", key: "gst", width: 10 },                           // NEW
            { header: "Customer Type", key: "customerType", width: 16 },
            { header: "Sender Detail", key: "senderDetail", width: 18 },
            { header: "PAYMENT STATUS", key: "paymentStatus", width: 16 },
            { header: "Sender Contact No", key: "senderContactNo", width: 16 },
            { header: "Address", key: "address", width: 28 },
            { header: "Adhaar No", key: "adhaarNo", width: 16 },
            { header: "Customer Attend By", key: "customerAttendBy", width: 18 },
            { header: "DELIVERED", key: "delivered", width: 12 },
            { header: "Date of Delivery", key: "dateOfDelivery", width: 16 },
            { header: "Today Date", key: "todayDate", width: 16 },
            { header: "Pending Days", key: "pendingDaysNotDelivered", width: 16 },
            { header: "Receiver Name", key: "receiverName", width: 18 },
            { header: "Receiver Contact No", key: "receiverContactNo", width: 18 },
            { header: "Ref", key: "ref", width: 12 },
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