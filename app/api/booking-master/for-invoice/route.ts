import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const customerType = searchParams.get("customerType") || "CREDIT";
        const statusParam = searchParams.get("status") || "BOOKED";
        const invoiceType = searchParams.get("type");

        if (!fromDate || !toDate) {
            return NextResponse.json({ message: "Date range is required" }, { status: 400 });
        }

        const statusList = statusParam.split(",").map(s => s.trim()).filter(Boolean);

        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);

        const filters: any = {
            customerType: { in: customerType.split(',').map(s => s.trim()) },
            status: { in: statusList },
            bookingDate: {
                gte: new Date(fromDate),
                lte: toDateObj,
            },
        };

        
        if (customerId) {
            filters.customerId = customerId;
        }

        if (invoiceType && ["Domestic", "International"].includes(invoiceType)) {
            filters.customer = { 
                ...(filters.customer || {}),
                isInternational: invoiceType === "International" 
            };
        }
        // console.log("filters: ", filters);

        const bookings = await prisma.bookingMaster.findMany({
            where: filters,
            include: { customer: true },
            orderBy: { bookingDate: "asc" },
        });
        // console.log("response bookings: ", bookings);
        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Invoice fetch error:", error);
        return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const customerId = searchParams.get("customerId");
//         const fromDate = searchParams.get("fromDate");
//         const toDate = searchParams.get("toDate");
//         const customerType = searchParams.get("customerType") || "CREDIT";
//         const statusParam = searchParams.get("status") || "BOOKED";
//         const invoiceType = searchParams.get("type");

//         // --- DEBUG START: Print Raw Data for this Customer ---
//         if (customerId) {
//             const rawBooking = await prisma.bookingMaster.findFirst({
//                 where: { customerId: customerId },
//                 select: { id: true, awbNo: true, status: true, bookingDate: true, customerType: true }
//             });
//             console.log("🔍 DEBUG - Raw Database Record for Customer:", rawBooking);
//         }
//         // --- DEBUG END ---

//         if (!fromDate || !toDate) {
//             return NextResponse.json({ message: "Date range is required" }, { status: 400 });
//         }

//         const statusList = statusParam.split(",").map(s => s.trim()).filter(Boolean);
//         const typeList = customerType.split(',').map(s => s.trim());

//         // Fix: Ensure 'toDate' covers the entire end of the day
//         const toDateObj = new Date(toDate);
//         toDateObj.setHours(23, 59, 59, 999);

//         // 1. Base Filters
//         const whereClause: any = {
//             // Updated to be case-insensitive for Status if possible (Prisma standard filter is case sensitive)
//             // We will trust the input for now but check the logs.
//             status: { in: statusList },
//             bookingDate: {
//                 gte: new Date(fromDate),
//                 lte: toDateObj,
//             },
//         };

//         // 2. Customer Filters
//         if (customerId) {
//             // CASE A: Specific Customer Selected
//             whereClause.customerId = customerId;
            
//             whereClause.OR = [
//                 { customerType: { in: typeList } },
//                 { customerType: null },
//                 { customerType: "" }
//             ];
            
//         } else {
//             // CASE B: Browsing All (Apply Strict Filters)
//             whereClause.customerType = { in: typeList };
            
//             if (invoiceType && ["Domestic", "International"].includes(invoiceType)) {
//                 whereClause.customer = { 
//                     isInternational: invoiceType === "International" 
//                 };
//             }
//         }

//         console.log("Fetching for:", { customerId, range: `${fromDate} to ${toDate}` });

//         const bookings = await prisma.bookingMaster.findMany({
//             where: whereClause,
//             include: { customer: true },
//             orderBy: { bookingDate: "asc" },
//         });

//         console.log(`Found ${bookings.length} bookings`);

//         return NextResponse.json(bookings);
//     } catch (error) {
//         console.error("Invoice fetch error:", error);
//         return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
//     }
// }