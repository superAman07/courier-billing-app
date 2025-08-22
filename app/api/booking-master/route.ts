import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.bookingMaster.findMany({
      include: { customer: true },
      orderBy: { bookingDate: "desc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Received booking payload:", data);
     const bookingData = {
      // Required fields
      bookingDate: new Date(data.bookingDate),
      awbNo: String(data.awbNo),
      destinationCity: data.destinationCity,
      mode: data.mode,
      pcs: Number(data.pcs),
      pin: String(data.pin),
      
      // Optional fields - only include if they exist
      ...(data.srNo !== undefined && data.srNo !== null && data.srNo !== '' && { srNo: Number(data.srNo) }),
      ...(data.dsrContents && { dsrContents: data.dsrContents }),
      ...(data.dsrNdxPaper && { dsrNdxPaper: data.dsrNdxPaper }),
      ...(data.invoiceValue && { invoiceValue: Number(data.invoiceValue) }),
      ...(data.actualWeight && { actualWeight: Number(data.actualWeight) }),
      ...(data.chargeWeight && { chargeWeight: Number(data.chargeWeight) }),
      ...(data.invoiceWt && { invoiceWt: Number(data.invoiceWt) }),
      ...(data.clientBillingValue && { clientBillingValue: Number(data.clientBillingValue) }),
      ...(data.creditCustomerAmount && { creditCustomerAmount: Number(data.creditCustomerAmount) }),
      ...(data.regularCustomerAmount && { regularCustomerAmount: Number(data.regularCustomerAmount) }),
      ...(data.childCustomer && { childCustomer: data.childCustomer }),
      ...(data.parentCustomer && { parentCustomer: data.parentCustomer }),
      ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
      ...(data.senderContactNo && { senderContactNo: data.senderContactNo }),
      ...(data.address && { address: data.address }),
      ...(data.adhaarNo && { adhaarNo: data.adhaarNo }),
      ...(data.customerAttendBy && { customerAttendBy: data.customerAttendBy }),
      ...(data.status && { status: data.status }),
      ...(data.statusDate && { statusDate: new Date(data.statusDate) }),
      ...(data.pendingDaysNotDelivered !== undefined && { pendingDaysNotDelivered: Number(data.pendingDaysNotDelivered) }),
      ...(data.receiverName && { receiverName: data.receiverName }),
      ...(data.receiverContactNo && { receiverContactNo: data.receiverContactNo }),
      ...(data.complainNo && { complainNo: data.complainNo }),
      ...(data.shipmentCostOtherMode && { shipmentCostOtherMode: Number(data.shipmentCostOtherMode) }),
      ...(data.podStatus && { podStatus: data.podStatus }),
      ...(data.remarks && { remarks: data.remarks }),
      ...(data.countryName && { countryName: data.countryName }),
      ...(data.domesticInternational && { domesticInternational: data.domesticInternational }),
      ...(data.internationalMode && { internationalMode: data.internationalMode }),
      
      // **FIXED: Use customerId directly (not relation syntax)**
      ...(data.customerId && { customerId: data.customerId }),
    };

    console.log("Clean booking data:", bookingData);

    const booking = await prisma.bookingMaster.create({
      data: bookingData
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "AWB number already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ 
      message: "Error creating booking", 
      error: error.message 
    }, { status: 500 });
  }
}