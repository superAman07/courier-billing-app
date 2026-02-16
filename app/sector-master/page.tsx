'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';

type SectorForm = {
  id?: string;
  code: string;
  name: string;
  active: boolean;
};

const initialForm: SectorForm = { code: '', name: '', active: true };

export default function SectorMaster() {
  const [form, setForm] = useState<SectorForm>(initialForm);
  const [sectors, setSectors] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [usageCounts, setUsageCounts] = useState<Record<string, { rates: number; states: number }>>({});

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    const res = await axios.get('/api/sector-master');
    setSectors(res.data);

    // Fetch usage counts for each sector (for UI badges)
    try {
      const [ratesRes, statesRes] = await Promise.all([
        axios.get('/api/sector-rates/count-by-sector'),
        axios.get('/api/state-master'),
      ]);

      const rateCountMap: Record<string, number> = {};
      if (Array.isArray(ratesRes.data)) {
        ratesRes.data.forEach((r: any) => {
          rateCountMap[r.sectorName] = (rateCountMap[r.sectorName] || 0) + 1;
        });
      }

      const stateCountMap: Record<string, number> = {};
      if (Array.isArray(statesRes.data)) {
        statesRes.data.forEach((s: any) => {
          if (s.sector) {
            stateCountMap[s.sector] = (stateCountMap[s.sector] || 0) + 1;
          }
        });
      }

      const counts: Record<string, { rates: number; states: number }> = {};
      res.data.forEach((sector: any) => {
        counts[sector.name] = {
          rates: rateCountMap[sector.name] || 0,
          states: stateCountMap[sector.name] || 0,
        };
      });
      setUsageCounts(counts);
    } catch {
      // Non-critical — just won't show usage badges
    }
  };

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
        const sector = sectors[editingIndex];
        await axios.put(`/api/sector-master/${sector.id}`, form);
        toast.success("Sector updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/sector-master', form);
        toast.success("Sector added");
      }
      fetchSectors();
      setForm(initialForm);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error saving sector";
      toast.error(msg);
    }
  };

  const handleEdit = (idx: number) => {
    setForm({
      id: sectors[idx].id,
      code: sectors[idx].code,
      name: sectors[idx].name,
      active: sectors[idx].active,
    });
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const sector = sectors[idx];
    const usage = usageCounts[sector.name];

    if (usage && (usage.rates > 0 || usage.states > 0)) {
      toast.error(`Cannot delete "${sector.name}": it's used by ${usage.rates} rate record(s) and ${usage.states} state(s).`);
      return;
    }

    if (!confirm(`Delete sector "${sector.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/sector-master/${sector.id}`);
      toast.success("Sector deleted");
      fetchSectors();
      setEditingIndex(null);
      setForm(initialForm);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error deleting sector";
      toast.error(msg);
    }
  };

  const filtered = sectors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 shadow-md">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" /> SECTOR MASTER
          </h1>
          <p className="text-purple-200 text-sm mt-1">⚠️ Sectors drive rate calculation. Edit with caution.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input name="code" value={form.code} onChange={handleChange} placeholder="Sector Code" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <input name="name" value={form.name} onChange={handleChange} placeholder="Sector Name" className="p-2 border rounded text-gray-500 border-gray-300" required />
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="text-gray-600 cursor-pointer" />
            <span className="text-gray-600 cursor-pointer">Active</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
        </form>
        <div className="px-6 pb-2 flex items-center space-x-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Sector" className="p-2 border rounded text-gray-500 border-gray-300" />
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => setSearch('')}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sector Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sector, idx) => {
                const usage = usageCounts[sector.name];
                const isInUse = usage && (usage.rates > 0 || usage.states > 0);
                return (
                  <tr key={sector.id} className={!sector.active ? 'opacity-50' : ''}>
                    <td className="px-3 py-2 text-gray-600 uppercase font-mono">{sector.code}</td>
                    <td className="px-3 py-2 text-gray-600 font-medium">{sector.name}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {usage ? (
                        <span>
                          {usage.rates > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1">{usage.rates} rates</span>}
                          {usage.states > 0 && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{usage.states} states</span>}
                          {!isInUse && <span className="text-gray-400">unused</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-center">{sector.active ? '✔️' : ''}</td>
                    <td className="px-3 py-2 text-gray-600 text-center">
                      <button type="button" onClick={() => handleEdit(idx)} className="text-purple-600 hover:underline cursor-pointer">✏️</button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className={`hover:underline cursor-pointer ${isInUse ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                        title={isInUse ? `In use by ${usage?.rates} rates, ${usage?.states} states` : 'Delete'}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}