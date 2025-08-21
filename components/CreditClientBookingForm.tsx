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
    pincode: '',
    city: '',
    weight: 0,
    courierAmount: 0,
    vasAmount: 0,
    chargeAmount: 0,
    consigneeName: '',
    smsSent: false,
    smsDate: ''
};

export default function CreditClientBookingForm() {
    const [form, setForm] = useState(initialForm);
    const [bookings, setBookings] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pincodes, setPincodes] = useState<any>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchBookings();
        axios.get('/api/customers').then(res => setCustomers(res.data));
        axios.get('/api/pincode-master').then(res => setPincodes(res.data))
    }, []);

    const fetchBookings = async () => {
        const res = await axios.get('/api/credit-client-booking');
        setBookings(res.data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "pincode") {
            const matched = pincodes.find((p: any) => p.pincode === value);
            setForm(prev => ({
                ...prev,
                pincode: value,
                city: matched?.city?.name || ''
            }))
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`/api/credit-client-booking/${editingId}`, form);
            } else {
                await axios.post('/api/credit-client-booking', form);
            }

        } catch (error) {
            toast.error("Error submitting form");
            console.error("Error submitting form:", error);
        } finally {
            setLoading(false);
        }
        toast.success(editingId ? "Booking updated successfully" : "Booking added successfully");
        setForm(initialForm);
        setEditingId(null);
        fetchBookings();
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
        try {
            await axios.delete(`/api/credit-client-booking/${id}`);
            fetchBookings();
            toast.success("Booking deleted successfully");
        } catch (error) {
            toast.error("Error deleting booking");
            console.error("Error deleting booking:", error);
        }
    };

    const totalRecords = bookings.length;
    const totalWeight = bookings.reduce((sum, b) => sum + Number(b.weight || 0), 0);
    const totalAmount = bookings.reduce((sum, b) => sum + Number(b.chargeAmount || 0), 0);

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white text-center">DIRECT PARTY BOOKING</h1>
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
                            <input name="consignmentNo" placeholder='EU62749125IN' value={form.consignmentNo} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end mt-4">
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
                                <option value="PLUS">PLUS</option>
                                <option value="PRIORITY">PRIORITY</option>
                                <option value="SURFACE">SURFACE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Pincode</label>
                            <input name="pincode" placeholder='Enter Pincode' value={form.pincode} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">City</label>
                            <input name="city" placeholder='Enter Pincode' value={form.city.toUpperCase()} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
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
                            <button type="submit" className="px-6 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">{editingId ? (loading ? 'Updating...' : 'Update') : (loading ? 'Adding...' : 'Add')}</button>
                            {editingId && (
                                <button type="button" onClick={() => { setForm(initialForm); setEditingId(null); }} className="px-6 py-2 cursor-pointer bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold">Cancel</button>
                            )}
                        </div>
                    </div>
                </form>
                <div className="p-6">
                    <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 border-l-4 border-blue-600">Booked Consignment Details</div>
                    <table className="min-w-full border">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-2 py-1 border text-blue-900">Consign. No</th>
                                <th className="px-2 py-1 border text-blue-900">Customer</th>
                                <th className="px-2 py-1 border text-blue-900">Doc/NonDox</th>
                                <th className="px-2 py-1 border text-blue-900">Service</th>
                                <th className="px-2 py-1 border text-blue-900">Pincode</th>
                                <th className="px-2 py-1 border text-blue-900">City</th>
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
                            {bookings.map((b) => (
                                <tr key={b.id}>
                                    <td className="px-2 py-1 text-gray-600 border">{b.consignmentNo}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.customer?.customerName}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.docType}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.serviceType}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.pincode}</td>
                                    <td className="px-2 py-1 text-gray-600 border">{b.city}</td>
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
                                                const { data: fullBooking } = await axios.get(`/api/credit-client-booking/${b.id}`);
                                                await axios.post('/api/send-sms', { id: b.id, consignmentNo: b.consignmentNo, mobile: b.customer?.mobile });
                                                await axios.put(`/api/credit-client-booking/${b.id}`, {
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
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="text-center py-4 text-gray-400">No bookings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        <div className="bg-purple-600 rounded p-2 text-center font-bold">Total Records<br />{totalRecords}</div>
                        <div className="bg-purple-600 rounded p-2 text-center font-bold">Total Weight<br />{totalWeight.toFixed(3)}</div>
                        <div className="bg-purple-600 rounded p-2 text-center font-bold">Total Amount<br />{totalAmount.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}