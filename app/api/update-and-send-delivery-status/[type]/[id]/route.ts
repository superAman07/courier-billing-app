import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string, id: string }>}) {
  const { type, id } = await params;
  const data = await req.json();

  let model;
  switch (type) {
    case "BookingMaster":
      model = prisma.bookingMaster;
      break;
    case "CashBooking":
      model = prisma.cashBooking;
      break;
    case "CreditClientBooking":
      model = prisma.creditClientBooking;
      break;
    case "InternationalCashBooking":
      model = prisma.internationalCashBooking;
      break;
    case "InternationalCreditClientBooking":
      model = prisma.internationalCreditClientBooking;
      break;
    default:
      return NextResponse.json({ message: "Invalid booking type" }, { status: 400 });
  }

  try {
    let updateData: any = {};
    if (type === "BookingMaster") {
      updateData.status = data.status;
      updateData.statusDate = data.statusDate ? new Date(data.statusDate) : null;
    } else {
      updateData.smsSent = data.smsSent ?? false;
      updateData.smsDate = data.smsDate ? new Date(data.smsDate) : null;
    }

    const updated = await (model as any).update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Error updating booking" }, { status: 500 });
  }
}