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
    const booking = await prisma.bookingMaster.update({
      where: { id },
      data: {
        ...data,
        awbNo: String(data.awbNo),
        pin: String(data.pin),
        pcs: Number(data.pcs),
        invoiceValue: Number(data.invoiceValue),
        actualWeight: Number(data.actualWeight),
        chargeWeight: Number(data.chargeWeight),
        invoiceWt: Number(data.invoiceWt),
        clientBillingValue: Number(data.clientBillingValue),
        creditCustomerAmount: Number(data.creditCustomerAmount),
        regularCustomerAmount: Number(data.regularCustomerAmount),
        pendingDaysNotDelivered: Number(data.pendingDaysNotDelivered),
        shipmentCostOtherMode: Number(data.shipmentCostOtherMode),
        bookingDate: new Date(data.bookingDate),
        statusDate: data.statusDate ? new Date(data.statusDate) : null,
      },
    });
    console.log("Updated booking:", booking);
    return NextResponse.json(booking);
  } catch (error) {
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