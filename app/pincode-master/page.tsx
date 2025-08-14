'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type StateType = { id: string; name: string; };
type CityType = { id: string; name: string; code: string; stateId: string; };
type PincodeForm = {
  id?: string;
  pincode: string;
  stateId: string;
  cityId: string;
  active: boolean;
};

const initialForm: PincodeForm = { pincode: '', stateId: '', cityId: '', active: true };

export default function PincodeMaster() {
  const [form, setForm] = useState<PincodeForm>(initialForm);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [states, setStates] = useState<StateType[]>([]);
  const [cities, setCities] = useState<CityType[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  useEffect(() => {
    axios.get('/api/pincode-master').then(res => setPincodes(res.data));
    axios.get('/api/state-master').then(res => setStates(res.data));
    axios.get('/api/city-master').then(res => setCities(res.data));
  }, []);

  const filteredCities = form.stateId
    ? cities.filter(city => city.stateId === form.stateId)
    : [];

  const filterCitiesForDropdown = stateFilter === 'ALL'
    ? cities
    : cities.filter(city => city.stateId === stateFilter);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
      ...(name === 'stateId' ? { cityId: '' } : {})  
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        const pin = pincodes[editingIndex];
        await axios.put(`/api/pincode-master/${pin.id}`, form);
        toast.success("Pincode updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/pincode-master', form);
        toast.success("Pincode added");
      }
      axios.get('/api/pincode-master').then(res => setPincodes(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving pincode");
    }
  };

  const handleEdit = (idx: number) => {
    setForm({
      id: pincodes[idx].id,
      pincode: pincodes[idx].pincode,
      stateId: pincodes[idx].stateId,
      cityId: pincodes[idx].cityId,
      active: pincodes[idx].active,
    });
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const pin = pincodes[idx];
    if (!confirm(`Delete pincode "${pin.pincode}"?`)) return;
    try {
      await axios.delete(`/api/pincode-master/${pin.id}`);
      toast.success("Pincode deleted");
      axios.get('/api/pincode-master').then(res => setPincodes(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting pincode");
    }
  };

  const filtered = pincodes.filter(p =>
    (stateFilter === 'ALL' || p.stateId === stateFilter) &&
    (cityFilter === 'ALL' || p.cityId === cityFilter) &&
    (p.pincode.includes(search))
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">PINCODE MASTER</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
          <select name="stateId" value={form.stateId} onChange={handleChange} className="p-2 border rounded text-gray-500 border-gray-300" required>
            <option value="">-- Select State --</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="cityId" value={form.cityId} onChange={handleChange} className="p-2 border rounded text-gray-500 border-gray-300" required>
            <option value="">-- Select City --</option>
            {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="text-gray-600 cursor-pointer" />
            <span className="text-gray-600 cursor-pointer">Active</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
        </form>
        <div className="px-6 pb-2 flex items-center space-x-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Pincode" className="p-2 border rounded text-gray-500 border-gray-300" />
          <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setCityFilter('ALL'); }} className="p-2 border rounded text-gray-500 border-gray-300">
            <option value="ALL">All States</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="p-2 border rounded text-gray-500 border-gray-300">
            <option value="ALL">All Cities</option>
            {filterCitiesForDropdown.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => { setSearch(''); setStateFilter('ALL'); setCityFilter('ALL'); }}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pincode</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pin, idx) => (
                <tr key={pin.pincode}>
                  <td className="px-3 py-2 text-gray-600 uppercase">{pin.pincode}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{pin.state?.name || ''}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{pin.city?.name || ''}</td>
                  <td className="px-3 py-2 text-gray-600 uppercase">{pin.city?.code || ''}</td>
                  <td className="px-3 py-2 text-gray-600 text-center">{pin.active ? '✔️' : ''}</td>
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