'use client'
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

type TaxForm = {
    id?: string;
    taxCode: string;
    description: string;
    ratePercent: string;
    withinState: boolean;
    forOtherState: boolean;
    active: boolean;
};

const initialForm: TaxForm = {
    taxCode: '',
    description: '',
    ratePercent: '',
    withinState: false,
    forOtherState: false,
    active: true,
};

export default function TaxMaster() {
    const [form, setForm] = useState<TaxForm>(initialForm);
    const [taxes, setTaxes] = useState<TaxForm[]>([]); // Replace with backend data
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    useEffect(() => {
        axios.get("/api/taxMaster").then(res => setTaxes(res.data));
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
                const tax = taxes[editingIndex];
                await axios.put(`/api/taxMaster/${tax.id}`, form);
                toast.success("Tax updated successfully");
                setEditingIndex(null);
            } else {
                await axios.post("/api/taxMaster", form);
                toast.success("Tax added successfully");
            }
            axios.get("/api/taxMaster").then(res => setTaxes(res.data));
            setForm(initialForm);
        } catch (error) {
            toast.error("Error saving tax");
        }
    };

    const handleEdit = (idx: number) => {
        setForm(taxes[idx]);
        setEditingIndex(idx);
    };

    const handleDelete = async (idx: number) => {
        const tax = taxes[idx];
        if (!confirm(`Are you sure you want to delete tax "${tax.taxCode}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await axios.delete(`/api/taxMaster/${tax.id}`);
            toast.success("Tax deleted successfully");
            axios.get("/api/taxMaster").then(res => setTaxes(res.data));
            setEditingIndex(null);
            setForm(initialForm);
        } catch (error) {
            toast.error("Error deleting tax");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white">TAX MASTER</h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <input name="taxCode" value={form.taxCode} onChange={handleChange} placeholder="Tax Code" className="p-2 border rounded text-gray-500 border-gray-300 uppercase" required />
                    <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded text-gray-500 border-gray-300" required />
                    <input name="ratePercent" value={form.ratePercent} onChange={handleChange} placeholder="Tax %" className="p-2 border rounded text-gray-500 border-gray-300" required type="number" step="0.001" />
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="withinState" className='text-gray-600 cursor-pointer' checked={form.withinState} onChange={handleChange} />
                        <span className='text-gray-600 cursor-pointer'>Within State</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="forOtherState" className='text-gray-600 cursor-pointer' checked={form.forOtherState} onChange={handleChange} />
                        <span className='text-gray-600 cursor-pointer'>For Other State</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="active" className='text-gray-600 cursor-pointer' checked={form.active} onChange={handleChange} />
                        <span className='text-gray-600 cursor-pointer'>Active</span>
                    </label>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer">{editingIndex !== null ? 'Update' : 'Add'}</button>
                </form>
                <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax Code</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Within State</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">For Other State</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxes.map((tax, idx) => (
                                <tr key={tax.taxCode}>
                                    <td className="px-3 py-2 text-gray-600 uppercase">{tax.taxCode}</td>
                                    <td className="px-3 py-2 text-gray-600">{tax.description}</td>
                                    <td className="px-3 py-2 text-gray-600">{Number(tax.ratePercent).toFixed(3)}</td>
                                    <td className="px-3 py-2 text-gray-600 text-center">{tax.withinState ? '✔️' : ''}</td>
                                    <td className="px-3 py-2 text-gray-600 text-center">{tax.forOtherState ? '✔️' : ''}</td>
                                    <td className="px-3 py-2 text-gray-600 text-center">{tax.active ? '✔️' : ''}</td>
                                    <td className="px-3 py-2 text-gray-600 text-center">
                                        <button type="button" onClick={() => handleEdit(idx)} className="text-emerald-600 hover:underline cursor-pointer">✏️</button>
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