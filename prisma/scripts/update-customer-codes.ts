import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting customer code update...');

  const customers = await prisma.customerMaster.findMany({
    orderBy: {
      id: 'asc'
    },
    select: {
      id: true, 
      customerCode: true
    }
  });
    
  console.log(`Found ${customers.length} customers to update.`);
    
  for (let i = 0; i < customers.length; i++) {
    const newCode = `CUST-${String(i + 1).padStart(4, '0')}`;
      
    await prisma.customerMaster.update({
      where: {
        id: customers[i].id
      },
      data: {
        customerCode: newCode
      }
    });
      
    console.log(`Updated ${customers[i].customerCode} → ${newCode}`);
  }
    
  console.log('Customer code update completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });