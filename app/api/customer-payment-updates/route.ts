import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const type = searchParams.get('type');

    try {
        const whereClause: any = {};

        if (customerId) {
            whereClause.customerId = customerId;
        }
        if (type) {
            whereClause.type = type;
        }

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            orderBy: {
                invoiceDate: 'desc',
            },
            include: {
                customer: true,
            }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ message: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const customerId = formData.get('customerId') as string;
        const paymentAmount = parseFloat(formData.get('amount') as string);
        const paymentDate = new Date(formData.get('paymentDate') as string);
        const paymentMethod = formData.get('paymentMethod') as string;
        const referenceNo = formData.get('referenceNo') as string;
        const receivedBy = formData.get('receivedBy') as string | null;
        const remarks = formData.get('remarks') as string | null;
        const discuss = formData.get('discuss') as string | null;
        const imageFile = formData.get('image') as File | null;

        let imageUrl: string | undefined = undefined;

        if (!customerId || !paymentAmount || !paymentDate || !paymentMethod) {
            return NextResponse.json({ message: "Missing required fields: customerId, amount, paymentDate, paymentMethod" }, { status: 400 });
        }

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return NextResponse.json({ message: "Invalid payment amount" }, { status: 400 });
        }

        // The entire logic is wrapped in a transaction to ensure data integrity.
        // If any step fails, the whole operation is rolled back.
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the main payment record.
            const customerPayment = await tx.customerPayment.create({
                data: {
                    customerId,
                    amount: paymentAmount,
                    paymentDate,
                    paymentMethod,
                    referenceNo,
                    imageUrl,
                    receivedBy,
                    remarks,
                    discuss,
                },
            });

            // 2. Find all unpaid or partially paid invoices for this customer, oldest first.
            const invoicesToPay = await tx.invoice.findMany({
                where: {
                    customerId,
                    paymentStatus: {
                        in: [PaymentStatus.UNPAID, PaymentStatus.PARTIALLY_PAID],
                    },
                },
                orderBy: {
                    invoiceDate: 'asc',
                },
            });

            let remainingPayment = paymentAmount;
            let appliedCount = 0;

            // 3. Apply the payment amount across the invoices.
            for (const invoice of invoicesToPay) {
                if (remainingPayment <= 0) break;

                const dueAmount = invoice.netAmount - invoice.amountPaid;
                const amountToApply = Math.min(remainingPayment, dueAmount);

                if (amountToApply > 0) {
                    // Create a record linking this payment to this invoice.
                    await tx.paymentOnInvoice.create({
                        data: {
                            paymentId: customerPayment.id,
                            invoiceId: invoice.id,
                            amountApplied: amountToApply,
                        },
                    });

                    // Update the invoice's paid amount and status.
                    const newAmountPaid = invoice.amountPaid + amountToApply;
                    let newStatus = invoice.paymentStatus;
                    let finalAmountPaid = newAmountPaid;

                    const remainingDue = invoice.netAmount - newAmountPaid;
                    if (newAmountPaid >= invoice.netAmount || (remainingDue > 0 && remainingDue < 1)) {
                        newStatus = PaymentStatus.PAID;
                        finalAmountPaid = invoice.netAmount;
                    } else {
                        newStatus = PaymentStatus.PARTIALLY_PAID;
                    }

                    await tx.invoice.update({
                        where: { id: invoice.id },
                        data: {
                            amountPaid: finalAmountPaid,
                            paymentStatus: newStatus,
                        },
                    });

                    remainingPayment -= amountToApply;
                    appliedCount++;
                }
            }

            return { paymentId: customerPayment.id, invoicesUpdated: appliedCount };
        });

        return NextResponse.json({
            message: `Payment of ${paymentAmount} recorded successfully. Updated ${result.invoicesUpdated} invoice(s).`,
            data: result,
        }, { status: 201 });

    } catch (error) {
        console.error("Failed to record payment:", error);
        return NextResponse.json({ message: "An error occurred while recording the payment." }, { status: 500 });
    }
}