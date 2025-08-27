'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type BookingType = 'CreditClientBooking' | 'InternationalCreditClientBooking';

export default function GenerateCreditInvoice() {
    const [type, setType] = useState<BookingType>('CreditClientBooking');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [bookings, setBookings] = useState<any[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    useEffect(() => {
        // Fetch customers for dropdown
        axios.get('/api/customers').then(res => {
            setCustomers(
                res.data.filter((c: any) =>
                    type === 'CreditClientBooking' ? !c.isInternational : !!c.isInternational
                )
            );
        });
        setCustomerId('');
        setBookings([]);
        setSelected([]);
    }, [type]);

    const fetchBookings = async () => {
        if (!customerId || !fromDate || !toDate) {
            toast.error('Select customer and date range');
            return;
        }
        setLoading(true);
        try {
            const url =
                type === 'CreditClientBooking'
                    ? '/api/credit-client-bookings-for-invoice'
                    : '/api/international-credit-client-bookings-for-invoice';
            const { data } = await axios.get(url, {
                params: { customerId, fromDate, toDate, status: 'BOOKED' }
            });
            setBookings(data);
            setSelected([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        setInvoiceLoading(true);
        try {
            const { data } = await axios.get('/api/invoices', {
                params: { type, customerId }
            });
            setInvoices(Array.isArray(data) ? data : data.data);
        } finally {
            setInvoiceLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) fetchInvoices();
        // eslint-disable-next-line
    }, [type, customerId]);

    const handleSelect = (id: string) => {
        setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
    };

    const handleSelectAll = () => {
        if (selected.length === bookings.length) setSelected([]);
        else setSelected(bookings.map((b: any) => b.id));
    };

    const handleGenerateInvoice = async () => {
        if (!invoiceDate || selected.length === 0 || !customerId) {
            toast.error('Select invoice date, customer, and at least one consignment');
            return;
        }
        setLoading(true);
        try {
            await axios.post('/api/invoices', {
                type,
                invoiceDate,
                bookingIds: selected,
                customerId
            });
            toast.success('Invoice generated!');
            setBookings([]);
            setSelected([]);
            fetchInvoices();
        } catch (error: any) {
            const backendMsg = error?.response?.data?.message;
            if (backendMsg) {
                toast.error(backendMsg);
            } else {
                toast.error(error.message || "Failed to generate invoice");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (id: string) => {
        window.open(`/invoice/preview/${id}`, '_blank');
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 mt-8">
            <h2 className="text-xl font-bold mb-4 text-center bg-indigo-700 text-white py-2 rounded">GENERATE CREDIT CLIENT INVOICE</h2>
            <div className="flex gap-4 mb-4 flex-wrap">
                <div>
                    <label className="block text-xs font-semibold text-gray-700">Type</label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value as BookingType)}
                        className="border p-2 rounded text-gray-600"
                    >
                        <option value="CreditClientBooking">Domestic (Credit Client)</option>
                        <option value="InternationalCreditClientBooking">International (Credit Client)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700">Customer</label>
                    <select
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                        className="border p-2 rounded text-gray-600 min-w-[180px]"
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.customerCode} - {c.customerName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700">Invoice Date</label>
                    <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="border p-2 rounded text-gray-600" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700">From Booking Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-2 rounded text-gray-600" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700">To Booking Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-2 rounded text-gray-600" />
                </div>
                <button onClick={fetchBookings} className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded" disabled={loading || !customerId || !fromDate || !toDate}>
                    Show Consignments
                </button>
            </div>
            <table className="w-full border mb-2">
                <thead>
                    <tr className="bg-gray-100 text-xs">
                        <th><input type="checkbox" className='cursor-pointer' checked={selected.length === bookings.length && bookings.length > 0} onChange={handleSelectAll} /></th>
                        <th className='text-gray-600'>Booking Date</th>
                        <th className='text-gray-600'>Consignment No</th>
                        <th className='text-gray-600'>Customer</th>
                        <th className='text-gray-600'>Consignee</th>
                        <th className='text-gray-600'>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center py-4 text-gray-400">
                                No consignments found for the selected customer and date range.
                            </td>
                        </tr>
                    ) : (
                        bookings.map((b: any) => (
                            <tr key={b.id} className="text-xs">
                                <td className='text-center'>
                                    <input
                                        type="checkbox"
                                        className='cursor-pointer'
                                        checked={selected.includes(b.id)}
                                        onChange={() => handleSelect(b.id)}
                                    />
                                </td>
                                <td className='text-gray-600 text-center'>{b.bookingDate?.slice(0, 10)}</td>
                                <td className='text-gray-600 text-center'>{b.consignmentNo}</td>
                                <td className='text-gray-600 text-center'>{b.customer?.customerCode || ''} - {b.customer?.customerName || ''}</td>
                                <td className='text-gray-600 text-center'>{b.consigneeName || b.receiverName || ''}</td>
                                <td className='text-gray-600 text-center'>{b.chargeAmount}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <div className="flex justify-between items-center mt-2">
                <label className="flex text-gray-600 items-center gap-2 text-xs">
                    <input type="checkbox" checked={selected.length === bookings.length && bookings.length > 0} onChange={handleSelectAll} />
                    Select All
                </label>
                <button onClick={handleGenerateInvoice} className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer text-white rounded" disabled={loading || selected.length === 0 || !invoiceDate || !customerId}>
                    Generate Invoice
                </button>
            </div>
            <div className="mt-10">
                <h3 className="text-lg font-bold mb-2 text-blue-900">Generated Credit Client Invoices</h3>
                <div className="mb-2 text-xs text-blue-700 italic">
                    <b>Note:</b> Only consignments with status <span className="font-semibold text-green-700">"BOOKED"</span> will be displayed here for invoice generation.<br />
                    If your consignment is missing, please update its status to <span className="font-semibold text-green-700">"BOOKED"</span> from the <span className="underline cursor-pointer" onClick={() => window.open('/update-and-send-delivery-status', '_blank')}>Update and Send Delivery Status</span> page.
                </div>
                <table className="w-full border mb-2">
                    <thead>
                        <tr className="bg-gray-100 text-xs">
                            <th className='text-gray-600'>Invoice No</th>
                            <th className='text-gray-600'>Invoice Date</th>
                            <th className='text-gray-600'>Total Amount</th>
                            <th className='text-gray-600'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceLoading ? (
                            <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-400">No invoices found.</td></tr>
                        ) : (
                            invoices.map((inv: any) => (
                                <tr key={inv.id} className="text-xs">
                                    <td className='text-gray-600 text-center'>{inv.invoiceNo}</td>
                                    <td className='text-gray-600 text-center'>{inv.invoiceDate?.slice(0, 10)}</td>
                                    <td className='text-gray-600 text-center'>{inv.netAmount}</td>
                                    <td className='text-center'>
                                        <button
                                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 cursor-pointer text-white rounded text-xs"
                                            onClick={() => handleViewInvoice(inv.id)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}