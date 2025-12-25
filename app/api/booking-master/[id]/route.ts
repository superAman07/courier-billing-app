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
    const updateData: any = {};

    if (data.bookingDate !== undefined) updateData.bookingDate = new Date(data.bookingDate);
    if (data.awbNo !== undefined) updateData.awbNo = String(data.awbNo);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.destinationCity !== undefined) updateData.destinationCity = data.destinationCity;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.pcs !== undefined) updateData.pcs = Number(data.pcs);
    if (data.pin !== undefined) updateData.pin = String(data.pin);
    if (data.serviceProvider !== undefined) updateData.serviceProvider = data.serviceProvider;
    if (data.srNo !== undefined) updateData.srNo = data.srNo ? Number(data.srNo) : null;
    if (data.dsrContents !== undefined) updateData.dsrContents = data.dsrContents;
    if (data.dsrNdxPaper !== undefined) updateData.dsrNdxPaper = data.dsrNdxPaper;
    if (data.invoiceValue !== undefined) updateData.invoiceValue = data.invoiceValue ? Number(data.invoiceValue) : null;
    if (data.actualWeight !== undefined) updateData.actualWeight = data.actualWeight ? Number(data.actualWeight) : null;
    if (data.chargeWeight !== undefined) updateData.chargeWeight = data.chargeWeight ? Number(data.chargeWeight) : null;
    if (data.frCharge !== undefined) updateData.frCharge = data.frCharge ? Number(data.frCharge) : null;
    if (data.length !== undefined) updateData.length = data.length ? Number(data.length) : null;
    if (data.width !== undefined) updateData.width = data.width ? Number(data.width) : null;
    if (data.height !== undefined) updateData.height = data.height ? Number(data.height) : null;
    if (data.valumetric !== undefined) updateData.valumetric = data.valumetric ? Number(data.valumetric) : null;
    if (data.invoiceWt !== undefined) updateData.invoiceWt = data.invoiceWt ? Number(data.invoiceWt) : null;
    if (data.clientBillingValue !== undefined) updateData.clientBillingValue = data.clientBillingValue ? Number(data.clientBillingValue) : null;
    if (data.creditCustomerAmount !== undefined) updateData.creditCustomerAmount = data.creditCustomerAmount ? Number(data.creditCustomerAmount) : null;
    if (data.regularCustomerAmount !== undefined) updateData.regularCustomerAmount = data.regularCustomerAmount ? Number(data.regularCustomerAmount) : null;
    if (data.fuelSurcharge !== undefined) updateData.fuelSurcharge = data.fuelSurcharge ? Number(data.fuelSurcharge) : null;
    if (data.shipperCost !== undefined) updateData.shipperCost = data.shipperCost ? Number(data.shipperCost) : null;
    if (data.waybillSurcharge !== undefined) updateData.waybillSurcharge = data.waybillSurcharge ? Number(data.waybillSurcharge) : null;
    if (data.otherExp !== undefined) updateData.otherExp = data.otherExp ? Number(data.otherExp) : null;
    if (data.gst !== undefined) updateData.gst = data.gst ? Number(data.gst) : null;
    if (data.customerType !== undefined) updateData.customerType = data.customerType;
    if (data.senderDetail !== undefined) updateData.senderDetail = data.senderDetail;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.senderContactNo !== undefined) updateData.senderContactNo = data.senderContactNo;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.adhaarNo !== undefined) updateData.adhaarNo = data.adhaarNo;
    if (data.customerAttendBy !== undefined) updateData.customerAttendBy = data.customerAttendBy;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.manualStatus !== undefined) updateData.manualStatus = data.manualStatus;
    if (data.manualStatusDate !== undefined) updateData.manualStatusDate = data.manualStatusDate ? new Date(data.manualStatusDate) : null;
    if (data.statusDate !== undefined) updateData.statusDate = data.statusDate ? new Date(data.statusDate) : null;
    if (data.pendingDaysNotDelivered !== undefined) updateData.pendingDaysNotDelivered = data.pendingDaysNotDelivered ? Number(data.pendingDaysNotDelivered) : null;
    if (data.receiverName !== undefined) updateData.receiverName = data.receiverName;
    if (data.receiverContactNo !== undefined) updateData.receiverContactNo = data.receiverContactNo;
    if (data.ref !== undefined) updateData.ref = data.ref;
    if (data.delivered !== undefined) updateData.delivered = data.delivered;
    if (data.dateOfDelivery !== undefined) updateData.dateOfDelivery = data.dateOfDelivery ? new Date(data.dateOfDelivery) : null;
    if (data.todayDate !== undefined) updateData.todayDate = data.todayDate ? new Date(data.todayDate) : null;
    if (data.customerId !== undefined) updateData.customerId = data.customerId;

    const booking = await prisma.bookingMaster.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating booking", error: error.message }, { status: 500 });
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