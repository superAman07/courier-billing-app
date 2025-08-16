'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type BookRateForm = {
  id?: string;
  bookSeries: string;
  amount: string;
};

const initialForm: BookRateForm = { bookSeries: '', amount: '' };

export default function BookRateMaster() {
  const [form, setForm] = useState<BookRateForm>(initialForm);
  const [rates, setRates] = useState<BookRateForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/book-rate-master').then(res => setRates(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        const rate = rates[editingIndex];
        await axios.put(`/api/book-rate-master/${rate.id}`, { ...form, amount: parseFloat(form.amount) });
        toast.success("Book rate updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/book-rate-master', { ...form, amount: parseFloat(form.amount) });
        toast.success("Book rate added");
      }
      axios.get('/api/book-rate-master').then(res => setRates(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving book rate");
    }
  };

  const handleEdit = (idx: number) => {
    setForm({
      bookSeries: rates[idx].bookSeries,
      amount: rates[idx].amount.toString(),
      id: rates[idx].id,
    });
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const rate = rates[idx];
    if (!confirm(`Delete book rate for series "${rate.bookSeries}"?`)) return;
    try {
      await axios.delete(`/api/book-rate-master/${rate.id}`);
      toast.success("Book rate deleted");
      axios.get('/api/book-rate-master').then(res => setRates(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting book rate");
    }
  };

  const filtered = rates.filter(r =>
    r.bookSeries.toLowerCase().includes(search.toLowerCase()) ||
    r.amount.toString().includes(search)
  );

  const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-[710px] mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">BOOK RATE MASTER</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className={labelStyle}>Book Series <span className="text-red-600">*</span></label>
            <input
              name="bookSeries"
              value={form.bookSeries.toUpperCase()}
              onChange={handleChange}
              className={inputStyle}
              maxLength={5}
              placeholder="E.g. D"
              required
            />
          </div>
          <div>
            <label className={labelStyle}>Amount <span className="text-red-600">*</span></label>
            <input
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className={inputStyle}
              type="number"
              step="0.01"
              min="0"
              placeholder="E.g. 17.00"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold">
              {editingIndex !== null ? 'Update' : 'Add'}
            </button>
            {editingIndex !== null && (
              <button type="button" onClick={() => { setEditingIndex(null); setForm(initialForm); }} className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded cursor-pointer font-semibold">
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="px-6 pb-2 flex items-center space-x-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Book Series or Amount" className="p-2 border rounded text-gray-500 border-gray-300" />
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => setSearch('')}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Book Series</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rate, idx) => (
                <tr key={rate.id}>
                  <td className="px-3 py-2 text-gray-600 font-semibold">{rate.bookSeries.toUpperCase()}</td>
                  <td className="px-3 py-2 text-gray-600">{parseFloat(rate.amount).toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-4">No book rates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}