import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { bookings: true, customer: true },
    });
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching invoice" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    const data = await req.json();
    const allowedFields = ["invoiceDate"];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined && data[key] !== "") {
        updateData[key] = key === "invoiceDate" ? new Date(data[key]) : data[key];
      }
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
    }
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.log("Error updating invoice:", error);
    return NextResponse.json({ message: "Error updating invoice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    // Find invoice and its bookings
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }
    // Update bookings' status back to BOOKED
    const bookingIds = invoice.bookings.map(b => b.bookingId);
    if (invoice.type === "CashBooking") {
      await prisma.cashBooking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: "BOOKED" },
      });
    } else if (invoice.type === "InternationalCashBooking") {
      await prisma.internationalCashBooking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: "BOOKED" },
      });
    }
    // Delete invoice (cascades to invoiceBooking if FK is set)
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting invoice" }, { status: 500 });
  }
}