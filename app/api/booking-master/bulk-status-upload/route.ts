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

function parseExcelDate(excelDate: any): Date | null {
  if (!excelDate) return null;

  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  if (typeof excelDate === 'string') {
    const parsedDate = new Date(excelDate);
    if (!isNaN(parsedDate.getTime())) {
      return new Date(Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate()
      ));
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

    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    let updated = 0, skipped = 0, notFound = 0;
    const transactions = [];

    for (const row of records) {
      const awbNo = row['AWB Number']?.toString().trim();
      const newStatus = row['Status']?.toString().trim().toUpperCase();
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