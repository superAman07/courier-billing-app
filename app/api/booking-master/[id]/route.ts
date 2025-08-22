import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const booking = await prisma.bookingMaster.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!booking) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const data = await req.json();
    console.log("Updating booking:", id, data);
   const updateData: any = {};
    
    // Handle each field individually
    if (data.bookingDate !== undefined) updateData.bookingDate = new Date(data.bookingDate);
    if (data.awbNo !== undefined) updateData.awbNo = String(data.awbNo);
    if (data.destinationCity !== undefined) updateData.destinationCity = data.destinationCity;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.pcs !== undefined) updateData.pcs = Number(data.pcs);
    if (data.pin !== undefined) updateData.pin = String(data.pin);
    if (data.srNo !== undefined) updateData.srNo = data.srNo ? Number(data.srNo) : null;
    if (data.dsrContents !== undefined) updateData.dsrContents = data.dsrContents;
    if (data.dsrNdxPaper !== undefined) updateData.dsrNdxPaper = data.dsrNdxPaper;
    if (data.invoiceValue !== undefined) updateData.invoiceValue = data.invoiceValue ? Number(data.invoiceValue) : null;
    if (data.actualWeight !== undefined) updateData.actualWeight = data.actualWeight ? Number(data.actualWeight) : null;
    if (data.chargeWeight !== undefined) updateData.chargeWeight = data.chargeWeight ? Number(data.chargeWeight) : null;
    if (data.invoiceWt !== undefined) updateData.invoiceWt = data.invoiceWt ? Number(data.invoiceWt) : null;
    if (data.clientBillingValue !== undefined) updateData.clientBillingValue = data.clientBillingValue ? Number(data.clientBillingValue) : null;
    if (data.creditCustomerAmount !== undefined) updateData.creditCustomerAmount = data.creditCustomerAmount ? Number(data.creditCustomerAmount) : null;
    if (data.regularCustomerAmount !== undefined) updateData.regularCustomerAmount = data.regularCustomerAmount ? Number(data.regularCustomerAmount) : null;
    if (data.childCustomer !== undefined) updateData.childCustomer = data.childCustomer;
    if (data.parentCustomer !== undefined) updateData.parentCustomer = data.parentCustomer;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.senderContactNo !== undefined) updateData.senderContactNo = data.senderContactNo;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.adhaarNo !== undefined) updateData.adhaarNo = data.adhaarNo;
    if (data.customerAttendBy !== undefined) updateData.customerAttendBy = data.customerAttendBy;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.statusDate !== undefined) updateData.statusDate = data.statusDate ? new Date(data.statusDate) : null;
    if (data.pendingDaysNotDelivered !== undefined) updateData.pendingDaysNotDelivered = data.pendingDaysNotDelivered ? Number(data.pendingDaysNotDelivered) : null;
    if (data.receiverName !== undefined) updateData.receiverName = data.receiverName;
    if (data.receiverContactNo !== undefined) updateData.receiverContactNo = data.receiverContactNo;
    if (data.complainNo !== undefined) updateData.complainNo = data.complainNo;
    if (data.shipmentCostOtherMode !== undefined) updateData.shipmentCostOtherMode = data.shipmentCostOtherMode ? Number(data.shipmentCostOtherMode) : null;
    if (data.podStatus !== undefined) updateData.podStatus = data.podStatus;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.countryName !== undefined) updateData.countryName = data.countryName;
    if (data.domesticInternational !== undefined) updateData.domesticInternational = data.domesticInternational;
    if (data.internationalMode !== undefined) updateData.internationalMode = data.internationalMode;
    if (data.customerId !== undefined) updateData.customerId = data.customerId;

    console.log("Clean update data:", updateData);

    const booking = await prisma.bookingMaster.update({
      where: { id },
      data: updateData
    });

    console.log("Updated booking:", booking);
    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ message: "Error updating booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await prisma.bookingMaster.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting booking" }, { status: 500 });
  }
}