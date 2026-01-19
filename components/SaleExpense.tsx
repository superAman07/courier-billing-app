'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, Calculator } from 'lucide-react';

type LedgerEntry = {
    id: string;
    date: string; // B
    particulars: string; // C
    sale: number; // D
    cashSale: number; // E
    codReceived: number; // F
    digitalSale: number; // G
    salePending: number; // H
    clientPayment: number; // I
    expenseAmount: number; // J
    expenseByDigital: number; // K
    employeeAdvance: number; // L
    bankDeposit: number; // M
    remarks: string; // Q
};

// Types for Calculated Columns
type CalculatedLedger = LedgerEntry & {
    rowBalance: number; // N
    clientPaymentBalance: number; // O
    totalBalance: number; // P
};

const initialForm = {
    date: new Date().toISOString().split('T')[0],
    particulars: '',
    sale: 0,
    cashSale: 0,
    codReceived: 0,
    digitalSale: 0,
    salePending: 0,
    clientPayment: 0,
    expenseAmount: 0,
    expenseByDigital: 0,
    employeeAdvance: 0,
    bankDeposit: 0,
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
        const { name, value, type } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/sale-expense/${editingId}` : '/api/sale-expense'; // Note: Ensure DELETE/PUT route exists too
        const method = editingId ? 'put' : 'post'; // You might need to add PUT support in route.ts if not there

        try {
            await axios[method](url, form);
            toast.success(`Entry ${editingId ? 'updated' : 'saved'} successfully!`);
            setForm(initialForm);
            setEditingId(null);
            fetchEntries();
        } catch {
            toast.error("Failed to save entry.");
        }
    };

    // CORE CALCULATION LOGIC AS PER EXCEL FORMULAS
    const calculatedRows = useMemo(() => {
        let runningBalanceN = 0; // Col N
        let runningClientPayO = 0; // Col O

        return entries.map((entry) => {
            // Formula for Row Net Change:
            // Input: Sale(D) + Cash Sale(E) + COD(F) 
            // Minus: Sale Pending(H) + Exp(J) + Dig Exp(K) + Emp Adv(L) + Bank Dep(M)
            // (Note: Digital Sale G is NOT in the formula provided by user, so excluded here)
            
            const inflow = (entry.sale || 0) + (entry.cashSale || 0) + (entry.codReceived || 0);
            const outflow = (entry.salePending || 0) + (entry.expenseAmount || 0) + (entry.expenseByDigital || 0) + (entry.employeeAdvance || 0) + (entry.bankDeposit || 0);
            
            const dailyNet = inflow - outflow;
            
            // Col N: Balance (Running)
            runningBalanceN += dailyNet;

            // Col O: Client Payment Balance (Running)
            runningClientPayO += (entry.clientPayment || 0);

            // Col P: Total Balance (N + O)
            const totalBalanceP = runningBalanceN + runningClientPayO;

            return {
                ...entry,
                rowBalance: runningBalanceN,
                clientPaymentBalance: runningClientPayO,
                totalBalance: totalBalanceP
            };
        }).reverse(); // Reverse for display order (Newest first) if preferred, or keep strictly ASC matches Excel
        // Reversing here so UI shows latest at top, but calc was done in correct chronological order
    }, [entries]);

    const inputClass = "p-2 border rounded w-full text-sm";
    const labelClass = "text-xs font-semibold text-gray-500 mb-1 block";

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
             <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600"/> 
                    Daily Sale & Expense Ledger
                </h1>

                {/* --- DATA ENTRY FORM --- */}
                <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelClass}>B - Date</label>
                        <input name="date" type="date" value={form.date} onChange={handleChange} className={inputClass} required />
                    </div>
                    <div className="col-span-2 md:col-span-2">
                        <label className={labelClass}>C - Particulars</label>
                        <input name="particulars" placeholder="Description" value={form.particulars} onChange={handleChange} className={inputClass} required />
                    </div>
                    
                    {/* INFLOWS */}
                    <div><label className={labelClass}>D - Sale</label><input name="sale" type="number" value={form.sale} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>E - Cash Sale</label><input name="cashSale" type="number" value={form.cashSale} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>F - COD Rec</label><input name="codReceived" type="number" value={form.codReceived} onChange={handleChange} className={inputClass} /></div>
                    
                    {/* OUTFLOWS / ADJUSTMENTS */}
                    <div><label className={labelClass}>H - Sale Pending</label><input name="salePending" type="number" value={form.salePending} onChange={handleChange} className={inputClass} /></div>
                    
                    {/* EXPENSES */}
                    <div><label className={labelClass}>J - Exp Amt</label><input name="expenseAmount" type="number" value={form.expenseAmount} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>K - Dig. Exp</label><input name="expenseByDigital" type="number" value={form.expenseByDigital} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>L - Emp Adv</label><input name="employeeAdvance" type="number" value={form.employeeAdvance} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>M - Bank Dep</label><input name="bankDeposit" type="number" value={form.bankDeposit} onChange={handleChange} className={inputClass} /></div>

                    {/* OTHER */}
                    <div><label className={labelClass}>G - Digital Sale</label><input name="digitalSale" type="number" value={form.digitalSale} onChange={handleChange} className={inputClass} title="Not used in Balance Calc" /></div>
                    <div><label className={labelClass}>I - Client Pay</label><input name="clientPayment" type="number" value={form.clientPayment} onChange={handleChange} className={inputClass} /></div>
                    
                    <div className="col-span-2"><label className={labelClass}>Q - Remarks</label><input name="remarks" value={form.remarks} onChange={handleChange} className={inputClass} /></div>

                    <div className="col-span-2 md:col-span-6 flex justify-end mt-2">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm">
                            <PlusCircle size={18} /> {editingId ? 'Update Entry' : 'Add Ledger Entry'}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- EXCEL STYLE TABLE --- */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-[100%] mx-auto overflow-x-auto border border-gray-200">
                <table className="min-w-max text-xs border-collapse">
                    <thead className="bg-slate-800 text-white sticky top-0">
                        <tr>
                            <th className="p-2 border border-slate-600 font-normal">A<br/>Sr</th>
                            <th className="p-2 border border-slate-600 font-normal min-w-[90px]">B<br/>Date</th>
                            <th className="p-2 border border-slate-600 font-normal min-w-[150px]">C<br/>Particulars</th>
                            <th className="p-2 border border-slate-600 font-normal bg-green-900">D<br/>Sale</th>
                            <th className="p-2 border border-slate-600 font-normal bg-green-900">E<br/>Cash Sale</th>
                            <th className="p-2 border border-slate-600 font-normal bg-green-900">F<br/>COD Rec</th>
                            <th className="p-2 border border-slate-600 font-normal">G<br/>Dig. Sale</th>
                            <th className="p-2 border border-slate-600 font-normal bg-red-900">H<br/>Sale Pend</th>
                            <th className="p-2 border border-slate-600 font-normal">I<br/>Cli Pay</th>
                            <th className="p-2 border border-slate-600 font-normal bg-red-900">J<br/>Exp Amt</th>
                            <th className="p-2 border border-slate-600 font-normal bg-red-900">K<br/>Dig Exp</th>
                            <th className="p-2 border border-slate-600 font-normal bg-red-900">L<br/>Emp Adv</th>
                            <th className="p-2 border border-slate-600 font-normal bg-red-900">M<br/>Bank Dep</th>
                            <th className="p-2 border border-slate-600 font-bold bg-blue-900">N<br/>Balance</th>
                            <th className="p-2 border border-slate-600 font-bold bg-blue-800">O<br/>Cli Pay Bal</th>
                            <th className="p-2 border border-slate-600 font-bold bg-indigo-900">P<br/>Total Bal</th>
                            <th className="p-2 border border-slate-600 font-normal">Q<br/>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan={17} className="text-center py-10"><Loader2 className="mx-auto animate-spin" /></td></tr>
                        ) : calculatedRows.map((entry, idx) => (
                            <tr key={entry.id} className="hover:bg-blue-50 transition-colors even:bg-white odd:bg-gray-50 text-gray-700">
                                <td className="p-2 border text-center">{calculatedRows.length - idx}</td>
                                <td className="p-2 border whitespace-nowrap">{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                <td className="p-2 border font-medium">{entry.particulars}</td>
                                <td className="p-2 border text-right">{entry.sale || "-"}</td>
                                <td className="p-2 border text-right">{entry.cashSale || "-"}</td>
                                <td className="p-2 border text-right">{entry.codReceived || "-"}</td>
                                <td className="p-2 border text-right text-gray-400">{entry.digitalSale || "-"}</td>
                                <td className="p-2 border text-right text-red-600">{entry.salePending || "-"}</td>
                                <td className="p-2 border text-right text-blue-600">{entry.clientPayment || "-"}</td>
                                <td className="p-2 border text-right text-red-600">{entry.expenseAmount || "-"}</td>
                                <td className="p-2 border text-right text-red-600">{entry.expenseByDigital || "-"}</td>
                                <td className="p-2 border text-right text-red-600">{entry.employeeAdvance || "-"}</td>
                                <td className="p-2 border text-right text-red-600">{entry.bankDeposit || "-"}</td>
                                
                                {/* CALCULATED COLUMNS */}
                                <td className="p-2 border text-right font-bold bg-blue-50 text-blue-900">{entry.rowBalance.toFixed(2)}</td>
                                <td className="p-2 border text-right font-bold bg-blue-50 text-blue-800">{entry.clientPaymentBalance.toFixed(2)}</td>
                                <td className="p-2 border text-right font-bold bg-indigo-100 text-indigo-900 border-l-2 border-indigo-300">{entry.totalBalance.toFixed(2)}</td>
                                
                                <td className="p-2 border text-xs">{entry.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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