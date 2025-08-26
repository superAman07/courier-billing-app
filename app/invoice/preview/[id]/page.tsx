'use client';
import { use, useEffect, useState } from 'react';
import axios from 'axios';

export default function InvoicePreview({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [invoice, setInvoice] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);

    useEffect(() => {
        axios.get(`/api/invoices/${id}`).then(res => setInvoice(res.data));
        axios.get('/api/registration-details').then(res => {
            setCompany(Array.isArray(res.data) ? res.data[0] : res.data);
        });
    }, [id]);

    if (!invoice || !company) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="loader" />
                <span className="ml-2 text-gray-500">Loading invoice...</span>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white shadow-lg p-8 my-8 print:p-0 print:shadow-none">
            <div className="flex flex-col text-gray-700 items-center mb-6 border-b pb-4">
                <div className="text-2xl font-bold">{company?.companyName}</div>
                <div className="text-sm">{company.address}, {company.city}, {company.state} - {company.pincode}</div>
                <div className="text-sm">GST: {company.gstNo} | PAN: {company.panNo}</div>
                <div className="text-sm">Phone: {company.phone || company.mobile}</div>
            </div>
            <div className="flex justify-between mb-4">
                <div>
                    <div className="font-semibold text-gray-700">Invoice No:</div>
                    <div className='text-gray-600'>{invoice.invoiceNo}</div>
                </div>
                <div>
                    <div className="font-semibold text-gray-700">Invoice Date:</div>
                    <div className='text-gray-600'>{invoice.invoiceDate?.slice(0, 10)}</div>
                </div>
            </div>
            <table className="w-full border mb-4">
                <thead>
                    <tr className="bg-gray-600 text-gray-100 text-xs print-bg-gray-600 print-text-gray-100">
                        <th className="border px-2 py-1">S. No.</th>
                        <th className="border px-2 py-1">Booking Date</th>
                        <th className="border px-2 py-1">Consignment No</th>
                        <th className="border px-2 py-1">Sender</th>
                        <th className="border px-2 py-1">Receiver</th>
                        <th className="border px-2 py-1">City</th>
                        <th className="border px-2 py-1">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.bookings.map((b: any, idx: number) => (
                        <tr key={b.id} className="text-xs text-gray-600">
                            <td className="border px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border px-2 py-1 text-center">{b.bookingDate?.slice(0, 10)}</td>
                            <td className="border px-2 py-1 text-center">{b.consignmentNo}</td>
                            <td className="border px-2 py-1 text-center">{b.senderName}</td>
                            <td className="border px-2 py-1 text-center">{b.receiverName}</td>
                            <td className="border px-2 py-1 text-center">{b.city}</td>
                            <td className="border px-2 py-1 text-right">{b.amountCharged.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-end text-gray-700 gap-8 mb-2">
                <div className="font-semibold">Total Amount:</div>
                <div>{invoice.totalAmount.toFixed(2)}</div>
            </div>
            <div className="flex justify-end text-gray-700 gap-8 mb-2">
                <div className="font-semibold">Total Tax:</div>
                <div>{invoice.totalTax.toFixed(2)}</div>
            </div>
            <div className="flex justify-end text-gray-700 gap-8 mb-6">
                <div className="font-bold">Net Amount:</div>
                <div className="font-bold">{invoice.netAmount.toFixed(2)}</div>
            </div>
            <div className="flex justify-end print:hidden">
                <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded"
                    onClick={() => window.print()}
                >
                    Print Invoice
                </button>
            </div>
            <div className="mt-8 text-xs text-gray-500 text-center border-t pt-2">
                This is a computer-generated invoice. No signature required.
            </div>
        </div>
    );
}