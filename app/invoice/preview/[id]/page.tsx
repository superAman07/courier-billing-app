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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Loading invoice...</span>
            </div>
        );
    }

    // Calculate totals
    const subtotal = invoice.bookings.reduce((sum: number, b: any) => sum + Number(b.amountCharged), 0);
    const fuelSurcharge = 0; // Can be calculated or fetched from data
    const taxableValue = subtotal + fuelSurcharge;
    const igstRate = 0.18; // 18%
    const igstAmount = taxableValue * igstRate;
    const totalAfterTax = taxableValue + igstAmount;
    const roundOff = Math.round(totalAfterTax) - totalAfterTax;
    const finalAmount = Math.round(totalAfterTax);

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 print:p-6 print:m-0 print:shadow-none shadow-lg">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold text-black">{company?.companyName || 'Awdhoot Global Solutions'}</h1>
                <p className="text-sm text-gray-700">
                    Shop No.: {company?.address || '570/326, VIP Road, Sainik Nagar,'}
                </p>
                <p className="text-sm text-gray-700">
                    {company?.city || 'Lucknow'} - {company?.pincode || '226002'} - {company?.state.toUpperCase() || 'Uttar Pradesh'}
                </p>
                <p className="text-sm text-gray-700">Phone : {company?.phone || company?.mobile || '8853099924'}</p>
                <p className="text-sm font-semibold text-black">
                    GST No : {company?.gstNo || '09BLUPS9727E1Z7'}, {company?.state.toUpperCase() || 'Uttar Pradesh'}
                </p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-6 border-b border-black pb-4">
                <div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Invoice No</span>
                        <span className="ml-8 text-gray-600">{invoice.invoiceNo}</span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Invoice Date :</span>
                        <span className="ml-4 text-gray-600">{new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Period :</span>
                        <span className="ml-8 text-gray-600">
                            {invoice.periodFrom && invoice.periodTo
                                ? `${new Date(invoice.periodFrom).toLocaleDateString('en-GB')} to ${new Date(invoice.periodTo).toLocaleDateString('en-GB')}`
                                : '1 Jul 25 to 31 Jul 25'
                            }
                        </span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">SAC Code</span>
                        <span className="ml-8 text-gray-600">{company?.hsnSacCode || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Customer Details */}
            <div className="mb-6 border-b border-black pb-4">
                <div className="mb-2">
                    <span className="font-semibold text-black">To,</span>
                    <span className="ml-12 text-gray-600">{invoice.customer?.customerName || 'Appropriate Diet Therapy'}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">Address</span>
                    <span className="ml-6 text-gray-600">{invoice.customer?.address || 'Plot No. B-5/8, Butibori Industrial Area, Butibori, Midc, Nagpur, MH'}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">Phone :</span>
                    <span className="ml-4 text-gray-600">
                        {invoice.customer?.phone} , {invoice.customer?.mobile || 'N/A'}
                    </span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">GSTN No-</span>
                    <span className="ml-4 text-gray-600">{invoice.customer?.gstNo || '27FZPPS9093L1Z0'}</span>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="mb-6">
                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-gray-600 text-center">Sr.</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-gray-600 text-center">Booking Date</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-gray-600 text-center">Consignment No.</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-gray-600 text-center">Destination City</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-gray-600 text-center">Weight or No.</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-gray-600 text-center">Amt.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.bookings.map((booking: any, index: number) => (
                            <tr key={booking.id}>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{index + 1}</td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">
                                    {new Date(booking.bookingDate).toLocaleDateString('en-GB')}
                                </td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.consignmentNo}</td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.city}</td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">
                                    {/* You can add weight from BookingMaster if available */}
                                    0.31
                                </td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.amountCharged}</td>
                            </tr>
                        ))}

                        {/* Summary Rows */}
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-gray-600 text-right text-sm font-semibold">Total</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm font-semibold">{subtotal}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Fuel Surcharge @ 0 %</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{fuelSurcharge}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Taxable Value :</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{taxableValue}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">IGST 18%</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{igstAmount.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-gray-600 text-right text-sm font-semibold">Total :</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm font-semibold">{totalAfterTax.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Round Off</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{finalAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Notes Section */}
            <div className="mb-8 text-sm text-gray-500">
                <p className="mb-2">
                    <strong>Note:</strong> All Billing related issues must be raised and must be clarified within 5 days of Bill submission.
                </p>
                <p className="mb-2">
                    For Non insured (No Risk) shipment, Consigner or Consignee will not be right to claim any shortage / misplaced / damage.
                </p>
                <p className="mb-2">
                    For Lost of Non insured shipment, Company will provide FIR Copy.
                </p>
            </div>

            {/* Signature Section */}
            <div className="flex justify-between items-end mt-8">
                <div className="text-left">
                    <img
                        src={'/image.png'}
                        alt="Company Signature"
                        className="max-w-36 max-h-26 object-contain"
                    />
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-600">
                        <p>For M/S {company?.companyName || 'Awdhoot Global Solutions'}</p>
                        <p className="mt-8 border-t border-gray-400 pt-2">Authorized Signatory</p>
                    </div>
                </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-center mt-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    Print Invoice
                </button>
            </div>
        </div>
    );
}