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
                    {company?.city || 'Lucknow'} - {company?.pincode || '226002'} - {company?.state || 'Uttar Pradesh'}
                </p>
                <p className="text-sm text-gray-700">Phone : {company?.phone || company?.mobile || '8853099924'}</p>
                <p className="text-sm font-semibold text-black">
                    GST No : {company?.gstNo || '09BLUPS9727E1Z7'}, {company?.state || 'Uttar Pradesh'}
                </p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-6 border-b border-black pb-4">
                <div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Invoice No</span>
                        <span className="ml-8">{invoice.invoiceNo}</span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Invoice Date :</span>
                        <span className="ml-4">{new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Period :</span>
                        <span className="ml-8">
                            {invoice.periodFrom && invoice.periodTo
                                ? `${new Date(invoice.periodFrom).toLocaleDateString('en-GB')} to ${new Date(invoice.periodTo).toLocaleDateString('en-GB')}`
                                : '1 Jul 25 to 31 Jul 25'
                            }
                        </span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">SAC Code</span>
                    </div>
                </div>
            </div>

            {/* Customer Details */}
            <div className="mb-6 border-b border-black pb-4">
                <div className="mb-2">
                    <span className="font-semibold text-black">To,</span>
                    <span className="ml-12">{invoice.customer?.customerName || 'Appropriate Diet Therapy'}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">Address</span>
                    <span className="ml-6">{invoice.customer?.address || 'Plot No. B-5/8, Butibori Industrial Area, Butibori, Midc, Nagpur, MH'}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">Phone :</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">GSTN No-</span>
                    <span className="ml-4">{invoice.customer?.gstNo || '27FZPPS9093L1Z0'}</span>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="mb-6">
                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-center">Sr.</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-center">Booking Date</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-center">Consignment No.</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-center">Destination City</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-center">Weight or No.</th>
                            <th className="border border-black px-2 py-2 text-sm font-semibold text-center">Amt.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.bookings.map((booking: any, index: number) => (
                            <tr key={booking.id}>
                                <td className="border border-black px-2 py-1 text-center text-sm">{index + 1}</td>
                                <td className="border border-black px-2 py-1 text-center text-sm">
                                    {new Date(booking.bookingDate).toLocaleDateString('en-GB')}
                                </td>
                                <td className="border border-black px-2 py-1 text-center text-sm">{booking.consignmentNo}</td>
                                <td className="border border-black px-2 py-1 text-center text-sm">{booking.city}</td>
                                <td className="border border-black px-2 py-1 text-center text-sm">
                                    {/* You can add weight from BookingMaster if available */}
                                    0.31
                                </td>
                                <td className="border border-black px-2 py-1 text-center text-sm">{booking.amountCharged}</td>
                            </tr>
                        ))}

                        {/* Summary Rows */}
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-right text-sm font-semibold">Total</td>
                            <td className="border border-black px-2 py-1 text-center text-sm font-semibold">{subtotal}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-right text-sm">Fuel Surcharge @ 0 %</td>
                            <td className="border border-black px-2 py-1 text-center text-sm">{fuelSurcharge}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-right text-sm">Taxable Value :</td>
                            <td className="border border-black px-2 py-1 text-center text-sm">{taxableValue}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-right text-sm">IGST 18%</td>
                            <td className="border border-black px-2 py-1 text-center text-sm">{igstAmount.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-right text-sm font-semibold">Total :</td>
                            <td className="border border-black px-2 py-1 text-center text-sm font-semibold">{totalAfterTax.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-black px-2 py-1 text-right text-sm">Round Off</td>
                            <td className="border border-black px-2 py-1 text-center text-sm">{finalAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Notes Section */}
            <div className="mb-8 text-sm">
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
                    {/* Space for signature stamp/image */}
                    {company?.signatureImageUrl && (
                        <img
                            src={company.signatureImageUrl}
                            alt="Company Signature"
                            className="max-w-32 max-h-20 object-contain"
                        />
                    )}
                    <div className="text-sm font-semibold text-blue-600 mt-2">
                        For Awdhoot Global Solutions<br />
                        Proprietor
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm">
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



// 'use client';
// import { use, useEffect, useState } from 'react';
// import axios from 'axios';

// export default function InvoicePreview({ params }: { params: Promise<{ id: string }> }) {
//     const { id } = use(params);
//     const [invoice, setInvoice] = useState<any>(null);
//     const [company, setCompany] = useState<any>(null);

//     useEffect(() => {
//         axios.get(`/api/invoices/${id}`).then(res => setInvoice(res.data));
//         axios.get('/api/registration-details').then(res => {
//             setCompany(Array.isArray(res.data) ? res.data[0] : res.data);
//         });
//     }, [id]);

//     if (!invoice || !company) {
//         return (
//             <div className="min-h-screen flex items-center justify-center p-8">
//                 <div className="loader" />
//                 <span className="ml-2 text-gray-500">Loading invoice...</span>
//             </div>
//         );
//     }

//     return (
//         <div className="max-w-3xl mx-auto bg-white shadow-lg p-8 my-8 print:p-0 print:shadow-none">
//             <div className="flex flex-col text-gray-700 items-center mb-6 border-b pb-4">
//                 <div className="text-2xl font-bold">{company?.companyName}</div>
//                 <div className="text-sm">{company.address}, {company.city}, {company.state} - {company.pincode}</div>
//                 <div className="text-sm">GST: {company.gstNo} | PAN: {company.panNo}</div>
//                 <div className="text-sm">Phone: {company.phone || company.mobile}</div>
//             </div>
//             <div className="flex justify-between mb-4">
//                 <div>
//                     <div className="font-semibold text-gray-700">Invoice No:</div>
//                     <div className='text-gray-600'>{invoice.invoiceNo}</div>
//                 </div>
//                 <div>
//                     <div className="font-semibold text-gray-700">Invoice Date:</div>
//                     <div className='text-gray-600'>{invoice.invoiceDate?.slice(0, 10)}</div>
//                 </div>
//             </div>
//             <table className="w-full border mb-4">
//                 <thead>
//                     <tr className="bg-gray-600 text-gray-100 text-xs print-bg-gray-600 print-text-gray-100">
//                         <th className="border px-2 py-1">S. No.</th>
//                         <th className="border px-2 py-1">Booking Date</th>
//                         <th className="border px-2 py-1">Consignment No</th>
//                         <th className="border px-2 py-1">Sender</th>
//                         <th className="border px-2 py-1">Receiver</th>
//                         <th className="border px-2 py-1">City</th>
//                         <th className="border px-2 py-1">Amount</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {invoice.bookings.map((b: any, idx: number) => (
//                         <tr key={b.id} className="text-xs text-gray-600">
//                             <td className="border px-2 py-1 text-center">{idx + 1}</td>
//                             <td className="border px-2 py-1 text-center">{b.bookingDate?.slice(0, 10)}</td>
//                             <td className="border px-2 py-1 text-center">{b.consignmentNo}</td>
//                             <td className="border px-2 py-1 text-center">{b.senderName}</td>
//                             <td className="border px-2 py-1 text-center">{b.receiverName}</td>
//                             <td className="border px-2 py-1 text-center">{b.city}</td>
//                             <td className="border px-2 py-1 text-right">{b.amountCharged.toFixed(2)}</td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//             <div className="flex justify-end text-gray-700 gap-8 mb-2">
//                 <div className="font-semibold">Total Amount:</div>
//                 <div>{invoice.totalAmount.toFixed(2)}</div>
//             </div>
//             <div className="flex justify-end text-gray-700 gap-8 mb-2">
//                 <div className="font-semibold">Total Tax:</div>
//                 <div>{invoice.totalTax.toFixed(2)}</div>
//             </div>
//             <div className="flex justify-end text-gray-700 gap-8 mb-6">
//                 <div className="font-bold">Net Amount:</div>
//                 <div className="font-bold">{invoice.netAmount.toFixed(2)}</div>
//             </div>
//             <div className="flex justify-end print:hidden">
//                 <button
//                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded"
//                     onClick={() => window.print()}
//                 >
//                     Print Invoice
//                 </button>
//             </div>
//             <div className="mt-8 text-xs text-gray-500 text-center border-t pt-2">
//                 This is a computer-generated invoice. No signature required.
//             </div>
//         </div>
//     );
// }