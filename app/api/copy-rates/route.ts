import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { sourceCustomerId, destinationCustomerIds, sectorNames } = await req.json();

        if (!sourceCustomerId || !destinationCustomerIds || !Array.isArray(destinationCustomerIds) || destinationCustomerIds.length === 0) {
            return NextResponse.json({ error: "Source and destination customers are required." }, { status: 400 });
        }

        const whereClause: any = { customerId: sourceCustomerId };
        if (sectorNames && Array.isArray(sectorNames) && sectorNames.length > 0) {
            whereClause.sectorName = { in: sectorNames };
        }

        const sourceRates = await prisma.sectorRate.findMany({
            where: whereClause,
        });

        if (sourceRates.length === 0) {
            return NextResponse.json({ error: "Source customer has no matching rates to copy." }, { status: 404 });
        }

        const operations = destinationCustomerIds.flatMap(destId =>
            sourceRates.map(rate => {
                const { id, customerId, ...rateData } = rate;
                return prisma.sectorRate.upsert({
                    where: { customerId_sectorName: { customerId: destId, sectorName: rate.sectorName } },
                    update: rateData,
                    create: {
                        ...rateData,
                        customerId: destId,
                    },
                });
            })
        );

        // 3. Execute all operations in a single transaction
        await prisma.$transaction(operations);

        return NextResponse.json({ message: `Rates successfully copied to ${destinationCustomerIds.length} customer(s).` });

    } catch (error) {
        console.error("Failed to copy rates:", error);
        return NextResponse.json({ error: "An error occurred while copying rates." }, { status: 500 });
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest) {
//     try {
//         const { sourceCustomerId, destinationCustomerIds } = await req.json();

//         if (!sourceCustomerId || !destinationCustomerIds || !Array.isArray(destinationCustomerIds) || destinationCustomerIds.length === 0) {
//             return NextResponse.json({ error: "Source and destination customers are required." }, { status: 400 });
//         }

//         const sourceRates = await prisma.sectorRate.findMany({
//             where: { customerId: sourceCustomerId },
//         });

//         if (sourceRates.length === 0) {
//             return NextResponse.json({ error: "Source customer has no rates to copy." }, { status: 404 });
//         }

//         const operations = destinationCustomerIds.flatMap(destId =>
//             sourceRates.map(rate => {
//                 const { id, customerId, ...rateData } = rate;
//                 return prisma.sectorRate.upsert({
//                     where: { customerId_sectorName: { customerId: destId, sectorName: rate.sectorName } },
//                     update: rateData,
//                     create: {
//                         ...rateData,
//                         customerId: destId,
//                     },
//                 });
//             })
//         );
 
//         await prisma.$transaction(operations);

//         return NextResponse.json({ message: `Rates successfully copied to ${destinationCustomerIds.length} customer(s).` });

//     } catch (error) {
//         console.error("Failed to copy rates:", error);
//         return NextResponse.json({ error: "An error occurred while copying rates." }, { status: 500 });
//     }
// }