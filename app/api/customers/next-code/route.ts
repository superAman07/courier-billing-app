import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try { 
    const customers = await prisma.customerMaster.findMany({
      select: {
        customerCode: true
      }
    });
    
    let maxNumber = 0;
    
    customers.forEach(customer => {
      if (customer.customerCode) { 
        const match = customer.customerCode.match(/CUST-(\d+)/);
        if (match && match[1]) {
          const number = parseInt(match[1], 10);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    });
    const nextNumber = maxNumber + 1;
    
    return NextResponse.json({ nextNumber });
    
  } catch (error) {
    console.error("Error generating next customer code:", error);
    return NextResponse.json(
      { error: "Failed to generate customer code" }, 
      { status: 500 }
    );
  }
}