'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type ZoneForm = {
  id?: string;
  code: string;
  name: string;
  active: boolean;
};

const initialForm: ZoneForm = { code: '', name: '', active: true };

export default function ZoneMaster() {
  const [form, setForm] = useState<ZoneForm>(initialForm);
  const [zones, setZones] = useState<ZoneForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/zone-master').then(res => setZones(res.data));
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
        const zone = zones[editingIndex];
        await axios.put(`/api/zone-master/${zone.id}`, form);
        toast.success("Zone updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/zone-master', form);
        toast.success("Zone added");
      }
      axios.get('/api/zone-master').then(res => setZones(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving zone");
    }
  };

  const handleEdit = (idx: number) => {
    setForm(zones[idx]);
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const zone = zones[idx];
    if (!confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      await axios.delete(`/api/zone-master/${zone.id}`);
      toast.success("Zone deleted");
      axios.get('/api/zone-master').then(res => setZones(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting zone");
    }
  };

  const filtered = zones.filter(z =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">ZONE MASTER</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input name="code" value={form.code} onChange={handleChange} placeholder="Zo Code" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <input name="name" value={form.name} onChange={handleChange} placeholder="Zone Name" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="text-gray-600 cursor-pointer" />
            <span className="text-gray-600 cursor-pointer">Active</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
        </form>
        <div className="px-6 pb-2 flex items-center space-x-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Zone" className="p-2 border rounded text-gray-500 border-gray-300" />
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => setSearch('')}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zo Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((zone:ZoneForm, idx) => (
                <tr key={zone.code}>
                  <td className="px-3 py-2 text-gray-600 uppercase">{zone.code.toUpperCase()}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{zone.name.toUpperCase()}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">{zone.active ? '✔️' : ''}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">
                    <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
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