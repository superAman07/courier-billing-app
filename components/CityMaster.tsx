'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type CityForm = {
    id?: string;
    code: string;
    name: string;
    stateId: string;
    active: boolean;
};

type StateType = { id: string; code: string; name: string; };

const initialForm: CityForm = { code: '', name: '', stateId: '', active: true };

export default function CityMaster() {
    const [form, setForm] = useState<CityForm>(initialForm);
    const [cities, setCities] = useState<any[]>([]);
    const [states, setStates] = useState<StateType[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('ALL');

    useEffect(() => {
        axios.get('/api/city-master').then(res => setCities(res.data));
        axios.get('/api/state-master').then(res => setStates(res.data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const { name, value, type } = target;
        const checked = (target as HTMLInputElement).checked;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingIndex !== null) {
                const city = cities[editingIndex];
                await axios.put(`/api/city-master/${city.id}`, form);
                toast.success("City updated");
                setEditingIndex(null);
            } else {
                await axios.post('/api/city-master', form);
                toast.success("City added");
            }
            axios.get('/api/city-master').then(res => setCities(res.data));
            setForm(initialForm);
        } catch {
            toast.error("Error saving city");
        }
    };

    const handleEdit = (idx: number) => {
        setForm({
            id: cities[idx].id,
            code: cities[idx].code,
            name: cities[idx].name,
            stateId: cities[idx].stateId,
            active: cities[idx].active,
        });
        setEditingIndex(idx);
    };

    const handleDelete = async (idx: number) => {
        const city = cities[idx];
        if (!confirm(`Delete city "${city.name}"?`)) return;
        try {
            await axios.delete(`/api/city-master/${city.id}`);
            toast.success("City deleted");
            axios.get('/api/city-master').then(res => setCities(res.data));
            setEditingIndex(null);
            setForm(initialForm);
        } catch {
            toast.error("Error deleting city");
        }
    };

    const filtered = cities.filter(c =>
        (stateFilter === 'ALL' || c.stateId === stateFilter) &&
        (c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-pink-600 via-pink-700 to-pink-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white">CITY MASTER</h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <input name="code" value={form.code} onChange={handleChange} placeholder="City Code" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
                    <input name="name" value={form.name} onChange={handleChange} placeholder="City Description" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
                    <select name="stateId" value={form.stateId} onChange={handleChange} className="p-2 border cursor-pointer rounded text-gray-500 border-gray-300" required>
                        <option value="">-- Select State --</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="text-gray-600 cursor-pointer" />
                        <span className="text-gray-600 cursor-pointer">Active</span>
                    </label>
                    <button type="submit" className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
                </form>
                <div className="px-6 pb-2 flex items-center space-x-2">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find City" className="p-2 border rounded text-gray-500 border-gray-300" />
                    <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="p-2 border cursor-pointer rounded text-gray-500 border-gray-300">
                        <option value="ALL">All States</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                    <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => { setSearch(''); setStateFilter('ALL'); }}>Clear</button>
                </div>
                <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City State</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((city, idx) => (
                                <tr key={city.code}>
                                    <td className="px-3 py-2 text-gray-600 uppercase">{city.code}</td>
                                    <td className="px-3 py-2 text-gray-600 uppercase">{city.name}</td>
                                    <td className="px-3 py-2 text-gray-600 uppercase">{city.state?.name || ''}</td>
                                    <td className="px-3 py-2 text-gray-600 text-center">{city.active ? '✔️' : ''}</td>
                                    <td className="px-3 py-2 text-gray-600 text-center">
                                        <button type="button" onClick={() => handleEdit(idx)} className="text-pink-600 hover:underline cursor-pointer">✏️</button>
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