import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';

interface ExcelRow {
  [key: string]: any;
  'AWB Number'?: string;
  'Status Date'?: string | number;
  'Received By'?: string;
  'Status'?: string;
}

function parseExcelDate(excelDate: string | number | undefined): Date | null {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    const date = XLSX.SSF.parse_date_code(excelDate);
    if (date) {
      return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
    }
  }
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { fileData } = await req.json();

    if (!fileData || !fileData.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
    }

    const base64 = fileData.split(',')[1];
    const fileBuffer = Buffer.from(base64, 'base64');

    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    let updated = 0, skipped = 0, notFound = 0;
    const transactions = [];

    for (const row of records) {
      const awbNo = row['AWB Number']?.toString().trim();
      const newStatus = row['Status']?.toString().trim();
      const statusDate = parseExcelDate(row['Status Date']);
      const receivedBy = row['Received By']?.toString().trim();

      if (!awbNo) continue;

      const updateData: any = {};
      if (newStatus) updateData.status = newStatus;
      if (statusDate) updateData.statusDate = statusDate;
      if (receivedBy) updateData.receiverName = receivedBy;

      if (Object.keys(updateData).length > 0) {
        transactions.push(
          prisma.bookingMaster.updateMany({
            where: { awbNo: awbNo },
            data: updateData,
          })
        );
      }
    }

    const results = await prisma.$transaction(transactions);
    updated = results.reduce((acc, result) => acc + result.count, 0);
    notFound = records.length - updated;


    return NextResponse.json({
      message: `Import complete: ${updated} bookings updated, ${notFound} not found.`,
    });
  } catch (error: any) {
    console.error("Bulk status upload error:", error);
    return NextResponse.json({ error: `Failed to process file: ${error.message}` }, { status: 500 });
  }
}


// import { NextRequest, NextResponse } from 'next/server';
// import * as XLSX from 'xlsx';
// import prisma from '@/lib/prisma';

// interface ExcelRow {
//   [key: string]: any;
//   awbNo?: string;
//   'AWB Number'?: string;
//   status?: string;
//   Status?: string;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { fileData } = await req.json();

//     if (!fileData || !fileData.startsWith('data:application')) {
//       return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
//     }

//     // Strip off the metadata prefix and decode base64 to buffer
//     const base64 = fileData.split(',')[1];
//     const fileBuffer = Buffer.from(base64, 'base64');

//     const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const records = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

//     let updated = 0, skipped = 0, notFound = 0;

//     for (const row of records) {
//       const rawAwbNo = row.awbNo ?? row["AWB Number"];
//       const newStatus = row.status ?? row['Status'];
//       if (!rawAwbNo || !newStatus) continue;
//       const awbNo = String(rawAwbNo);

//       const booking = await prisma.bookingMaster.findUnique({ where: { awbNo } });
//       if (!booking) {
//         notFound++;
//         continue;
//       }
//       if (!booking.status) {
//         await prisma.bookingMaster.update({
//           where: { awbNo },
//           data: { status: newStatus, statusDate: new Date() },
//         });
//         updated++;
//       } else {
//         skipped++;
//       }
//     }

//     return NextResponse.json({
//       message: `Import complete: Updated ${updated}, Skipped ${skipped}, Not found ${notFound}`,
//     });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
