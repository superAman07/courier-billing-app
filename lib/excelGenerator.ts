import ExcelJS from 'exceljs';

// --- Shared Styles ---
const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
};
const centerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
const rightAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'right' };
const leftAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left' };
const boldFont = { bold: true, name: 'Calibri', size: 11 };
const titleFont = { bold: true, name: 'Calibri', size: 16 };

export const generateCashInvoiceExcel = async (invoice: any) => {
    if (!invoice) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    // --- 1. HEADER SECTION ---
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'AGS Courier';
    titleCell.font = titleFont;
    titleCell.alignment = centerAlign;
    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = 'Shop No.: 570/326, VIP Road, Sainik Nagar,';
    worksheet.getCell('A2').alignment = centerAlign;
    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = 'Lucknow - 226002 - Uttar Pradesh';
    worksheet.getCell('A3').alignment = centerAlign;
    worksheet.mergeCells('A4:F4');
    worksheet.getCell('A4').value = 'Phone : 9129759990';
    worksheet.getCell('A4').alignment = centerAlign;
    worksheet.addRow([]); // Spacer

    // --- 2. INVOICE META ---
    worksheet.mergeCells('A6:F6');
    worksheet.getCell('A6').value = `Invoice Date : ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}`;
    worksheet.getCell('A6').font = boldFont;
    if (invoice.periodFrom && invoice.periodTo) {
        worksheet.mergeCells('A7:F7');
        worksheet.getCell('A7').value = `Period : ${new Date(invoice.periodFrom).toLocaleDateString('en-GB')} to ${new Date(invoice.periodTo).toLocaleDateString('en-GB')}`;
        worksheet.getCell('A7').font = boldFont;
    }
    worksheet.addRow([]); // Spacer

    // --- 3. CUSTOMER DETAILS ---
    worksheet.mergeCells('B9:F9');
    worksheet.getCell('A9').value = 'To,';
    worksheet.getCell('A9').font = boldFont;
    worksheet.getCell('B9').value = invoice.customer?.customerName || invoice.bookings?.[0]?.senderName || 'Cash Customer';
    worksheet.mergeCells('B10:F10');
    worksheet.getCell('A10').value = 'Address';
    worksheet.getCell('A10').font = boldFont;
    worksheet.getCell('B10').value = invoice.customer?.address || invoice.bookings?.[0]?.location || '';
    worksheet.mergeCells('B11:F11');
    worksheet.getCell('A11').value = 'Phone :';
    worksheet.getCell('A11').font = boldFont;
    worksheet.getCell('B11').value = invoice.customer?.phone || invoice.customer?.mobile || '';
    worksheet.addRow([]); // Spacer

    // --- 4. TABLE HEADER ---
    const headerRow = worksheet.addRow(['Sr.', 'Booking Date', 'Consignment No.', 'Destination City', 'Weight', 'Amt.']);
    headerRow.eachCell((cell) => {
        cell.font = boldFont;
        cell.border = borderStyle;
        cell.alignment = centerAlign;
    });

    // --- 5. TABLE DATA ---
    const bookings = (invoice.bookings || []).sort((a: any, b: any) =>
        new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
    );
    const exactTotal = bookings.reduce((acc: number, b: any) => acc + Math.round(b.clientBillingValue || 0), 0) || 0;

    bookings.forEach((item: any, idx: number) => {
        const weight = item.invoiceWt || item.chargeWeight || item.weight || item.actualWeight || 0;
        const row = worksheet.addRow([
            idx + 1,
            new Date(item.bookingDate).toLocaleDateString('en-GB'),
            item.consignmentNo,
            item.destinationCity || item.city,
            Number(weight).toFixed(3),
            Math.round(item.clientBillingValue || 0)
        ]);
        row.eachCell((cell, colNumber) => {
            cell.border = borderStyle;
            if (colNumber === 5 || colNumber === 6) {
                cell.alignment = rightAlign;
            } else {
                cell.alignment = leftAlign;
            }
        });
    });

    // --- 6. TOTAL ---
    const totalRow = worksheet.addRow(['Total', '', '', '', '', exactTotal]);
    worksheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);

    const totalLabelCell = worksheet.getCell(`A${totalRow.number}`);
    totalLabelCell.value = 'Total';
    totalLabelCell.font = boldFont;
    totalLabelCell.alignment = rightAlign;
    totalLabelCell.border = { top: { style: 'thin' } };
    const totalValueCell = worksheet.getCell(`F${totalRow.number}`);
    totalValueCell.font = boldFont;
    totalValueCell.alignment = rightAlign;
    totalValueCell.border = { top: { style: 'thin' }, left: { style: 'thin' } };

    worksheet.addRow([]); // Spacer
    worksheet.addRow([]); // Spacer

    // --- 7. FOOTER ---
    const lastRow = worksheet.rowCount + 1;
    worksheet.mergeCells(`E${lastRow}:F${lastRow}`);
    const thanksCell = worksheet.getCell(`E${lastRow}`);
    thanksCell.value = 'Thanks';
    thanksCell.alignment = rightAlign;

    // --- 8. NOTES ---
    const startNoteRow = worksheet.rowCount + 2;
    worksheet.mergeCells(`A${startNoteRow}:F${startNoteRow}`);
    worksheet.getCell(`A${startNoteRow}`).value = 'Note-All Billing related issues must be raised and must be clarified within 5 days of Bill submission.';
    worksheet.getCell(`A${startNoteRow}`).alignment = { wrapText: true };
    worksheet.getCell(`A${startNoteRow}`).font = { size: 9 };

    const note2Row = startNoteRow + 1;
    worksheet.mergeCells(`A${note2Row}:F${note2Row}`);
    worksheet.getCell(`A${note2Row}`).value = 'For Non insured (No Risk) shipment, Consigner or Consignee will not be right to claim any shortage / misplaced / damage.';
    worksheet.getCell(`A${note2Row}`).alignment = { wrapText: true };
    worksheet.getCell(`A${note2Row}`).font = { size: 9 };

    const note3Row = note2Row + 1;
    worksheet.mergeCells(`A${note3Row}:F${note3Row}`);
    worksheet.getCell(`A${note3Row}`).value = 'For Lost of Non insured shipment, Company will provide FIR Copy.';
    worksheet.getCell(`A${note3Row}`).alignment = { wrapText: true };
    worksheet.getCell(`A${note3Row}`).font = { size: 9 };

    // Column Widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 12;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Invoice_${invoice.invoiceNo}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

