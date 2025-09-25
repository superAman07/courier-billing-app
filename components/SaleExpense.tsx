'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

type LedgerEntry = {
    id: string;
    date: string;
    particulars: string;
    saleAmount?: number;
    clientPaymentReceived?: number;
    expenseAmount?: number;
    employeeAdvance?: number;
    officeAdvance?: number;
    depositInBank?: number;
    tsDeposit?: number;
    physicalMatch?: boolean;
    others?: string;
};

const initialFormState: Omit<LedgerEntry, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    particulars: '',
    saleAmount: 0,
    clientPaymentReceived: 0,
    expenseAmount: 0,
    employeeAdvance: 0,
    officeAdvance: 0,
    depositInBank: 0,
    tsDeposit: 0,
    physicalMatch: false,
    others: '',
};

export default function SaleExpensePage() {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/sale-expense');
            setEntries(data);
        } catch {
            toast.error("Failed to load ledger entries.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setForm(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/sale-expense/${editingId}` : '/api/sale-expense';
        const method = editingId ? 'put' : 'post';

        try {
            await axios[method](url, form);
            toast.success(`Entry ${editingId ? 'updated' : 'saved'} successfully!`);
            setForm(initialFormState);
            setEditingId(null);
            fetchEntries();
        } catch {
            toast.error("Failed to save entry.");
        }
    };
    
    const ledgerWithBalances = useMemo(() => {
        let cashInHand = 0;
        return entries.map(entry => {
            const inflow = (entry.saleAmount || 0) + (entry.clientPaymentReceived || 0);
            const outflow = (entry.expenseAmount || 0) + (entry.employeeAdvance || 0) + (entry.officeAdvance || 0) + (entry.depositInBank || 0) + (entry.tsDeposit || 0);
            cashInHand += (inflow - outflow);
            return {
                ...entry,
                cashInHand,
            };
        }).reverse();
    }, [entries]);

    return (
        <div className="p-8 bg-gray-50 text-gray-500 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Daily Sale & Expense Ledger</h1>
                
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input name="date" type="date" value={form.date} onChange={handleChange} className="p-2 border rounded" required />
                        <input name="particulars" placeholder="Particulars" value={form.particulars} onChange={handleChange} className="p-2 border rounded md:col-span-3" required />
                        
                        <input name="saleAmount" type="number" placeholder="Sale Amount" value={form.saleAmount} onChange={handleChange} className="p-2 border rounded" />
                        <input name="clientPaymentReceived" type="number" placeholder="Client Payment Received" value={form.clientPaymentReceived} onChange={handleChange} className="p-2 border rounded" />

                        <input name="expenseAmount" type="number" placeholder="Expense Amount" value={form.expenseAmount} onChange={handleChange} className="p-2 border rounded" />
                        <input name="employeeAdvance" type="number" placeholder="Employee Advance" value={form.employeeAdvance} onChange={handleChange} className="p-2 border rounded" />
                        <input name="officeAdvance" type="number" placeholder="Office Advance" value={form.officeAdvance} onChange={handleChange} className="p-2 border rounded" />
                        <input name="depositInBank" type="number" placeholder="Deposit in Bank" value={form.depositInBank} onChange={handleChange} className="p-2 border rounded" />
                        <input name="tsDeposit" type="number" placeholder="TS Deposit (DTDC)" value={form.tsDeposit} onChange={handleChange} className="p-2 border rounded" />

                        <button type="submit" className="md:col-start-4 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                            <PlusCircle size={18} /> {editingId ? 'Update Entry' : 'Add Entry'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-600">Date</th>
                                    <th className="p-3 text-left text-xs font-semibold text-gray-600">Particulars</th>
                                    <th className="p-3 text-right text-xs font-semibold text-green-600">Sale</th>
                                    <th className="p-3 text-right text-xs font-semibold text-green-600">Client Pymt</th>
                                    <th className="p-3 text-right text-xs font-semibold text-red-600">Expense</th>
                                    <th className="p-3 text-right text-xs font-semibold text-red-600">Advances</th>
                                    <th className="p-3 text-right text-xs font-semibold text-red-600">Deposits</th>
                                    <th className="p-3 text-right text-xs font-semibold text-blue-800">Cash In Hand</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-10"><Loader2 className="mx-auto animate-spin" /></td></tr>
                                ) : ledgerWithBalances.map(entry => (
                                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-sm">{entry.particulars}</td>
                                        <td className="p-3 text-sm text-right text-green-700">{(entry.saleAmount || 0).toFixed(2)}</td>
                                        <td className="p-3 text-sm text-right text-green-700">{(entry.clientPaymentReceived || 0).toFixed(2)}</td>
                                        <td className="p-3 text-sm text-right text-red-700">{(entry.expenseAmount || 0).toFixed(2)}</td>
                                        <td className="p-3 text-sm text-right text-red-700">{((entry.employeeAdvance || 0) + (entry.officeAdvance || 0)).toFixed(2)}</td>
                                        <td className="p-3 text-sm text-right text-red-700">{((entry.depositInBank || 0) + (entry.tsDeposit || 0)).toFixed(2)}</td>
                                        <td className="p-3 text-sm text-right font-bold text-blue-800">{entry.cashInHand.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}