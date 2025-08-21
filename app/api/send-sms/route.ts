import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json(); 
  console.log("Simulated SMS sent to:", data.mobile, "for consignment:", data.consignmentNo);
  return NextResponse.json({ message: "SMS sent (simulated)" });
}

// POST /api/send-sms (for the Send SMS button functionality)
// export async function POST(request: Request) {
//   try {
//     const { bookingType, bookingId, phoneNumber, messageType } = await request.json();
    
//     // Send SMS
//     const smsResult = await sendSMSNotification(phoneNumber, messageType);
    
//     // Update SMS tracking in the appropriate table
//     const updateData = {
//       smsSent: true,
//       smsDate: new Date()
//     };

//     switch(bookingType) {
//       case 'CashBooking':
//         await prisma.cashBooking.update({
//           where: { id: bookingId },
//           data: updateData
//         });
//         break;
//       case 'CreditClientBooking':
//         await prisma.creditClientBooking.update({
//           where: { id: bookingId },
//           data: updateData
//         });
//         break;
//       // Handle other types...
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json({ success: false }, { status: 500 });
//   }
// }
