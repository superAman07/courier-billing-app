'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type CountryForm = {
  id?: string;
  code: string;
  name: string;
  active: boolean;
};

const initialForm: CountryForm = { code: '', name: '', active: true };

export default function CountryMaster() {
  const [form, setForm] = useState<CountryForm>(initialForm);
  const [countries, setCountries] = useState<CountryForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/countries').then(res => setCountries(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        const country = countries[editingIndex];
        await axios.put(`/api/countries/${country.id}`, form);
        toast.success("Country updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/countries', form);
        toast.success("Country added");
      }
      axios.get('/api/countries').then(res => setCountries(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving country");
    }
  };

  const handleEdit = (idx: number) => {
    setForm(countries[idx]);
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const country = countries[idx];
    if (!confirm(`Delete country "${country.name}"?`)) return;
    try {
      await axios.delete(`/api/countries/${country.id}`);
      toast.success("Country deleted");
      axios.get('/api/countries').then(res => setCountries(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting country");
    }
  };

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">COUNTRY MASTER</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input name="code" value={form.code} onChange={handleChange} placeholder="Code" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <input name="name" value={form.name} onChange={handleChange} placeholder="Country Name" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="text-gray-600 cursor-pointer" />
            <span className="text-gray-600 cursor-pointer">Active</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
        </form>
        <div className="px-6 pb-2 flex items-center space-x-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Country" className="p-2 border rounded text-gray-500 border-gray-300" />
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => setSearch('')}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((country, idx) => (
                <tr key={country.code}>
                  <td className="px-3 py-2 text-gray-600 uppercase">{country.code}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{country.name}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">{country.active ? '✔️' : ''}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">
                    <button type="button" onClick={() => handleEdit(idx)} className="text-red-600 hover:underline cursor-pointer">✏️</button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}