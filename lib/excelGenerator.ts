import ExcelJS from 'exceljs';

export const generateCashInvoiceExcel = async (invoice: any) => {
    if (!invoice) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');
    // --- STYLES ---
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
    totalLabelCell.border = { top: { style: 'thin' } }; // Top border only for label side
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

    // --- GENERATE AND DOWNLOAD ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Invoice_${invoice.invoiceNo}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

// Placeholder for Credit Invoice (can be expanded later)
export const generateCreditInvoiceExcel = async (invoice: any, company: any) => {
    // Similar structure but with different columns (GST, etc.)
    // ...
};
