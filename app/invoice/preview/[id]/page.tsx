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
 
    const bookings = invoice.bookings || [];
    const showConsignmentValue = bookings.some((b: any) => Number(b.consignmentValue) > 49999);
    // const subtotal = bookings.reduce((sum: number, b: any) => sum + Number(b.amountCharged), 0);
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
    const colSpanValue = showConsignmentValue ? 9 : 8;

    return (
        <div className="invoice-container max-w-6xl mx-auto bg-white p-8 print:p-6 print:m-0 print:shadow-none shadow-lg">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold text-black">{company?.companyName || 'Awdhoot Global Solutions'}</h1>
                <p className="text-sm text-gray-700">
                    Shop No.: {company?.address || '570/326, VIP Road, Sainik Nagar,'}
                </p>
                <p className="text-sm text-gray-700">
                    {company?.city || 'Lucknow'} - {company?.pincode || '226002'} - {(company?.state || 'Uttar Pradesh').toUpperCase()}
                </p>
                <p className="text-sm text-gray-700">Phone : {company?.phone || company?.mobile || '8853099924'}</p>
                <p className="text-sm font-semibold text-black">
                    GST No : {company?.gstNo || '09BLUPS9727E1Z7'}, {(company?.state || 'Uttar Pradesh').toUpperCase()}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6 border-b border-black pb-4">
                <div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">Invoice No :</span>
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
                                : ''
                            }
                        </span>
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-black">SAC Code :</span>
                        <span className="ml-6 text-gray-600">{company?.hsnSacCode || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="mb-6 border-b border-black pb-4">
                <div className="mb-2">
                    <span className="font-semibold text-black">To,</span>
                    <span className="ml-12 text-gray-600">{invoice.customer?.customerName || ''}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">Address :</span>
                    <span className="ml-6 text-gray-600">{invoice.customer?.address || ''}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">Phone :</span>
                    <span className="ml-4 text-gray-600">{invoice.customer?.phone || invoice.customer?.mobile || 'N/A'}</span>
                </div>
                <div className="mb-2">
                    <span className="font-semibold text-black">GSTN No-</span>
                    <span className="ml-4 text-gray-600">{invoice.customer?.gstNo || ''}</span>
                </div>
            </div>

            <div className="mb-6 overflow-x-auto">
                <table className="invoice-table w-full border-collapse border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Sr.</th>
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Booking Date</th>
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Consignment No.</th>
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Destination City</th>
                            
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Dox/Non Dox</th>
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">No. of Pcs</th>
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Service Type</th>
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Weight</th>
                            {showConsignmentValue && (
                                <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">Material Value</th>
                            )}
                            <th className="border border-black px-2 py-1 text-sm font-semibold text-gray-600 text-center">FR Charge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking: any, index: number) => (
                            <tr key={booking.id}>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{index + 1}</td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">
                                    {new Date(booking.bookingDate).toLocaleDateString('en-GB')}
                                </td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.consignmentNo}</td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.city}</td>
                                
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">
                                    {booking.doxType || (booking.docType === 'D' ? 'DOX' : 'NON-DOX') || ''}
                                </td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.numPcs ?? ''}</td>
                                {/* Map 'serviceType' or fallback to 'mode' */}
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">
                                    {booking.serviceType || booking.bookingType === 'BookingMaster' ? 'DOMESTIC' : ''}
                                </td>
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{booking.weight ?? ''}</td>
                                {showConsignmentValue && (
                                    <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">
                                        {booking.consignmentValue > 49999 ? Number(booking.consignmentValue).toFixed(2) : '-'}
                                    </td>
                                )}
                                <td className="border border-black px-2 py-1 text-gray-600 text-center text-sm">{Number(booking.frCharge || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                       
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Shipper Cost</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{shipperCostTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Way Bill Surcharge @ 0.2%</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{waybillSurchargeTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Other Exp.</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{otherExpTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Fuel Surcharge</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{fuelSurchargeTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Taxable Value :</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{taxableValue.toFixed(2)}</td>
                        </tr>
                        {isIntraState ? (
                            <>
                                <tr>
                                    <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">CGST {(gstRate / 2).toFixed(0)}%</td>
                                    <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{(igstAmount / 2).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">SGST {(gstRate / 2).toFixed(0)}%</td>
                                    <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{(igstAmount / 2).toFixed(2)}</td>
                                </tr>
                            </>
                        ) : (
                            <tr>
                                <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">IGST {gstRate.toFixed(0)}%</td>
                                <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{igstAmount.toFixed(2)}</td>
                            </tr>
                        )} 
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm font-semibold">Total :</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm font-semibold">{totalAfterTax.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={colSpanValue} className="border border-black px-2 py-1 text-gray-600 text-right text-sm">Round Off</td>
                            <td className="border border-black px-2 py-1 text-center text-gray-600 text-sm">{finalAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mb-8 text-sm text-gray-500">
                <p className="mb-2"><strong>Note:</strong> All Billing related issues must be raised and must be clarified within 5 days of Bill submission.</p>
                <p className="mb-2">For Non insured (No Risk) shipment, Consigner or Consignee will not be right to claim any shortage / misplaced / damage.</p>
                <p className="mb-2">For Lost of Non insured shipment, Company will provide FIR Copy.</p>
            </div>

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
 
            <div className="flex justify-center mt-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer rounded-lg font-medium"
                >
                    Print Invoice
                </button>
            </div>
        </div>
    );
}