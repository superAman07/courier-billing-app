import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';

interface ExcelRow {
  [key: string]: any;
  awbNo?: string;
  'AWB Number'?: string;
  status?: string;
  Status?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { fileData } = await req.json();

    if (!fileData || !fileData.startsWith('data:application')) {
      return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
    }

    // Strip off the metadata prefix and decode base64 to buffer
    const base64 = fileData.split(',')[1];
    const fileBuffer = Buffer.from(base64, 'base64');

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    let updated = 0, skipped = 0, notFound = 0;

    for (const row of records) {
      const rawAwbNo = row.awbNo ?? row["AWB Number"];
      const newStatus = row.status ?? row['Status'];
      if (!rawAwbNo || !newStatus) continue;
      const awbNo = String(rawAwbNo);

      const booking = await prisma.bookingMaster.findUnique({ where: { awbNo } });
      if (!booking) {
        notFound++;
        continue;
      }
      if (!booking.status) {
        await prisma.bookingMaster.update({
          where: { awbNo },
          data: { status: newStatus, statusDate: new Date() },
        });
        updated++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      message: `Import complete: Updated ${updated}, Skipped ${skipped}, Not found ${notFound}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
