'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const initialForm = {
    bookingDate: '',
    consignmentNo: '',
    customerId: '',
    docType: '',
    serviceType: '',
    country: '',
    weight: 0,
    courierAmount: 0,
    vasAmount: 0,
    chargeAmount: 0,
    consigneeName: '',
    smsSent: false,
    smsDate: ''
};

export default function InternationalCreditClientBookingForm() {
    const [form, setForm] = useState(initialForm);
    const [bookings, setBookings] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchBookings();
        axios.get('/api/customers').then(res => {
            // it will only show international customers
            setCustomers(res.data.filter((c: any) => c.isInternational));
        });
        axios.get('/api/countries').then(res => setCountries(res.data));
    }, []);

    const fetchBookings = async () => {
        const res = await axios.get('/api/international-credit-client-booking');
        setBookings(res.data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`/api/international-credit-client-booking/${editingId}`, form);
                toast.success("Booking updated successfully");
            } else {
                await axios.post('/api/international-credit-client-booking', form);
                toast.success("Booking added successfully");
            }
            setForm(initialForm);
            setEditingId(null);
            fetchBookings();
        } catch (error) {
            toast.error("Error submitting form");
            console.error("Error submitting form:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (booking: any) => {
        setForm({
            ...booking,
            bookingDate: booking.bookingDate?.slice(0, 10) || '',
        });
        setEditingId(booking.id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this booking?')) return;
        setLoading(true);
        try {
            await axios.delete(`/api/international-credit-client-booking/${id}`);
            fetchBookings();
            toast.success("Booking deleted successfully");
        } catch (error) {
            toast.error("Error deleting booking");
            console.error("Error deleting booking:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.consignmentNo?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        b.consigneeName?.toLowerCase().includes(search.toLowerCase()) ||
        b.country?.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
        b.city?.toLowerCase().includes(search.toLowerCase())
    );

    const totalRecords = filteredBookings.length;
    const totalWeight = filteredBookings.reduce((sum, b) => sum + Number(b.weight || 0), 0);
    const totalAmount = filteredBookings.reduce((sum, b) => sum + Number(b.chargeAmount || 0), 0);

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white text-center">INTERNATIONAL CREDIT CLIENT BOOKING</h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Booking Date</label>
                            <input type="date" name="bookingDate" value={form.bookingDate} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Customer Name</label>
                            <select name="customerId" value={form.customerId} onChange={handleChange} className="w-full p-2 py-2.5 cursor-pointer border rounded text-gray-700" required>
                                <option value="">Select</option>
                                {customers.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.customerName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Consignment No</label>
                            <input name="consignmentNo" placeholder='INTL123456' value={form.consignmentNo} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end mt-4">
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Doc Type</label>
                            <select name="docType" value={form.docType} onChange={handleChange} className="w-full p-2 cursor-pointer border rounded text-gray-700">
                                <option value="">Select</option>
                                <option value="DOX">DOX</option>
                                <option value="NONDOX">NONDOX</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Service Type</label>
                            <select name="serviceType" value={form.serviceType} onChange={handleChange} className="w-full p-2 border cursor-pointer rounded text-gray-700">
                                <option value="">Select</option>
                                <option value="AIR">AIR</option>
                                <option value="AIR CARGO">AIR CARGO</option>
                                <option value="SURFACE">SURFACE</option>
                                <option value="EXPRESS">EXPRESS</option>
                                <option value="PRIORITY">PRIORITY</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Country</label>
                            <select name="country" value={form.country} onChange={handleChange} className="w-full p-2 cursor-pointer border rounded text-gray-700">
                                <option value="">Select</option>
                                {countries.map((c: any) => (
                                    <option key={c.code} value={c.name.toUpperCase()}>{c.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Weight (Kg)</label>
                            <input type="number" name="weight" value={form.weight} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Courier Amt</label>
                            <input type="number" name="courierAmount" value={form.courierAmount} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">VAS</label>
                            <input type="number" name="vasAmount" value={form.vasAmount} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Charge Amt</label>
                            <input type="number" name="chargeAmount" value={form.chargeAmount} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Consignee Name</label>
                            <input name="consigneeName" placeholder='Enter Consignee Name' value={form.consigneeName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                        </div>
                        <div className="md:col-span-2 flex space-x-2 mt-4">
                            <button type="submit" className="px-6 py-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold">{editingId ? (loading ? 'Updating...' : 'Update') : (loading ? 'Adding...' : 'Add')}</button>
                            {editingId && (
                                <button type="button" onClick={() => { setForm(initialForm); setEditingId(null); }} className="px-6 py-2 cursor-pointer bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold">Cancel</button>
                            )}
                        </div>
                    </div>
                </form>
                <div className="p-6">
                    <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 border-l-4 border-blue-600">Booked Consignment Details</div>
                    <div className="relative w-80 mb-4">
                        <input
                            type="text"
                            id="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="peer p-2 pt-5 rounded text-gray-600 border border-gray-700 text-xs w-full focus:border-indigo-500 focus:outline-none"
                            placeholder=" "
                        />
                        <label
                            htmlFor="search"
                            className="absolute left-2 top-3.5 text-gray-600 text-xs transition-all duration-200
      peer-focus:-translate-y-5.5 peer-focus:text-indigo-600 peer-focus:text-xs
      peer-[&:not(:placeholder-shown)]:-translate-y-5.5 peer-[&:not(:placeholder-shown)]:text-indigo-600 peer-[&:not(:placeholder-shown)]:text-xs
      peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-xs
      pointer-events-none bg-white px-1"
                            style={{ background: 'white' }}
                        >
                            Search by Consignment No, Customer, Consignee, Country, Service...
                        </label>
                    </div>
                    <div className="overflow-x-auto">
  <div className="max-h-[540px] overflow-y-auto border">
    <table className="min-w-full border">
      <thead className="bg-blue-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-2 py-1 border text-blue-900">Consign. No</th>
                                <th className="px-2 py-1 border text-blue-900">Customer</th>
                                <th className="px-2 py-1 border text-blue-900">Doc/NonDox</th>
                                <th className="px-2 py-1 border text-blue-900">Service</th>
                                <th className="px-2 py-1 border text-blue-900">Country</th>
                                <th className="px-2 py-1 border text-blue-900">Weight</th>
                                <th className="px-2 py-1 border text-blue-900">VAS</th>
                                <th className="px-2 py-1 border text-blue-900">Courier Amt</th>
                                <th className="px-2 py-1 border text-blue-900">Chargeable Amt</th>
                                <th className="px-2 py-1 border text-blue-900">Consignee</th>
                                <th className="px-2 py-1 border text-blue-900">Edit</th>
                                <th className="px-2 py-1 border text-blue-900">Delete</th>
                                <th className="px-2 py-1 border text-blue-900">Send SMS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((b) => (
                                <tr key={b.id}>
                                    <td className="px-2 py-1 text-gray-600 border">{b.consignmentNo}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.customer?.customerName}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.docType}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.serviceType}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.country}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.weight}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.vasAmount}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.courierAmount}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.chargeAmount}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.consigneeName}</td>
                                    <td className="px-2 py-1 text-gray-600 border">
                                        <button onClick={() => handleEdit(b)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
                                    </td>
                                    <td className="px-2 py-1 text-gray-600 border">
                                        <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                                    </td>
                                    <td className="px-2 py-1 text-gray-600 border text-center">
                                        {b.smsSent && (
                                            <span
                                                title={`Last sent on ${b.smsDate ? new Date(b.smsDate).toLocaleString() : ''}`}
                                                className="mr-2"
                                            >
                                                ✅
                                            </span>
                                        )}
                                        <button
                                            title="Send SMS"
                                            className="text-blue-600 cursor-pointer hover:underline"
                                            onClick={async () => {
                                                const { data: fullBooking } = await axios.get(`/api/international-credit-client-booking/${b.id}`);
                                                await axios.post('/api/send-sms', { id: b.id, consignmentNo: b.consignmentNo, mobile: b.customer?.mobile });
                                                await axios.put(`/api/international-credit-client-booking/${b.id}`, {
                                                    ...fullBooking,
                                                    smsSent: true,
                                                    smsDate: new Date().toISOString(),
                                                });
                                                toast.success("SMS sent successfully!");
                                                fetchBookings();
                                            }}
                                        >
                                            📩
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan={12} className="text-center py-4 text-gray-400">No bookings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        <div className="bg-indigo-600 rounded p-2 text-center font-bold text-white">Total Records<br />{totalRecords}</div>
                        <div className="bg-indigo-600 rounded p-2 text-center font-bold text-white">Total Weight<br />{totalWeight.toFixed(3)}</div>
                        <div className="bg-indigo-600 rounded p-2 text-center font-bold text-white">Total Amount<br />{totalAmount.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}