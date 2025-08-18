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
  pincode: '',
  city: '',
  state: '',
  pieces: 1,
  weight: 0,
  courierCharged: 0,
  contents: '',
  value: 0,
  vsAmount: 0,
  amountCharged: 0,
};

type Tax = {
  taxCode: string;
  description: string;
  ratePercent: number;
  withinState: boolean;
  forOtherState: boolean;
  active: boolean;
};

export default function CashBookingForm() {
  const [form, setForm] = useState(initialForm);
  const [bookings, setBookings] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    axios.get('/api/pincode-master').then(res => setPincodes(res.data));
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    const res = await axios.get('/api/taxMaster');
    console.log('Fetched taxes:', res.data);
    setTaxes(res.data);
  };

  const fetchBookings = async () => {
    const res = await axios.get('/api/cash-booking');
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
    } else if (name === 'pincode') {
      const matched = pincodes.find((p: any) => p.pincode === value);
      setForm(prev => ({
        ...prev,
        pincode: value,
        city: matched?.city?.name || '',
        state: matched?.state?.name || ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/api/cash-booking/${editingId}`, form);
    } else {
      await axios.post('/api/cash-booking', form);
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
    await axios.delete(`/api/cash-booking/${id}`);
    fetchBookings();
  };

  const totalWithoutTax = bookings.reduce((sum, b) => sum + Number(b.amountCharged || 0), 0);
  const isWithinState = form.sourceState && form.state && form.sourceState === form.state;
  const applicableTaxes = taxes.filter(
    t => t.active && (isWithinState ? t.withinState : t.forOtherState)
  );
  const taxAmounts = applicableTaxes.map(tax => ({
    ...tax,
    amount: totalWithoutTax * Number(tax.ratePercent) / 100
  }));
  const totalTax = taxAmounts.reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalWithoutTax + totalTax;

  const labelStyle = "block text-sm font-semibold text-blue-900 mb-1";
  const sectionHeader = "text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-6 border-l-4 border-blue-600";

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white text-center">CASH BOOKING</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-0">
          <div>
            <label className={labelStyle}>Booking Date</label>
            <input type="date" name="bookingDate" value={form.bookingDate} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div>
              <div className={sectionHeader}>Sender Detail</div>
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Sender Name</label>
                  <input name="senderName" placeholder='Enter sender name' value={form.senderName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                </div>
                <div>
                  <label className={labelStyle}>Sender Mobile No</label>
                  <input name="senderMobile" placeholder='Enter sender mobile no' value={form.senderMobile} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                </div>
              </div>
            </div>
            <div>
              <div className={sectionHeader}>Receiver Detail</div>
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Receiver Name</label>
                  <input name="receiverName" placeholder='Enter receiver name' value={form.receiverName} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
                </div>
                <div>
                  <label className={labelStyle}>Receiver Mobile No</label>
                  <input name="receiverMobile" placeholder='Enter receiver mobile no' value={form.receiverMobile} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
                </div>
              </div>
            </div>
          </div>
          <div className={sectionHeader + " mt-8"}>Consignment Booking Details</div>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 items-end">
            <div>
              <label className={labelStyle}>Consignment No</label>
              <input name="consignmentNo" placeholder='Enter consignment no' value={form.consignmentNo} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" required />
            </div>
            <div>
              <label className={labelStyle}>Doc Type</label>
              <select name="docType" value={form.docType} onChange={handleChange} className="w-full p-2 border cursor-pointer rounded text-gray-700">
                <option value="">Select</option>
                <option value="DOX">DOX</option>
                <option value="NONDOX">NONDOX</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Mode</label>
              <select name="mode" value={form.mode} onChange={handleChange} className="w-full p-2 border cursor-pointer rounded text-gray-700">
                <option value="">Select</option>
                <option value="AIR">AIR</option>
                <option value="SURFACE">SURFACE</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Pincode</label>
              <input name="pincode" placeholder='Enter pincode' value={form.pincode} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
            </div>
            <div>
              <label className={labelStyle}>City</label>
              <input name="city" placeholder='Enter city' value={form.city} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
            </div>
            <div>
              <label className={labelStyle}>Pcs</label>
              <input type="number" placeholder='Enter pieces' name="pieces" value={form.pieces} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" min={1} />
            </div>
            <div>
              <label className={labelStyle}>Weight (kg)</label>
              <input type="number" placeholder='Enter weight' name="weight" value={form.weight} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className={labelStyle}>Courier Charged</label>
              <input type="number" placeholder='Enter courier charged' name="courierCharged" value={form.courierCharged} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>Contents</label>
              <input name="contents" placeholder='Enter contents' value={form.contents} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" />
            </div>
            <div>
              <label className={labelStyle}>Value</label>
              <input type="number" name="value" placeholder='Enter value' value={form.value} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className={labelStyle}>V/S Amt.</label>
              <input type="number" name="vsAmount" placeholder='Enter V/S Amt.' value={form.vsAmount} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div>
              <label className={labelStyle}>Amt. Charged</label>
              <input type="number" name="amountCharged" placeholder='Enter Amt. Charged' value={form.amountCharged} onChange={handleChange} className="w-full p-2 border rounded text-gray-700" step="0.01" />
            </div>
            <div className="md:col-span-2 flex space-x-2 mt-4">
              <button type="submit" className="px-6 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">{editingId ? 'Update' : 'Save'}</button>
              {editingId && (
                <button type="button" onClick={() => { setForm(initialForm); setEditingId(null); }} className="px-6 py-2 cursor-pointer bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold">Cancel</button>
              )}
            </div>
          </div>
        </form>
        <div className="p-6">
          <div className={sectionHeader}>Booked Consignment Details for the Day</div>
          <table className="min-w-full border">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-2 py-1 border text-blue-900">Consign. No</th>
                <th className="px-2 py-1 border text-blue-900">Doc/NonDox</th>
                <th className="px-2 py-1 border text-blue-900">Mode</th>
                <th className="px-2 py-1 border text-blue-900">Pincode</th>
                <th className="px-2 py-1 border text-blue-900">Destination</th>
                <th className="px-2 py-1 border text-blue-900">Pcs</th>
                <th className="px-2 py-1 border text-blue-900">Contents</th>
                <th className="px-2 py-1 border text-blue-900">Weight(kg)</th>
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
                  <td className="px-2 py-1 border">{b.pincode}</td>
                  <td className="px-2 py-1 border">{b.city}</td>
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
                  <td colSpan={12} className="text-center py-4 text-gray-400">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-blue-900 font-semibold mb-2">Total Amount Without Tax:</div>
              <div className="text-xl font-bold text-gray-800 mb-4">₹ {totalWithoutTax.toFixed(2)}</div>
              <div className="text-blue-900 font-semibold mb-2">Net Amount Collected:</div>
              <div className="text-xl font-bold text-green-700 mb-4">₹ {netAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-blue-900 font-semibold mb-2">Tax Breakdown:</div>
              {taxAmounts.length === 0 && (
                <div className="text-gray-700">No applicable taxes.</div>
              )}
              {taxAmounts.map(tax => (
                <div key={tax.taxCode} className="text-gray-700">
                  {tax.taxCode}: {Number(tax.ratePercent).toFixed(2)}% (₹ {tax.amount.toFixed(2)})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}