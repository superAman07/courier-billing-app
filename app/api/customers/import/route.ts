import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { customers } = await req.json();
    
    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format or empty array" },
        { status: 400 }
      );
    }
    
    let added = 0;
    let skipped = 0;
    
    for (const customer of customers) {
      const parentName = customer['Parent Sender Detail']?.toString().trim();
      let childName = customer['Child Sender Detail']?.toString().trim();
      
      if (!parentName) continue;
      
      if (!childName) {
        childName = parentName;
      }
      
      try {
        const existingCustomers = await prisma.customerMaster.findMany({
          select: {
            customerCode: true
          }
        });
        
        let maxNumber = 0;
        
        existingCustomers.forEach(existingCustomer => {
          if (existingCustomer.customerCode) { 
            const match = existingCustomer.customerCode.match(/CUST-(\d+)/);
            if (match && match[1]) {
              const number = parseInt(match[1], 10);
              if (!isNaN(number) && number > maxNumber) {
                maxNumber = number;
              }
            }
          }
        });
        
        const nextNumber = maxNumber + 1;
        const customerCode = `CUST-${String(nextNumber).padStart(4, '0')}`;
        
        const existingCustomer = await prisma.customerMaster.findFirst({
          where: {
            AND: [
              { customerName: parentName },
              { childCustomer: childName }
            ]
          }
        });
        
        if (existingCustomer) {
          skipped++;
          continue;
        }

        await prisma.customerMaster.create({
          data: {
            customerCode,
            customerName: parentName,
            childCustomer: childName,
            isInternational: false,
            balanceType: 'Dr',
            fuelSurchargePercent: 0,
            discountPercent: 0,
            openingBalance: 0
          }
        });
        
        added++;
      } catch (error) {
        console.error(`Error processing customer: ${parentName}`, error);
      }
    }
    
    return NextResponse.json({ added, skipped }, { status: 200 });
  } catch (error) {
    console.error("Error importing customers:", error);
    return NextResponse.json(
      { error: "Failed to import customers" },
      { status: 500 }
    );
  }
}