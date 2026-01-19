'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit2, Loader2, Wallet, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';

type LedgerEntry = {
    id: string;
    date: string;
    particulars: string;
    sale: number;
    cashSale: number;
    codReceived: number;
    digitalSale: number;
    salePending: number;
    clientPayment: number;
    expenseAmount: number;
    expenseByDigital: number;
    employeeAdvance: number;
    bankDeposit: number;
    remarks: string;
};

// Types for Calculated Columns
type CalculatedLedger = LedgerEntry & {
    rowBalance: number;
    clientPaymentBalance: number;
    totalBalance: number;
};

// Use strings for form state to allow empty values instead of 0
const initialForm: any = {
    date: new Date().toISOString().split('T')[0],
    particulars: '',
    sale: '',
    cashSale: '',
    codReceived: '',
    digitalSale: '',
    salePending: '',
    clientPayment: '',
    expenseAmount: '',
    expenseByDigital: '',
    employeeAdvance: '',
    bankDeposit: '',
    remarks: '',
};

export default function SaleExpensePage() {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [form, setForm] = useState(initialForm);
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
        const { name, value } = e.target;
        // Allow empty string or numbers
        if (name === 'date' || name === 'particulars' || name === 'remarks') {
            setForm((prev: any) => ({ ...prev, [name]: value }));
        } else {
            // For number fields, keep as string to allow empty, parse on submit
            setForm((prev: any) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/sale-expense/${editingId}` : '/api/sale-expense';
        const method = editingId ? 'put' : 'post';

        // Convert empty strings to 0 for submission
        const payload = { ...form };
        const numberFields = ['sale', 'cashSale', 'codReceived', 'digitalSale', 'salePending', 'clientPayment', 'expenseAmount', 'expenseByDigital', 'employeeAdvance', 'bankDeposit'];
        numberFields.forEach(field => {
            payload[field] = payload[field] === '' ? 0 : parseFloat(payload[field]);
        });

        try {
            await axios[method](url, payload);
            toast.success(`Entry ${editingId ? 'updated' : 'saved'} successfully!`);
            setForm(initialForm);
            setEditingId(null);
            fetchEntries();
        } catch {
            toast.error("Failed to save entry.");
        }
    };

    const calculatedRows = useMemo(() => {
        let runningBalanceN = 0;
        let runningClientPayO = 0;

        // Calculate in chronological order (oldest to newest)
        const rows = entries.map((entry) => {
            const inflow = (entry.sale || 0) + (entry.cashSale || 0) + (entry.codReceived || 0);
            const outflow = (entry.salePending || 0) + (entry.expenseAmount || 0) + (entry.expenseByDigital || 0) + (entry.employeeAdvance || 0) + (entry.bankDeposit || 0);
            
            const dailyNet = inflow - outflow;
            
            runningBalanceN += dailyNet;
            runningClientPayO += (entry.clientPayment || 0);
            const totalBalanceP = runningBalanceN + runningClientPayO;

            return {
                ...entry,
                rowBalance: runningBalanceN,
                clientPaymentBalance: runningClientPayO,
                totalBalance: totalBalanceP
            };
        });

        // displayed as newest first
        return rows.reverse(); 
    }, [entries]);

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400";
    const labelClass = "block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider";
    const sectionTitle = "text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-1";

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-blue-600" />
                            Financial Ledger
                        </h1>
                        <p className="text-gray-500 mt-1">Track daily sales, expenses, and running balances.</p>
                    </div>
                </header>

                {/* --- PROFESSIONAL FORM --- */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                             {editingId ? <Edit2 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                             {editingId ? 'Edit Transaction' : 'New Transaction Entry'}
                        </h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            
                            {/* SECTION 1: BASIC INFO */}
                            <div className="md:col-span-3 space-y-4">
                                <div className={sectionTitle}><Calendar className="w-4 h-4 text-blue-600"/> Basic Details</div>
                                <div>
                                    <label className={labelClass}>Date</label>
                                    <input name="date" type="date" value={form.date} onChange={handleChange} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Particulars</label>
                                    <input name="particulars" placeholder="Enter description" value={form.particulars} onChange={handleChange} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Remarks</label>
                                    <input name="remarks" placeholder="Optional notes" value={form.remarks} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>

                            {/* SECTION 2: INFLOWS */}
                            <div className="md:col-span-4 space-y-4">
                                <div className={sectionTitle}><TrendingUp className="w-4 h-4 text-emerald-600"/> Income & Inflows</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClass}>Sale </label><input name="sale" type="number" placeholder="0.00" value={form.sale} onChange={handleChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>Cash Sale</label><input name="cashSale" type="number" placeholder="0.00" value={form.cashSale} onChange={handleChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>COD Rec.</label><input name="codReceived" type="number" placeholder="0.00" value={form.codReceived} onChange={handleChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>Client Pay (Mon)</label><input name="clientPayment" type="number" placeholder="0.00" value={form.clientPayment} onChange={handleChange} className={inputClass} /></div>
                                    <div className="col-span-2"><label className={labelClass}>Digital Sale (Info Only)</label><input name="digitalSale" type="number" placeholder="0.00" value={form.digitalSale} onChange={handleChange} className={inputClass} /></div>
                                </div>
                            </div>

                            {/* SECTION 3: OUTFLOWS */}
                            <div className="md:col-span-5 space-y-4">
                                <div className={sectionTitle}><TrendingDown className="w-4 h-4 text-rose-600"/> Expenses & Outflows</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClass}>Expense Amt</label><input name="expenseAmount" type="number" placeholder="0.00" value={form.expenseAmount} onChange={handleChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>Digital Exp</label><input name="expenseByDigital" type="number" placeholder="0.00" value={form.expenseByDigital} onChange={handleChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>Emp. Advance</label><input name="employeeAdvance" type="number" placeholder="0.00" value={form.employeeAdvance} onChange={handleChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>Bank Deposit</label><input name="bankDeposit" type="number" placeholder="0.00" value={form.bankDeposit} onChange={handleChange} className={inputClass} /></div>
                                    <div className="col-span-2"><label className={labelClass}>Sale Pending</label><input name="salePending" type="number" placeholder="0.00" value={form.salePending} onChange={handleChange} className={inputClass} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button type="submit" className="bg-blue-600 text-white cursor-pointer px-8 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold shadow-md transition-all active:scale-95">
                                {editingId ? 'Update Transaction' : 'Save Transaction'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- MODERN TABLE --- */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-800 text-gray-200 uppercase text-xs font-semibold tracking-wide">
                                <tr>
                                    <th className="px-4 py-4 min-w-[50px]">Sr</th>
                                    <th className="px-4 py-4 min-w-[100px]">Date</th>
                                    <th className="px-4 py-4 min-w-[180px]">Particulars</th>
                                    <th className="px-4 py-4 text-right">Sale</th>
                                    <th className="px-4 py-4 text-right">Cash Sale</th>
                                    <th className="px-4 py-4 text-right">COD Rec</th>
                                    <th className="px-4 py-4 text-right text-gray-400">Dig. Sale</th>
                                    <th className="px-4 py-4 text-right">Pending</th>
                                    <th className="px-4 py-4 text-right text-sky-400">Client Pay</th>
                                    <th className="px-4 py-4 text-right">Expenses</th>
                                    <th className="px-4 py-4 text-right">Dig. Exp</th>
                                    <th className="px-4 py-4 text-right">Emp Adv</th>
                                    <th className="px-4 py-4 text-right">Bank Dep</th>
                                    <th className="px-4 py-4 text-right bg-blue-900/50 text-white">Balance</th>
                                    <th className="px-4 py-4 text-right bg-indigo-900/50 text-white">CP Bal</th>
                                    <th className="px-4 py-4 text-right bg-emerald-900/50 text-white font-bold text-sm">Total Bal</th>
                                    <th className="px-4 py-4">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                     <tr><td colSpan={17} className="text-center py-12 text-gray-500 flex justify-center items-center gap-2"><Loader2 className="animate-spin"/> Loading data...</td></tr>
                                ) : calculatedRows.length === 0 ? (
                                    <tr><td colSpan={17} className="text-center py-12 text-gray-400">No transactions recorded yet.</td></tr>
                                ) : (
                                    calculatedRows.map((entry, idx) => (
                                    <tr key={entry.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-4 py-3 text-gray-500">{calculatedRows.length - idx}</td>
                                        <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{entry.particulars}</td>
                                        
                                        <td className="px-4 py-3 text-right text-emerald-600">{entry.sale ? entry.sale.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600">{entry.cashSale ? entry.cashSale.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600">{entry.codReceived ? entry.codReceived.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-gray-400 border-l border-gray-100">{entry.digitalSale ? entry.digitalSale.toLocaleString('en-IN') : '-'}</td>
                                        
                                        <td className="px-4 py-3 text-right text-rose-600 border-l border-gray-100">{entry.salePending ? entry.salePending.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-blue-600 font-medium">{entry.clientPayment ? entry.clientPayment.toLocaleString('en-IN') : '-'}</td>
                                        
                                        <td className="px-4 py-3 text-right text-rose-600">{entry.expenseAmount ? entry.expenseAmount.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-rose-600">{entry.expenseByDigital ? entry.expenseByDigital.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-rose-600">{entry.employeeAdvance ? entry.employeeAdvance.toLocaleString('en-IN') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-rose-600">{entry.bankDeposit ? entry.bankDeposit.toLocaleString('en-IN') : '-'}</td>
                                        
                                        {/* Running Balances */}
                                        <td className="px-4 py-3 text-right font-bold text-gray-700 bg-gray-50">{entry.rowBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50/50">{entry.clientPaymentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/50 border-l-2 border-emerald-200">{entry.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        
                                        <td className="px-4 py-3 text-gray-500 text-xs italic">{entry.remarks}</td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 'use client';
// import { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

// type LedgerEntry = {
//     id: string;
//     date: string;
//     particulars: string;
//     saleAmount?: number;
//     clientPaymentReceived?: number;
//     expenseAmount?: number;
//     employeeAdvance?: number;
//     officeAdvance?: number;
//     depositInBank?: number;
//     tsDeposit?: number;
//     physicalMatch?: boolean;
//     others?: string;
// };

// const initialFormState: Omit<LedgerEntry, 'id'> = {
//     date: new Date().toISOString().split('T')[0],
//     particulars: '',
//     saleAmount: 0,
//     clientPaymentReceived: 0,
//     expenseAmount: 0,
//     employeeAdvance: 0,
//     officeAdvance: 0,
//     depositInBank: 0,
//     tsDeposit: 0,
//     physicalMatch: false,
//     others: '',
// };

// export default function SaleExpensePage() {
//     const [entries, setEntries] = useState<LedgerEntry[]>([]);
//     const [form, setForm] = useState(initialFormState);
//     const [loading, setLoading] = useState(true);
//     const [editingId, setEditingId] = useState<string | null>(null);

//     const fetchEntries = async () => {
//         setLoading(true);
//         try {
//             const { data } = await axios.get('/api/sale-expense');
//             setEntries(data);
//         } catch {
//             toast.error("Failed to load ledger entries.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchEntries();
//     }, []);

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value, type } = e.target;
//         const isCheckbox = type === 'checkbox';
//         const checked = (e.target as HTMLInputElement).checked;
//         setForm(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         const url = editingId ? `/api/sale-expense/${editingId}` : '/api/sale-expense';
//         const method = editingId ? 'put' : 'post';

//         try {
//             await axios[method](url, form);
//             toast.success(`Entry ${editingId ? 'updated' : 'saved'} successfully!`);
//             setForm(initialFormState);
//             setEditingId(null);
//             fetchEntries();
//         } catch {
//             toast.error("Failed to save entry.");
//         }
//     };
    
//     const ledgerWithBalances = useMemo(() => {
//         let cashInHand = 0;
//         return entries.map(entry => {
//             const inflow = (entry.saleAmount || 0) + (entry.clientPaymentReceived || 0);
//             const outflow = (entry.expenseAmount || 0) + (entry.employeeAdvance || 0) + (entry.officeAdvance || 0) + (entry.depositInBank || 0) + (entry.tsDeposit || 0);
//             cashInHand += (inflow - outflow);
//             return {
//                 ...entry,
//                 cashInHand,
//             };
//         }).reverse();
//     }, [entries]);

//     return (
//         <div className="p-8 bg-gray-50 text-gray-500 min-h-screen">
//             <div className="max-w-7xl mx-auto">
//                 <h1 className="text-3xl font-bold text-gray-800 mb-6">Daily Sale & Expense Ledger</h1>
                
//                 <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//                     <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                         <input name="date" type="date" value={form.date} onChange={handleChange} className="p-2 border rounded" required />
//                         <input name="particulars" placeholder="Particulars" value={form.particulars} onChange={handleChange} className="p-2 border rounded md:col-span-3" required />
                        
//                         <input name="saleAmount" type="number" placeholder="Sale Amount" value={form.saleAmount} onChange={handleChange} className="p-2 border rounded" />
//                         <input name="clientPaymentReceived" type="number" placeholder="Client Payment Received" value={form.clientPaymentReceived} onChange={handleChange} className="p-2 border rounded" />

//                         <input name="expenseAmount" type="number" placeholder="Expense Amount" value={form.expenseAmount} onChange={handleChange} className="p-2 border rounded" />
//                         <input name="employeeAdvance" type="number" placeholder="Employee Advance" value={form.employeeAdvance} onChange={handleChange} className="p-2 border rounded" />
//                         <input name="officeAdvance" type="number" placeholder="Office Advance" value={form.officeAdvance} onChange={handleChange} className="p-2 border rounded" />
//                         <input name="depositInBank" type="number" placeholder="Deposit in Bank" value={form.depositInBank} onChange={handleChange} className="p-2 border rounded" />
//                         <input name="tsDeposit" type="number" placeholder="TS Deposit (DTDC)" value={form.tsDeposit} onChange={handleChange} className="p-2 border rounded" />

//                         <button type="submit" className="md:col-start-4 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
//                             <PlusCircle size={18} /> {editingId ? 'Update Entry' : 'Add Entry'}
//                         </button>
//                     </form>
//                 </div>

//                 <div className="bg-white rounded-lg shadow-md overflow-hidden">
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full">
//                             <thead className="bg-gray-100">
//                                 <tr>
//                                     <th className="p-3 text-left text-xs font-semibold text-gray-600">Date</th>
//                                     <th className="p-3 text-left text-xs font-semibold text-gray-600">Particulars</th>
//                                     <th className="p-3 text-right text-xs font-semibold text-green-600">Sale</th>
//                                     <th className="p-3 text-right text-xs font-semibold text-green-600">Client Pymt</th>
//                                     <th className="p-3 text-right text-xs font-semibold text-red-600">Expense</th>
//                                     <th className="p-3 text-right text-xs font-semibold text-red-600">Advances</th>
//                                     <th className="p-3 text-right text-xs font-semibold text-red-600">Deposits</th>
//                                     <th className="p-3 text-right text-xs font-semibold text-blue-800">Cash In Hand</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {loading ? (
//                                     <tr><td colSpan={8} className="text-center py-10"><Loader2 className="mx-auto animate-spin" /></td></tr>
//                                 ) : ledgerWithBalances.map(entry => (
//                                     <tr key={entry.id} className="border-b hover:bg-gray-50">
//                                         <td className="p-3 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
//                                         <td className="p-3 text-sm">{entry.particulars}</td>
//                                         <td className="p-3 text-sm text-right text-green-700">{(entry.saleAmount || 0).toFixed(2)}</td>
//                                         <td className="p-3 text-sm text-right text-green-700">{(entry.clientPaymentReceived || 0).toFixed(2)}</td>
//                                         <td className="p-3 text-sm text-right text-red-700">{(entry.expenseAmount || 0).toFixed(2)}</td>
//                                         <td className="p-3 text-sm text-right text-red-700">{((entry.employeeAdvance || 0) + (entry.officeAdvance || 0)).toFixed(2)}</td>
//                                         <td className="p-3 text-sm text-right text-red-700">{((entry.depositInBank || 0) + (entry.tsDeposit || 0)).toFixed(2)}</td>
//                                         <td className="p-3 text-sm text-right font-bold text-blue-800">{entry.cashInHand.toFixed(2)}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }