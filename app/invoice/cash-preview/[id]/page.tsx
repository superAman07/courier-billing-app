'use client';
import { use, useEffect, useState } from 'react';
import axios from 'axios';
import { generateCashInvoiceExcel } from '@/lib/excelGenerator';

export default function CashInvoicePreview({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [invoice, setInvoice] = useState<any>(null);
    useEffect(() => {
        axios.get(`/api/invoices/${id}`).then(res => setInvoice(res.data));
    }, [id]);
    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center text-gray-700 justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        );
    }
    const bookings = (invoice.bookings || []).sort((a: any, b: any) => 
        new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
    );
    const exactTotal = invoice.bookings?.reduce((acc: number, b: any) => acc + Math.round(b.clientBillingValue || 0), 0) || 0;
    const finalTotal = exactTotal;
    const roundOff = 0;
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 text-gray-700 print:p-0 font-sans text-sm">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">AGS Courier</h1>
                <div className="text-xs text-gray-700 space-y-1">
                    <p>Shop No.: 570/326, VIP Road, Sainik Nagar,</p>
                    <p>Lucknow - 226002 - Uttar Pradesh</p>
                    <p>Phone : 9129759990</p>
                </div>
            </div>
            {/* Invoice Meta */}
            <div className="border-t border-b border-dashed border-gray-400 text-gray-700 py-2 mb-4 flex justify-between">
                <div>
                    <div><strong>Invoice Date :</strong> {new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                    {invoice.periodFrom && invoice.periodTo && (
                        <div><strong>Period :</strong> {new Date(invoice.periodFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} to {new Date(invoice.periodTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                    )}
                </div>
            </div>
            {/* Customer Details */}
            <div className="mb-4">
                <div className="grid grid-cols-[80px_1fr] text-gray-700 gap-2">
                    <strong>To,</strong>
                    <div>{invoice.customer?.customerName || invoice.bookings?.[0]?.senderName || 'Cash Customer'}</div>
                    
                    <strong>Address</strong>
                    <div>{invoice.customer?.address || invoice.bookings?.[0]?.location || ''}</div>
                    
                    <strong>Phone :</strong>
                    <div>{invoice.customer?.phone || invoice.customer?.mobile || ''}</div>
                </div>
            </div>
            {/* Table */}
             <div className="border-t border-dashed border-gray-400 text-gray-700 mt-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-1 font-bold w-10">Sr.</th>
                            <th className="py-1 font-bold">Booking Date</th>
                            <th className="py-1 font-bold">Consignment No.</th>
                            <th className="py-1 font-bold">Destination City</th>
                            <th className="py-1 font-bold text-right">Weight</th>
                            <th className="py-1 font-bold text-right">Amt.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((item: any, idx: number) => {
                             // FIXED: Robust weight check similar to original invoice
                             const weight = item.invoiceWt || item.chargeWeight || item.weight || item.actualWeight || 0;
                             
                             return (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-1 font-bold">{idx + 1}</td>
                                    <td className="py-1">{new Date(item.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                                    <td className="py-1">{item.consignmentNo}</td>
                                    <td className="py-1">{item.destinationCity || item.city}</td>
                                    {/* FIXED: Show weight with 3 decimals */}
                                    <td className="py-1 text-right">{Number(weight).toFixed(3)}</td>
                                    {/* FIXED: Show exact decimal amount so math works out */}
                                    <td className="py-1 text-right font-bold ml-1 border-l border-black pl-1">
                                        {Math.round(item.clientBillingValue || 0)}
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={5} className="py-2 text-left font-bold">Total</td>
                            <td className="py-2 text-right font-bold border-l border-black pl-1">
                                {exactTotal}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {/* Footer Sign */}
            <div className="mt-8 text-right">
                <p className="mb-8">Thanks</p>
                
            </div>
            {/* Footer Notes */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
                <p>Note-All Billing related issues must be raised and must be clarified within 5 days of Bill submission.</p>
                <p>For Non insured (No Risk) shipment, Consigner or Consignee will not be right to claim any shortage / misplaced / damage.</p>
                <p>For Lost of Non insured shipment, Company will provide FIR Copy.</p>
            </div>
            <div className="flex justify-center gap-4 mt-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer rounded-lg font-medium"
                >
                    Print Invoice
                </button>
                <button
                    // UPDATED: Use the utility function
                    onClick={() => generateCashInvoiceExcel(invoice)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer rounded-lg font-medium"
                >
                    Export to Excel
                </button>
            </div>
        </div>
    );
}