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
    // Required fields
    const bookingData: any = {
      bookingDate: new Date(data.bookingDate),
      awbNo: String(data.awbNo),
      destinationCity: data.destinationCity,
      mode: data.mode,
      pcs: Number(data.pcs),
      pin: String(data.pin),
      ...(data.customerId && { customerId: data.customerId }),
      ...(data.srNo !== undefined && data.srNo !== null && data.srNo !== "" && { srNo: Number(data.srNo) }),
      ...(data.location && { location: data.location }),
      ...(data.dsrContents && { dsrContents: data.dsrContents }),
      ...(data.dsrNdxPaper && { dsrNdxPaper: data.dsrNdxPaper }),
      ...(data.invoiceValue !== undefined && { invoiceValue: Number(data.invoiceValue) }),
      ...(data.actualWeight !== undefined && { actualWeight: Number(data.actualWeight) }),
      ...(data.chargeWeight !== undefined && { chargeWeight: Number(data.chargeWeight) }),
      ...(data.valumetric !== undefined && { valumetric: Number(data.valumetric) }),
      ...(data.invoiceWt !== undefined && { invoiceWt: Number(data.invoiceWt) }),
      ...(data.clientBillingValue !== undefined && { clientBillingValue: Number(data.clientBillingValue) }),
      ...(data.creditCustomerAmount !== undefined && { creditCustomerAmount: Number(data.creditCustomerAmount) }),
      ...(data.regularCustomerAmount !== undefined && { regularCustomerAmount: Number(data.regularCustomerAmount) }),
      ...(data.fuelSurcharge !== undefined && { fuelSurcharge: Number(data.fuelSurcharge) }),
      ...(data.shipperCost !== undefined && { shipperCost: Number(data.shipperCost) }),
      ...(data.otherExp !== undefined && { otherExp: Number(data.otherExp) }),
      ...(data.gst !== undefined && { gst: Number(data.gst) }),
      ...(data.customerType && { customerType: data.customerType }),
      ...(data.senderDetail && { senderDetail: data.senderDetail }),
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
      ...(data.ref && { ref: data.ref }),
      ...(data.delivered && { delivered: data.delivered }),
      ...(data.dateOfDelivery && { dateOfDelivery: new Date(data.dateOfDelivery) }),
      ...(data.todayDate && { todayDate: new Date(data.todayDate) }),
    };

    const booking = await prisma.bookingMaster.create({
      data: bookingData,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ message: "AWB number already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating booking", error: error.message }, { status: 500 });
  }
}