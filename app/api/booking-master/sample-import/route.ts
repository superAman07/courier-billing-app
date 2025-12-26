import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sample Import");

    worksheet.columns = [
        { header: "Booking Date", key: "bookingDate", width: 15 },
        { header: "Docket", key: "awbNo", width: 15 },
        { header: "Ref", key: "ref", width: 12 },
        { header: "Provider", key: "serviceProvider", width: 12 },
        { header: "Location", key: "location", width: 15 },
        { header: "Destination", key: "destinationCity", width: 15 },
        { header: "Pincode", key: "pin", width: 10 },
        { header: "Mode", key: "mode", width: 10 },
        
        { header: "No of Pcs", key: "pcs", width: 10 },
        { header: "Content", key: "dsrContents", width: 20 },
        { header: "Dox / Non Dox", key: "dsrNdxPaper", width: 14 },
        { header: "Material Value", key: "invoiceValue", width: 15 },
        
        { header: "Length", key: "length", width: 10 },
        { header: "Width", key: "width", width: 10 },
        { header: "Height", key: "height", width: 10 },
        { header: "FR Weight", key: "actualWeight", width: 12 },
        { header: "Charge Weight", key: "chargeWeight", width: 12 },
        
        { header: "FR Charge", key: "frCharge", width: 12 },
        { header: "Fuel Surcharge", key: "fuelSurcharge", width: 14 },
        { header: "Shipper Cost", key: "shipperCost", width: 12 },
        { header: "Waybill Surcharge", key: "waybillSurcharge", width: 16 },
        { header: "Other Exp", key: "otherExp", width: 12 },
        { header: "GST", key: "gst", width: 10 },
        { header: "Client Billing Value", key: "clientBillingValue", width: 18 },
        
        { header: "Customer Code", key: "customerCode", width: 15 },
        { header: "Customer Name", key: "customerName", width: 20 },
        { header: "Child Customer", key: "childCustomer", width: 20 },
        { header: "Consignee", key: "customerAttendBy", width: 15 },
        { header: "Sender Detail", key: "senderDetail", width: 20 },
        { header: "Sender Contact No", key: "senderContactNo", width: 15 },
        { header: "Address", key: "address", width: 25 },
        { header: "Credit Cust. Amt", key: "creditCustomerAmount", width: 15 },
        { header: "Regular Cust. Amt", key: "regularCustomerAmount", width: 15 },
        { header: "Customer Type", key: "customerType", width: 15 },
        { header: "PAYMENT STATUS", key: "paymentStatus", width: 15 },
        { header: "Adhaar No", key: "adhaarNo", width: 15 },
        
        { header: "STATUS", key: "status", width: 12 },
        { header: "Status Date", key: "statusDate", width: 15 },
        { header: "Receiver Name", key: "receiverName", width: 20 },
        { header: "Receiver Contact No", key: "receiverContactNo", width: 15 },
        { header: "DELIVERED", key: "delivered", width: 12 },
        { header: "Date of Delivery", key: "dateOfDelivery", width: 15 },
    ];

    worksheet.addRow({
        bookingDate: new Date().toISOString().split('T')[0],
        awbNo: "1000001",
        ref: "REF001",
        serviceProvider: "DTDC",
        location: "Delhi",
        destinationCity: "Mumbai",
        pin: "400001",
        mode: "AIR",
        pcs: 1,
        dsrContents: "Documents",
        dsrNdxPaper: "D",
        invoiceValue: 500,
        length: 10,
        width: 10,
        height: 10,
        actualWeight: 0.5,
        chargeWeight: 0.5,
        frCharge: 100,
        fuelSurcharge: 10,
        shipperCost: 50,
        waybillSurcharge: 0,
        otherExp: 0,
        gst: 18,
        clientBillingValue: 129.8,
        customerCode: "CUST001",
        customerName: "ABC Corp",
        childCustomer: "XYZ Branch",
        customerAttendBy: "John",
        senderDetail: "Sender Name",
        senderContactNo: "9876543210",
        address: "123 Main St",
        creditCustomerAmount: 0,
        regularCustomerAmount: 0,
        customerType: "CREDIT",
        paymentStatus: "UNPAID",
        adhaarNo: "",
        status: "BOOKED",
        statusDate: new Date().toISOString().split('T')[0],
        receiverName: "Jane Doe",
        receiverContactNo: "9123456780",
        delivered: "NO",
        dateOfDelivery: ""
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }
    };

    const buf = await workbook.xlsx.writeBuffer();

    return new NextResponse(buf, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="Sample_Booking_Import.xlsx"`,
        },
    });
}