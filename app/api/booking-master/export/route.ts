import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
    try {
        const bookings = await prisma.bookingMaster.findMany({
            where: {
                customerId: {
                    not: null
                }
            }, 
            include: { 
                customer: true 
            }, 
            orderBy: { 
                bookingDate: "desc" 
            } 
        });
        return await generateExcel(boookings);
    } catch (error) {
        console.error("Excel export error:", error);
        return NextResponse.json({ message: "Error exporting bookings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { bookings } = await req.json();
        if (!Array.isArray(bookings)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }
        return await generateExcel(bookings);
    } catch (error) {
        console.error("Excel export error:", error);
        return NextResponse.json({ message: "Error exporting bookings" }, { status: 500 });
    }
}

async function generateExcel(bookings: any[]){
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
            { header: "Charge Weight", key: "chargeWeight", width: 14 },
            { header: "FR Charge", key: "frCharge", width: 12 },
            { header: "Length", key: "length", width: 10 },
            { header: "Width", key: "width", width: 10 },
            { header: "Height", key: "height", width: 10 },
            { header: "Valumatric", key: "valumetric", width: 12 },
            { header: "Invoice Wt", key: "invoiceWt", width: 12 },
            { header: "Clinet Billing Value", key: "clientBillingValue", width: 18 },
            { header: "Credit Cust.  Amt", key: "creditCustomerAmount", width: 20 },
            { header: "Regular Cust. Amt", key: "regularCustomerAmount", width: 20 },
            { header: "Fuel Surcharge", key: "fuelSurcharge", width: 14 },      
            { header: "Shipper Cost", key: "shipperCost", width: 14 },          
            { header: "Other Exp", key: "otherExp", width: 14 },                
            { header: "GST", key: "gst", width: 10 },     
            { header: "Customer Code", key: "customerCode", width: 16 },       // NEW
            { header: "Customer Name", key: "customerName", width: 25 },       // NEW
            { header: "Child Customer", key: "childCustomer", width: 25 },                      
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

        worksheet.mergeCells('A1:AQ1');
        worksheet.getCell('A1').value = 'BOOKING MASTER REPORT';
        worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getCell('A1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1f4e79' }
        };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        worksheet.mergeCells('A2:AQ2');
        worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`;
        worksheet.getCell('A2').font = { size: 11, italic: true, color: { argb: '666666' } };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        const headerRow = worksheet.getRow(4);
        worksheet.columns.forEach((col, index) => {
            const headerValue = Array.isArray(col.header) ? col.header.join(" ") : (col.header ?? "");
            headerRow.getCell(index + 1).value = headerValue;
        });

        headerRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4472C4" }
            };
            cell.font = {
                bold: true,
                color: { argb: "FFFFFF" },
                size: 11
            };
            cell.alignment = {
                horizontal: "center",
                vertical: "middle",
                wrapText: true
            };
            cell.border = {
                top: { style: 'thin', color: { argb: '333333' } },
                left: { style: 'thin', color: { argb: '333333' } },
                bottom: { style: 'thin', color: { argb: '333333' } },
                right: { style: 'thin', color: { argb: '333333' } }
            };
        });
        headerRow.height = 25;

        bookings.forEach((booking, idx) => {
            const rowNum = idx + 5;
            const dataRow = worksheet.getRow(rowNum);

            const formattedBooking = {
                ...booking,
                srNo: idx + 1,
                customerCode: booking.customer?.customerCode, 
                customerName: booking.customer?.customerName,
                childCustomer: booking.customer?.childCustomer || booking.customer?.customerName,
                bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : '',
                statusDate: booking.statusDate ? new Date(booking.statusDate).toLocaleDateString('en-IN') : '',
                dateOfDelivery: booking.dateOfDelivery ? new Date(booking.dateOfDelivery).toLocaleDateString('en-IN') : '',
                todayDate: booking.todayDate ? new Date(booking.todayDate).toLocaleDateString('en-IN') : '',
                gst: booking.gst ? `${booking.gst}%` : '',
                mode: booking.mode
            };

            worksheet.addRow(formattedBooking);

            if (idx % 2 === 0) {
                dataRow.eachCell(cell => {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "F8F9FA" }
                    };
                });
            }

            if (booking.status === 'DELIVERED') {
                dataRow.eachCell(cell => {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "D4EDDA" }
                    };
                });
            } else if (booking.status === 'RETURNED') {
                dataRow.eachCell(cell => {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "F8D7DA" }
                    };
                });
            }

            dataRow.eachCell(cell => {
                cell.alignment = { vertical: "middle" };
                cell.font = { size: 10 };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E5E5E5' } },
                    left: { style: 'thin', color: { argb: 'E5E5E5' } },
                    bottom: { style: 'thin', color: { argb: 'E5E5E5' } },
                    right: { style: 'thin', color: { argb: 'E5E5E5' } }
                };
            });

            dataRow.height = 20;
        });

        const lastRow = bookings.length + 6;
        worksheet.mergeCells(`A${lastRow}:E${lastRow}`);
        worksheet.getCell(`A${lastRow}`).value = `Total Records: ${bookings.length}`;
        worksheet.getCell(`A${lastRow}`).font = { bold: true, size: 12, color: { argb: '1f4e79' } };
        worksheet.getCell(`A${lastRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.autoFilter = {
            from: { row: 4, column: 1 },
            to: { row: bookings.length + 4, column: worksheet.columns.length }
        };

        worksheet.views = [{ state: 'frozen', ySplit: 4 }];

        const buf = await workbook.xlsx.writeBuffer();

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="BookingMaster_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx"`,
            },
        });
}