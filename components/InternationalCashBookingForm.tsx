'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const initialForm = {
  bookingDate: '',
  senderName: '',
  senderMobile: '',
  sourcePincode: '',
  sourceCity: '',
  sourceState: '',
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
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    axios.get('/api/pincode-master').then(res => setPincodes(res.data));
    axios.get('/api/countries').then(res => setCountries(res.data));
  }, []);

  const fetchBookings = async () => {
    const res = await axios.get('/api/international-cash-booking');
    setBookings(res.data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'sourcePincode') {
      const matched = pincodes.find((p: any) => p.pincode === value);
      setForm(prev => ({
        ...prev,
        sourcePincode: value,
        sourceCity: matched?.city?.name || '',
        sourceState: matched?.state?.name || ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/api/international-cash-booking/${editingId}`, form);
    } else {
      await axios.post('/api/international-cash-booking', form);
    }
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
    await axios.delete(`/api/international-cash-booking/${id}`);
    fetchBookings();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-md">
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
                  <input name="senderName" value={form.senderName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Sender Mobile No</label>
                  <input name="senderMobile" value={form.senderMobile} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Sender Pincode</label>
                  <input
                    name="sourcePincode"
                    value={form.sourcePincode}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-gray-700"
                    list="pincode-list"
                  />
                  <datalist id="pincode-list">
                    {pincodes.map(pin => (
                      <option key={pin.pincode} value={pin.pincode}>
                        {pin.pincode} - {pin.city?.name || ''} {pin.state?.name || ''}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Source City</label>
                  <input name="sourceCity" value={form.sourceCity} readOnly className="w-full p-2 border rounded text-gray-700 bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Source State</label>
                  <input name="sourceState" value={form.sourceState} readOnly className="w-full p-2 border rounded text-gray-700 bg-gray-100" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-6 border-l-4 border-blue-600">Receiver Detail</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Receiver Name</label>
                  <input name="receiverName" value={form.receiverName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Receiver Mobile No</label>
                  <input name="receiverMobile" value={form.receiverMobile} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-8 border-l-4 border-blue-600">Consignment Booking Details</div>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Consignment No</label>
              <input name="consignmentNo" value={form.consignmentNo} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Doc Type</label>
              <select name="docType" value={form.docType} onChange={handleChange} className="w-full p-2 border rounded text-gray-700">
                <option value="">Select</option>
                <option value="DOX">DOX</option>
                <option value="NONDOX">NONDOX</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Mode</label>
              <select name="mode" value={form.mode} onChange={handleChange} className="w-full p-2 border rounded text-gray-700">
                <option value="">Select</option>
                <option value="AIR">AIR</option>
                <option value="SURFACE">SURFACE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Country</label>
              <select name="country" value={form.country} onChange={handleChange} className="w-full p-2 border rounded text-gray-700">
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
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">{editingId ? 'Update' : 'Save'}</button>
              {editingId && (
                <button type="button" onClick={() => { setForm(initialForm); setEditingId(null); }} className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold">Cancel</button>
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
                  <td className="px-2 py-1 border">{b.consignmentNo}</td>
                  <td className="px-2 py-1 border">{b.docType}</td>
                  <td className="px-2 py-1 border">{b.mode}</td>
                  <td className="px-2 py-1 border">{b.country}</td>
                  <td className="px-2 py-1 border">{b.pieces}</td>
                  <td className="px-2 py-1 border">{b.contents}</td>
                  <td className="px-2 py-1 border">{b.weight}</td>
                  <td className="px-2 py-1 border">{b.courierCharged}</td>
                  <td className="px-2 py-1 border">{b.amountCharged}</td>
                  <td className="px-2 py-1 border">
                    <button onClick={() => handleEdit(b)} className="text-blue-600 hover:underline">✏️</button>
                  </td>
                  <td className="px-2 py-1 border">
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:underline">🗑️</button>
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