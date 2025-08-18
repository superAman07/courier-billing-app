'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const initialForm = {
  bookingDate: '',
  senderName: '',
  senderMobile: '',
  receiverName: '',
  receiverMobile: '',
  consignmentNo: '',
  docType: '',
  mode: '',
  country: '',
  pieces: 1,
  weight: 0,
  courierCharged: 0,
  contents: '',
  value: 0,
  vasAmount: 0,
  amountCharged: 0,
};

export default function InternationalCashBookingForm() {
  const [form, setForm] = useState(initialForm);
  const [bookings, setBookings] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchBookings();
    axios.get('/api/countries').then(res => setCountries(res.data));
  }, []);

  const fetchBookings = async () => {
    const res = await axios.get('/api/international-cash-booking');
    setBookings(res.data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    try {
      e.preventDefault();
      if (editingId) {
        await axios.put(`/api/international-cash-booking/${editingId}`, form);
      } else {
        await axios.post('/api/international-cash-booking', form);
      }
      toast.success("Form submitted successfully");
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
    await axios.delete(`/api/international-cash-booking/${id}`);
    fetchBookings();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 shadow-md">
          <h1 className="text-2xl font-bold text-white text-center">INTERNATIONAL CASH BOOKING</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-0">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">Booking Date</label>
            <input type="date" name="bookingDate" value={form.bookingDate} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div>
              <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-6 border-l-4 border-blue-600">Sender Detail</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Sender Name</label>
                  <input name="senderName" placeholder='Enter sender name' value={form.senderName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Sender Mobile No</label>
                  <input name="senderMobile" placeholder='Enter sender mobile no' value={form.senderMobile} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-6 border-l-4 border-blue-600">Receiver Detail</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Receiver Name</label>
                  <input name="receiverName" placeholder='Enter receiver name' value={form.receiverName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Receiver Mobile No</label>
                  <input name="receiverMobile" placeholder='Enter receiver mobile no' value={form.receiverMobile} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-8 border-l-4 border-blue-600">Consignment Booking Details</div>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Consignment No</label>
              <input name="consignmentNo" placeholder='INTL123456' value={form.consignmentNo} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Doc Type</label>
              <select name="docType" value={form.docType} onChange={handleChange} className="w-full p-2 cursor-pointer border rounded text-gray-700">
                <option value="">Select</option>
                <option value="DOX">DOX</option>
                <option value="NONDOX">NONDOX</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Mode</label>
              <select name="mode" value={form.mode} onChange={handleChange} className="w-full cursor-pointer p-2 border rounded text-gray-700">
                <option value="">Select</option>
                <option value="AIR">AIR</option>
                <option value="SURFACE">SURFACE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Country</label>
              <select name="country" value={form.country} onChange={handleChange} className="w-full p-2 cursor-pointer border rounded text-gray-700">
                <option value="">Select</option>
                {countries.map((c: any) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Pcs</label>
              <input type="number" name="pieces" value={form.pieces} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" min={1} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Weight (kg)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Courier Charged</label>
              <input type="number" name="courierCharged" value={form.courierCharged} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Contents</label>
              <input name="contents" value={form.contents} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Value</label>
              <input type="number" name="value" value={form.value} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">VAS Amt.</label>
              <input type="number" name="vasAmount" value={form.vasAmount} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Amt. Charged</label>
              <input type="number" name="amountCharged" value={form.amountCharged} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div className="md:col-span-2 flex space-x-2 mt-4">
              <button type="submit" className="px-6 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">{editingId ? (loading ? 'Updating...' : 'Update') : (loading ? 'Saving...' : 'Save')}</button>
              {editingId && (
                <button type="button" onClick={() => { setForm(initialForm); setEditingId(null); }} className="px-6 py-2 cursor-pointer bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold">Cancel</button>
              )}
            </div>
          </div>
        </form>
        <div className="p-6">
          <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 border-l-4 border-blue-600">Booked Consignment Details for the Day</div>
          <table className="min-w-full border">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-2 py-1 border text-blue-900">Consign. No</th>
                <th className="px-2 py-1 border text-blue-900">Doc/NonDox</th>
                <th className="px-2 py-1 border text-blue-900">Mode</th>
                <th className="px-2 py-1 border text-blue-900">Country</th>
                <th className="px-2 py-1 border text-blue-900">Pcs</th>
                <th className="px-2 py-1 border text-blue-900">Contents</th>
                <th className="px-2 py-1 border text-blue-900">Weight</th>
                <th className="px-2 py-1 border text-blue-900">Courier</th>
                <th className="px-2 py-1 border text-blue-900">Chargeable Amt</th>
                <th className="px-2 py-1 border text-blue-900">Edit</th>
                <th className="px-2 py-1 border text-blue-900">Delete</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-2 py-1 text-gray-600 border">{b.consignmentNo}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.docType}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.mode}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.country}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.pieces}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.contents}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.weight}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.courierCharged}</td>
                  <td className="px-2 py-1 text-gray-600 border">{b.amountCharged}</td>
                  <td className="px-2 py-1 text-gray-600 border">
                    <button onClick={() => handleEdit(b)} className="text-blue-600 cursor-pointer hover:underline">✏️</button>
                  </td>
                  <td className="px-2 py-1 text-gray-600 border">
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 cursor-pointer hover:underline">🗑️</button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-4 text-gray-400">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}