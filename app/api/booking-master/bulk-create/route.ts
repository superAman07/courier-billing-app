import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const bookings = await req.json();

        if (!Array.isArray(bookings) || bookings.length === 0) {
            return NextResponse.json({ error: 'No booking data provided.' }, { status: 400 });
        }

        const createData = bookings.map(b => {
            const bookingData: any = {
                awbNo: String(b.awbNo),
                bookingDate: b.bookingDate ? new Date(b.bookingDate) : new Date(),
                destinationCity: b.destinationCity,
                mode: b.mode,
                pcs: Number(b.pcs || 0),
                pin: String(b.pin || ""),
            };

            if (b.location) bookingData.location = b.location;
            if (b.dsrContents) bookingData.dsrContents = b.dsrContents;
            if (b.dsrNdxPaper) bookingData.dsrNdxPaper = b.dsrNdxPaper;
            if (b.invoiceValue) bookingData.invoiceValue = Number(b.invoiceValue);
            if (b.actualWeight) bookingData.actualWeight = Number(b.actualWeight);
            if (b.chargeWeight) bookingData.chargeWeight = Number(b.chargeWeight);
            if (b.length) bookingData.length = Number(b.length);
            if (b.width) bookingData.width = Number(b.width);
            if (b.height) bookingData.height = Number(b.height);
            if (b.valumetric) bookingData.valumetric = Number(b.valumetric);
            if (b.invoiceWt) bookingData.invoiceWt = Number(b.invoiceWt);
            if (b.clientBillingValue) bookingData.clientBillingValue = Number(b.clientBillingValue);
            if (b.creditCustomerAmount) bookingData.creditCustomerAmount = Number(b.creditCustomerAmount);
            if (b.regularCustomerAmount) bookingData.regularCustomerAmount = Number(b.regularCustomerAmount);
            if (b.fuelSurcharge) bookingData.fuelSurcharge = Number(b.fuelSurcharge);
            if (b.shipperCost) bookingData.shipperCost = Number(b.shipperCost);
            if (b.otherExp) bookingData.otherExp = Number(b.otherExp);
            if (b.gst) bookingData.gst = Number(b.gst);
            if (b.customerType) bookingData.customerType = b.customerType;
            if (b.senderDetail) bookingData.senderDetail = b.senderDetail;
            if (b.paymentStatus) bookingData.paymentStatus = b.paymentStatus;
            if (b.senderContactNo) bookingData.senderContactNo = b.senderContactNo;
            if (b.address) bookingData.address = b.address;
            if (b.adhaarNo) bookingData.adhaarNo = b.adhaarNo;
            if (b.customerAttendBy) bookingData.customerAttendBy = String(b.customerAttendBy);
            if (b.status) bookingData.status = b.status;
            if (b.statusDate) bookingData.statusDate = new Date(b.statusDate);
            if (b.pendingDaysNotDelivered) bookingData.pendingDaysNotDelivered = Number(b.pendingDaysNotDelivered);
            if (b.receiverName) bookingData.receiverName = String(b.receiverName);
            if (b.receiverContactNo) bookingData.receiverContactNo = String(b.receiverContactNo);
            if (b.ref) bookingData.ref = String(b.ref);
            if (b.delivered) bookingData.delivered = b.delivered;
            if (b.dateOfDelivery) bookingData.dateOfDelivery = new Date(b.dateOfDelivery);
            if (b.todayDate) bookingData.todayDate = new Date(b.todayDate);
            if (b.customerCode) bookingData.customerCode = String(b.customerCode);
            if (b.customerId) bookingData.customerId = b.customerId;

            return bookingData;
        });

        let createdCount = 0;
        let updatedCount = 0;

        for (const booking of createData) {
            const result = await prisma.bookingMaster.upsert({
                where: { awbNo: booking.awbNo },
                update: booking,
                create: booking,
            });
            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
                createdCount++;
            } else {
                updatedCount++;
            }
        }

        return NextResponse.json({
            message: `Import complete: ${createdCount} created, ${updatedCount} updated.`,
            count: createdCount + updatedCount,
        });

    } catch (error: any) {
        console.error("Error during bulk booking creation:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'One or more AWB numbers already exist.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create bookings.', details: error.message }, { status: 500 });
    }
}