export const generateCreditInvoiceExcel = async (invoice: any, company: any) => {
    if (!invoice || !company) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    // --- 1. HEADER SECTION ---
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = company.companyName || 'Awdhoot Global Solutions';
    titleCell.font = { ...titleFont, size: 20 };
    titleCell.alignment = centerAlign;

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Shop No.: ${company.address || '570/326, VIP Road, Sainik Nagar,'}`;
    worksheet.getCell('A2').alignment = centerAlign;

    worksheet.mergeCells('A3:J3');
    worksheet.getCell('A3').value = `${company.city || 'Lucknow'} - ${company.pincode || '226002'} - ${(company.state || 'Uttar Pradesh').toUpperCase()}`;
    worksheet.getCell('A3').alignment = centerAlign;

    worksheet.mergeCells('A4:J4');
    worksheet.getCell('A4').value = `Phone : ${company.phone || company.mobile || '8853099924'}`;
    worksheet.getCell('A4').alignment = centerAlign;

    worksheet.mergeCells('A5:J5');
    worksheet.getCell('A5').value = `GST No : ${company.gstNo || '09BLUPS9727E1Z7'}, ${(company.state || 'Uttar Pradesh').toUpperCase()}`;
    worksheet.getCell('A5').alignment = centerAlign;
    worksheet.getCell('A5').font = { ...boldFont, size: 10 };

    worksheet.addRow([]);

    // --- 2. INVOICE META & CUSTOMER (Split 50/50 approx) ---
    // Left Side (Invoice Details)
    const metaStartRow = 7;
    worksheet.getCell(`A${metaStartRow}`).value = 'Invoice No :';
    worksheet.getCell(`A${metaStartRow}`).font = boldFont;
    worksheet.getCell(`B${metaStartRow}`).value = invoice.invoiceNo;

    worksheet.getCell(`A${metaStartRow + 1}`).value = 'Invoice Date :';
    worksheet.getCell(`A${metaStartRow + 1}`).font = boldFont;
    worksheet.getCell(`B${metaStartRow + 1}`).value = new Date(invoice.invoiceDate).toLocaleDateString('en-GB');

    if (invoice.periodFrom && invoice.periodTo) {
        worksheet.getCell(`A${metaStartRow + 2}`).value = 'Period :';
        worksheet.getCell(`A${metaStartRow + 2}`).font = boldFont;
        worksheet.mergeCells(`B${metaStartRow + 2}:C${metaStartRow + 2}`);
        worksheet.getCell(`B${metaStartRow + 2}`).value = `${new Date(invoice.periodFrom).toLocaleDateString('en-GB')} to ${new Date(invoice.periodTo).toLocaleDateString('en-GB')}`;
    }

    worksheet.getCell(`A${metaStartRow + 3}`).value = 'SAC Code :';
    worksheet.getCell(`A${metaStartRow + 3}`).font = boldFont;
    worksheet.getCell(`B${metaStartRow + 3}`).value = company.hsnSacCode || 'N/A';

    // Right Side (Customer Details) - Starting at Column E
    worksheet.getCell(`E${metaStartRow}`).value = 'To,';
    worksheet.getCell(`E${metaStartRow}`).font = boldFont;
    worksheet.mergeCells(`F${metaStartRow}:J${metaStartRow}`);
    worksheet.getCell(`F${metaStartRow}`).value = invoice.customer?.customerName || '';

    worksheet.getCell(`E${metaStartRow + 1}`).value = 'Address :';
    worksheet.getCell(`E${metaStartRow + 1}`).font = boldFont;
    worksheet.mergeCells(`F${metaStartRow + 1}:J${metaStartRow + 1}`);
    worksheet.getCell(`F${metaStartRow + 1}`).value = invoice.customer?.address || '';

    worksheet.getCell(`E${metaStartRow + 2}`).value = 'Phone :';
    worksheet.getCell(`E${metaStartRow + 2}`).font = boldFont;
    worksheet.mergeCells(`F${metaStartRow + 2}:J${metaStartRow + 2}`);
    worksheet.getCell(`F${metaStartRow + 2}`).value = invoice.customer?.phone || invoice.customer?.mobile || 'N/A';

    worksheet.getCell(`E${metaStartRow + 3}`).value = 'GSTN No-';
    worksheet.getCell(`E${metaStartRow + 3}`).font = boldFont;
    worksheet.mergeCells(`F${metaStartRow + 3}:J${metaStartRow + 3}`);
    worksheet.getCell(`F${metaStartRow + 3}`).value = invoice.customer?.gstNo || '';

    worksheet.addRow([]); // Spacer

    // --- 3. DYNAMIC TABLE ---
    const bookings = (invoice.bookings || []).sort((a: any, b: any) =>
        new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
    );
    const showConsignmentValue = bookings.some((b: any) => Number(b.consignmentValue) > 49999);

    // Define Columns
    const columns = [
        'Sr.',
        'Booking Date',
        'Consignment No.',
        'Destination City',
        'Mode',
        'Dox/Non Dox',
        'No. of Pcs',
        'Service Type',
        'Weight'
    ];
    if (showConsignmentValue) columns.push('Material Value');
    columns.push('FR Charge');

    const headerRow = worksheet.addRow(columns);
    headerRow.eachCell((cell) => {
        cell.font = boldFont;
        cell.border = borderStyle;
        cell.alignment = centerAlign;
    });

    let currentRowIdx = headerRow.number + 1;

    bookings.forEach((item: any, idx: number) => {
        const rawWeight = item.invoiceWt || item.chargeWeight || item.weight || item.actualWeight || 0;
        const weight = Number(rawWeight);

        const rowData = [
            idx + 1,
            new Date(item.bookingDate).toLocaleDateString('en-GB'),
            item.consignmentNo,
            item.destinationCity || item.city || item.location || '',
            item.mode || item.serviceType || '',
            item.doxType || (item.docType === 'D' ? 'DOX' : 'NON-DOX') || '',
            item.numPcs ?? '',
            item.serviceType || (item.bookingType === 'BookingMaster' ? 'DOMESTIC' : '') || '',
            weight > 0 ? weight.toFixed(3) : '0.000'
        ];

        if (showConsignmentValue) {
            rowData.push(item.consignmentValue > 49999 ? Number(item.consignmentValue).toFixed(2) : '-');
        }

        rowData.push(Number(item.frCharge || 0).toFixed(2));

        const row = worksheet.addRow(rowData);
        row.eachCell((cell, colNum) => {
            cell.border = borderStyle;
            cell.alignment = centerAlign; // Default center

            // Adjust alignments
            const isWeight = colNum === columns.length - (showConsignmentValue ? 2 : 1); // 2nd last or last?
            // Actually simpler:
            const lastColIndex = columns.length;
            if (colNum === lastColIndex) cell.alignment = rightAlign; // FR Charge (Amount)
            if (colNum === 1) cell.alignment = centerAlign; // Sr
            if (colNum === 4) cell.alignment = leftAlign; // Dest City
        });
        currentRowIdx++;
    });

    // --- 4. TOTALS SECTION ---
    // Calculations
    const frChargeTotal = bookings.reduce((s: number, b: any) => s + Number(b.frCharge || 0), 0);
    const shipperCostTotal = bookings.reduce((s: number, b: any) => s + Number(b.shipperCost || 0), 0);
    const waybillSurchargeTotal = bookings.reduce((s: number, b: any) => s + Number(b.waybillSurcharge || 0), 0);
    const otherExpTotal = bookings.reduce((s: number, b: any) => s + Number(b.otherExp || 0), 0);
    const fuelSurchargeTotal = bookings.reduce((s: number, b: any) => s + Number(b.fuelSurcharge || 0), 0);

    const taxableValue = invoice.totalAmount;
    const igstAmount = invoice.totalTax;
    const totalAfterTax = invoice.netAmount;
    const finalAmount = Math.round(totalAfterTax);
    const gstRate = taxableValue > 0 ? (igstAmount / taxableValue) * 100 : 0;

    const companyStateCode = company?.gstNo?.substring(0, 2);
    const customerStateCode = invoice.customer?.gstNo?.substring(0, 2);
    const isIntraState = companyStateCode && customerStateCode && companyStateCode === customerStateCode;

    const colSpan = columns.length - 1; // Span until last column
    const colStartChar = 'A';
    const colEndChar = String.fromCharCode(65 + colSpan - 1); // e.g. J
    const valueColChar = String.fromCharCode(65 + colSpan); // e.g. K

    // Helper to add summary row
    const addSummaryRow = (label: string, value: any, isBold = false) => {
        const r = worksheet.addRow([]);
        // We set values manually
        // Convert column index 1..N to letter for merging? 
        // ExcelJS mergeCells can take top, left, bottom, right.

        // Merge A to (Last-1)
        worksheet.mergeCells(r.number, 1, r.number, colSpan);

        const labelCell = worksheet.getCell(r.number, colSpan); // The rightmost cell of the merge?
        // Actually when merging, we set value to top-left (1)
        const firstCell = worksheet.getCell(r.number, 1);
        firstCell.value = label;
        firstCell.alignment = rightAlign;
        if (isBold) firstCell.font = boldFont;
        firstCell.border = borderStyle;

        // Apply border to all merged cells? No heavily merged.
        // ExcelJS: "The cell range will be merged... styles... applied to top-left"
        // But we want right alignment visual.

        const valCell = worksheet.getCell(r.number, colSpan + 1);
        valCell.value = value;
        valCell.alignment = centerAlign;
        if (isBold) valCell.font = boldFont;
        valCell.border = borderStyle;
    };

    addSummaryRow('Shipper Cost', shipperCostTotal.toFixed(2));
    addSummaryRow('Way Bill Surcharge @ 0.2%', waybillSurchargeTotal.toFixed(2));
    addSummaryRow('Other Exp.', otherExpTotal.toFixed(2));
    addSummaryRow('Fuel Surcharge', fuelSurchargeTotal.toFixed(2));
    addSummaryRow('Taxable Value :', taxableValue.toFixed(2));

    if (isIntraState) {
        addSummaryRow(`CGST ${(gstRate / 2).toFixed(0)}%`, (igstAmount / 2).toFixed(2));
        addSummaryRow(`SGST ${(gstRate / 2).toFixed(0)}%`, (igstAmount / 2).toFixed(2));
    } else {
        addSummaryRow(`IGST ${gstRate.toFixed(0)}%`, igstAmount.toFixed(2));
    }

    addSummaryRow('Total :', totalAfterTax.toFixed(2), true);
    addSummaryRow('Round Off', finalAmount, false);

    worksheet.addRow([]);

    // --- 5. FOOTER NOTES & SIGNATURE ---
    const lastRow = worksheet.rowCount + 1;

    // Notes
    const noteStart = lastRow;
    worksheet.getCell(`A${noteStart}`).value = 'Note: All Billing related issues must be raised and must be clarified within 5 days of Bill submission.';
    worksheet.getCell(`A${noteStart + 1}`).value = 'For Non insured (No Risk) shipment, Consigner or Consignee will not be right to claim any shortage / misplaced / damage.';
    worksheet.getCell(`A${noteStart + 2}`).value = 'For Lost of Non insured shipment, Company will provide FIR Copy.';

    // Signature
    const signRow = noteStart + 4;
    worksheet.mergeCells(`G${signRow}:J${signRow}`);
    worksheet.getCell(`G${signRow}`).value = `For M/S ${company.companyName || 'Awdhoot Global Solutions'}`;
    worksheet.getCell(`G${signRow}`).alignment = rightAlign;

    worksheet.mergeCells(`G${signRow + 2}:J${signRow + 2}`);
    worksheet.getCell(`G${signRow + 2}`).value = 'Authorized Signatory';
    worksheet.getCell(`G${signRow + 2}`).alignment = rightAlign;
    worksheet.getCell(`G${signRow + 2}`).border = { top: { style: 'thin' } };

    // Auto-fit columns (Approximate)
    worksheet.getColumn(1).width = 5;  // Sr
    worksheet.getColumn(2).width = 12; // Date
    worksheet.getColumn(3).width = 15; // Consignment
    worksheet.getColumn(4).width = 15; // City
    worksheet.getColumn(5).width = 10; // Mode
    worksheet.getColumn(6).width = 10; // Dox
    worksheet.getColumn(7).width = 8;  // Pcs
    worksheet.getColumn(8).width = 12; // Service
    worksheet.getColumn(9).width = 10; // Weight
    if (showConsignmentValue) worksheet.getColumn(10).width = 12; // Mat Val
    worksheet.getColumn(showConsignmentValue ? 11 : 10).width = 12; // FR Charge

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Invoice_${invoice.invoiceNo}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

export const generateMonthlyAttendanceExcel = async (data: any[], month: number, year: number) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Attendance');
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    // --- Header ---
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = `Monthly Attendance Report - ${monthName} ${year}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = centerAlign;

    // --- Columns Setup ---
    // Fixed Columns: Name, Code
    // Dynamic Columns: 1 to 31
    // Summary Columns: Total Present, Absent, Late, Overtime, Travel Amt, Fine, Advance
    
    const headerRow = worksheet.addRow(['Code', 'Employee Name']);
    
    // Add Day Columns
    for (let i = 1; i <= daysInMonth; i++) {
        headerRow.getCell(i + 2).value = i;
    }

    // Add Summary Headers
    const summaryStartCol = daysInMonth + 3;
    const summaryHeaders = ['Present', 'Absent', 'Total Hrs', 'OT Hrs', 'Late (Min)', 'Travel Amount', 'Fine', 'Advance'];
    summaryHeaders.forEach((h, idx) => {
        headerRow.getCell(summaryStartCol + idx).value = h;
    });

    // Style Header
    headerRow.eachCell(cell => {
        cell.font = boldFont;
        cell.border = borderStyle;
        cell.alignment = centerAlign;
        if (typeof cell.value === 'number') {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEEEEEE' }
            };
        }
    });

    // --- Data Rows ---
    data.forEach(emp => {
        const rowData = [emp.employeeCode, emp.employeeName];
        
        let presentCount = 0;
        let absentCount = 0;
        let totalHrs = 0;
        let otHrs = 0;
        let lateMins = 0;
        let travelAmt = 0;
        let fineAmt = 0;
        let advanceAmt = 0;

        // Fill Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            // Find record for this date (ignoring time component match issues)
            const record = emp.attendance.find((a: any) => new Date(a.date).getDate() === i);
            
            let statusChar = '-';
            if (record) {
                if (record.status === 'Present') { statusChar = 'P'; presentCount++; }
                else if (record.status === 'Absent') { statusChar = 'A'; absentCount++; }
                else if (record.status === 'HalfDay') { statusChar = 'HD'; presentCount += 0.5; }
                else if (record.status === 'Leave') { statusChar = 'L'; }
                else if (record.status === 'Holiday') { statusChar = 'H'; }
                
                totalHrs += Number(record.totalHours || 0);
                otHrs += Number(record.overtimeHours || 0);
                lateMins += Number(record.lateByMinutes || 0);
                travelAmt += Number(record.travelAmount || 0);
                fineAmt += Number(record.fineAmount || 0);
                advanceAmt += Number(record.advanceAmount || 0);
            }
            rowData.push(statusChar);
        }

        // Add Summary Data
        rowData.push(presentCount);
        rowData.push(absentCount);
        rowData.push(totalHrs.toFixed(2));
        rowData.push(otHrs.toFixed(2));
        rowData.push(lateMins);
        rowData.push(travelAmt.toFixed(2));
        rowData.push(fineAmt.toFixed(2));
        rowData.push(advanceAmt.toFixed(2));

        const row = worksheet.addRow(rowData);
        
        // Style Data Row
        row.eachCell((cell, colNum) => {
            cell.border = borderStyle;
            cell.alignment = centerAlign;
            
            // Color Code Status
            if (colNum > 2 && colNum <= daysInMonth + 2) {
                if (cell.value === 'A') cell.font = { color: { argb: 'FFFF0000' }, bold: true };
                if (cell.value === 'P') cell.font = { color: { argb: 'FF008000' } };
            }
        });
    });

    // Auto fit
    worksheet.getColumn(1).width = 10; // Code
    worksheet.getColumn(2).width = 20; // Name
    for(let i=1; i<=daysInMonth; i++) worksheet.getColumn(i+2).width = 4; // Days

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Attendance_${monthName}_${year}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};