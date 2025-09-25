'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const SECTORS = [
    "Local", "UP", "UK", "Delhi", "Bihaar / Jharkhand",
    "North (Haryana / Punjaab / Rajasthaan)",
    "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "Rest of India", "North East", "Special Sector ( Darjling, Silchaar, Daman)",
];

type StateForm = {
  id?: string;
  code: string;
  name: string;
  zoneId: string;
  active: boolean;
  sector?: string;
};

type Zone = { id: string; code: string; name: string; active: boolean; };

const initialForm: StateForm = { code: '', name: '', zoneId: '', active: true, sector: '' };

export default function StateMaster() {
  const [form, setForm] = useState<StateForm>(initialForm);
  const [states, setStates] = useState<any[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  useEffect(() => {
    axios.get('/api/state-master').then(res => setStates(res.data));
    axios.get('/api/zone-master').then(res => setZones(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        const state = states[editingIndex];
        await axios.put(`/api/state-master/${state.id}`, form);
        toast.success("State updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/state-master', form);
        toast.success("State added");
      }
      axios.get('/api/state-master').then(res => setStates(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving state");
    }
  };

  const handleEdit = (idx: number) => {
    setForm({
      id: states[idx].id,
      code: states[idx].code,
      name: states[idx].name,
      zoneId: states[idx].zoneId,
      active: states[idx].active,
      sector: states[idx].sector || '',
    });
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const state = states[idx];
    if (!confirm(`Delete state "${state.name}"?`)) return;
    try {
      await axios.delete(`/api/state-master/${state.id}`);
      toast.success("State deleted");
      axios.get('/api/state-master').then(res => setStates(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting state");
    }
  };

  const filtered = states.filter(s =>
    (zoneFilter === 'ALL' || s.zoneId === zoneFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-green-600 via-green-700 to-green-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">STATE MASTER</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input name="code" value={form.code} onChange={handleChange} placeholder="State Code" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <input name="name" value={form.name} onChange={handleChange} placeholder="State" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <select name="zoneId" value={form.zoneId} onChange={handleChange} className="p-2 border cursor-pointer rounded text-gray-500 border-gray-300" required>
            <option value="">-- Select Zone --</option>
            {zones.map(z => <option key={z.id} value={z.id} className='uppercase'>{z.name.toUpperCase()}</option>)}
          </select>
          <select name="sector" value={form.sector} onChange={handleChange} className="p-2 border cursor-pointer rounded text-gray-500 border-gray-300">
            <option value="">-- Select Sector --</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="text-gray-600 cursor-pointer" />
            <span className="text-gray-600 cursor-pointer">Active</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
        </form>
        <div className="px-6 pb-2 flex items-center space-x-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find State" className="p-2 border rounded text-gray-500 border-gray-300" />
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="p-2 border cursor-pointer rounded text-gray-500 border-gray-300">
            <option value="ALL">All Zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => { setSearch(''); setZoneFilter('ALL'); }}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State Zone</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((state, idx) => (
                <tr key={state.id}>
                  <td className="px-3 py-2 text-gray-600 uppercase">{state.code}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{state.name}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{state.zone?.name || ''}</td>
                  <td className="px-3 py-2 text-gray-600">{state.sector || 'N/A'}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">{state.active ? '✔️' : ''}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">
                    <button type="button" onClick={() => handleEdit(idx)} className="text-green-600 hover:underline cursor-pointer">✏️</button>
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