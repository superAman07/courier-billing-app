import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json([]);
        }

        const bookings = await prisma.bookingMaster.findMany({
            where: { id: { in: ids } },
            include: { customer: true }
        });

        // Transform DB schema back to UI schema for Smart Booking Master
        const formatted = bookings.map((b, idx) => ({
             // Preserved internal keys for tracking
            _awbExists: true,
            _bookingId: b.id,
            __origIndex:idx,
            srNo: idx + 1,
            
            // Editable Fields
            awbNo: b.awbNo,
            bookingDate: b.bookingDate,
            serviceProvider: b.serviceProvider || "DTDC",
            location: b.location || "",
            destinationCity: b.destinationCity,
            mode: b.mode,
            pcs: b.pcs,
            pin: b.pin,
            dsrContents: b.dsrContents || "",
            dsrNdxPaper: b.dsrNdxPaper || "N",
            invoiceValue: b.invoiceValue || 0,
            actualWeight: b.actualWeight || 0,
            chargeWeight: b.chargeWeight || 0,
            
            // Dimensions
            length: b.length || 0,
            width: b.width || 0,
            height: b.height || 0,
            valumetric: b.valumetric || 0,
            invoiceWt: b.invoiceWt || 0,

            // Financials (Will be overwritten if recalculated)
            frCharge: b.frCharge || 0,
            fuelSurcharge: b.fuelSurcharge || 0,
            _fuelSurchargePercent: b.customer?.fuelSurchargePercent || 0,  // Crucial for re-calc
            shipperCost: b.shipperCost || 0,
            waybillSurcharge: b.waybillSurcharge || 0,
            otherExp: b.otherExp || 0,
            gst: b.gst || 0,
            _gstPercent: 18, // Can fetch real logic if needed, or default
            clientBillingValue: b.clientBillingValue || 0,

            // Customer Info
            customerCode: b.customerCode || "",
            customerId: b.customerId,
            customerName: b.customer?.customerName || "",
            childCustomer: b.customer?.childCustomer || "",
            senderDetail: b.senderDetail,
            senderContactNo: b.senderContactNo,
            address: b.address,
            customerType: b.customerType || "CREDIT",
            
            // Status
            status: b.status,
            paymentStatus: b.paymentStatus || "UNPAID",
            delivered: b.delivered || "NO",
            todayDate: new Date(),
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching for edit:", error);
        return NextResponse.json({ message: "Failed" }, { status: 500 });
    }
}