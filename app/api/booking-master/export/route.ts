import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

const FIELD_LABELS = {
    srNo: "SR NO.",
    bookingDate: "Booking Date",
    awbNo: "AwbNo",
    destinationCity: "Destination City",
    mode: "Mode",
    pcs: "PCS",
    pin: "Pin",
    dsrContents: "DSR_CONTENTS",
    dsrNdxPaper: "DSR_NDX_PAPER",
    invoiceValue: "Invoice Value",
    actualWeight: "Actual Weight",
    chargeWeight: "Charge Weight",
    invoiceWt: "Invoice Wt",
    clientBillingValue: "Client Billing Value",
    creditCustomerAmount: "Credit Customer Amount",
    regularCustomerAmount: "Regular Customer Amount",
    childCustomer: "Child Customer",
    parentCustomer: "Parent Customer",
    paymentStatus: "Payment Status",
    senderContactNo: "Sender Contact No",
    address: "Address",
    adhaarNo: "Adhaar No",
    customerAttendBy: "Customer Attend By",
    status: "Status",
    statusDate: "Status Date",
    pendingDaysNotDelivered: "Pending Days of Not Delivered",
    receiverName: "Receiver Name",
    receiverContactNo: "Receiver Contact No",
    complainNo: "Complain No.",
    shipmentCostOtherMode: "Shipment Cost by other Mode",
    podStatus: "POD Status",
    remarks: "Remarks",
    countryName: "Country Name",
    domesticInternational: "Domestic / International",
    internationalMode: "International Mode",
};

export async function GET() {
    try {
        const bookings = await prisma.bookingMaster.findMany({
            orderBy: { bookingDate: "desc" },
        });

        const bookingsWithSrNo = bookings.map((b, idx) => ({
            ...b,
            srNo: idx + 1,
        }));

        // Transform rows to use user-friendly labels
        const columnOrder = Object.keys(FIELD_LABELS);
        const displayHeaders = Object.values(FIELD_LABELS);

        const bookingsWithDisplayKeys = bookingsWithSrNo.map(row => {
            let result: Record<string, any> = {};
            (columnOrder as (keyof typeof FIELD_LABELS)[]).forEach(k => {
                const label = FIELD_LABELS[k];
                result[label] = row[k] !== undefined && row[k] !== null ? row[k] : "";
            });
            return result;
        });

        const ws = XLSX.utils.json_to_sheet([], { header: displayHeaders });
        XLSX.utils.sheet_add_aoa(ws, [displayHeaders], { origin: 0 }); // set header

        XLSX.utils.sheet_add_json(ws, bookingsWithDisplayKeys, { skipHeader: true, origin: -1 });

        const headerRow = 1;
        for (let col = 0; col < displayHeaders.length; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                fill: { fgColor: { rgb: "DEE6EF" } }, // light blue-gray
                font: { bold: true },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bookings");

        // Enable styles
        // Use XLSX.write with bookType:'xlsx', bookSST:true, cellStyles:true if using a version that supports styles.

        // Write workbook to buffer
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });

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




// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import * as XLSX from "xlsx";

// export async function GET() {
//     try {
//         const bookings = await prisma.bookingMaster.findMany({
//             orderBy: { bookingDate: "desc" },
//         });

//         // Add srNo as 1-based index for each row
//         const bookingsWithSrNo = bookings.map((b, idx) => ({
//             ...b,
//             srNo: idx + 1,
//         }));

//         // Convert bookings to worksheet
//         const ws = XLSX.utils.json_to_sheet(bookingsWithSrNo);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "Bookings");

//         // Write workbook to buffer
//         const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

//         return new NextResponse(buf, {
//             status: 200,
//             headers: {
//                 "Content-Type":
//                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//                 "Content-Disposition": `attachment; filename="BookingMaster.xlsx"`,
//             },
//         });
//     } catch (error) {
//         return NextResponse.json({ message: "Error exporting bookings" }, { status: 500 });
//     }
// }