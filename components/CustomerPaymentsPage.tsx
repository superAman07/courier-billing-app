'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';
import { DollarSign, Receipt, Hourglass, CheckCircle, XCircle, Banknote, Calendar, FileImage, Loader2, Search } from 'lucide-react';

interface Customer {
    id: string;
    customerName: string;
    customerCode: string;
}

interface Invoice {
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    netAmount: number;
    amountPaid: number;
    paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 ${color}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border', 'bg').replace('-500', '-100')}`}>
                <Icon className={`w-6 h-6 ${color.replace('border', 'text')}`} />
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: Invoice['paymentStatus'] }) => {
    const styles = {
        PAID: 'bg-green-100 text-green-800',
        PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
        UNPAID: 'bg-red-100 text-red-800',
    };
    return <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status.replace('_', ' ')}</span>;
};

export default function CustomerPaymentsPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState({ customers: true, invoices: false });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        axios.get('/api/customers')
            .then(res => setCustomers(res.data))
            .catch(() => toast.error('Failed to load customers.'))
            .finally(() => setLoading(prev => ({ ...prev, customers: false })));
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            setLoading(prev => ({ ...prev, invoices: true }));
            axios.get(`/api/invoices?customerId=${selectedCustomer.id}`)
                .then(res => setInvoices(res.data.data))
                .catch(() => toast.error('Failed to load invoices for customer.'))
                .finally(() => setLoading(prev => ({ ...prev, invoices: false })));
        } else {
            setInvoices([]);
        }
    }, [selectedCustomer]);

    const customerOptions = customers.map(c => ({
        value: c.id,
        label: `${c.customerName} (${c.customerCode})`,
        customer: c
    }));

    const summary = useMemo(() => {
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        return {
            totalInvoiced,
            totalPaid,
            balanceDue: totalInvoiced - totalPaid,
        };
    }, [invoices]);

    const handleCustomerChange = (option: any) => {
        setSelectedCustomer(option ? option.customer : null);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Customer Payments</h1>
                    <p className="text-lg text-gray-500 mt-1">Record payments and track invoice statuses.</p>
                </header>

                <div className="mb-8 p-6 bg-white rounded-xl shadow-md">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select a Customer</label>
                    <Select
                        options={customerOptions}
                        onChange={handleCustomerChange}
                        isLoading={loading.customers}
                        isClearable
                        placeholder="Search by customer name or code..."
                        className="text-gray-600"
                        classNamePrefix="select"
                    />
                </div>

                {selectedCustomer && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard title="Total Invoiced" value={`₹${summary.totalInvoiced.toFixed(2)}`} icon={Receipt} color="border-blue-500" />
                            <StatCard title="Total Paid" value={`₹${summary.totalPaid.toFixed(2)}`} icon={CheckCircle} color="border-green-500" />
                            <StatCard title="Balance Due" value={`₹${summary.balanceDue.toFixed(2)}`} icon={Hourglass} color="border-red-500" />
                        </div>

                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="p-4 flex justify-between items-center border-b bg-gray-50">
                                <h2 className="text-xl font-semibold text-gray-700">Invoices for {selectedCustomer.customerName}</h2>
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">
                                    <DollarSign className="w-5 h-5" />
                                    Record Payment
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount Paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance Due</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading.invoices ? (
                                            <tr><td colSpan={6} className="text-center py-10"><Loader2 className="mx-auto animate-spin w-8 h-8 text-gray-400" /></td></tr>
                                        ) : invoices.length > 0 ? (
                                            invoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-mono text-sm text-gray-800">{inv.invoiceNo}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-800">₹{inv.netAmount.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm text-green-700">₹{inv.amountPaid.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm text-red-700">₹{(inv.netAmount - inv.amountPaid).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center"><StatusBadge status={inv.paymentStatus} /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} className="text-center py-10 text-gray-500">No invoices found for this customer.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {isModalOpen && (
                <RecordPaymentModal
                    customer={selectedCustomer!}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        // Re-fetch invoices to show updated data
                        axios.get(`/api/invoices?customerId=${selectedCustomer!.id}`).then(res => setInvoices(res.data));
                    }}
                />
            )}
        </div>
    );
}

// Payment Modal Component
function RecordPaymentModal({ customer, onClose, onSuccess }: { customer: Customer, onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK',
        referenceNo: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/customer-payment-updates', {
                ...formData,
                customerId: customer.id,
            });
            toast.success('Payment recorded successfully!');
            onSuccess();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to record payment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Record Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full pl-10 p-2 border rounded-md text-gray-600" required autoFocus />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className="w-full pl-10 p-2 border rounded-md text-gray-600" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full pl-10 p-2 border rounded-md text-gray-600 appearance-none" required>
                                <option>BANK</option>
                                <option>UPI</option>
                                <option>CASH</option>
                                <option>CHEQUE</option>
                                <option>OTHER</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reference No (Optional)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" name="referenceNo" value={formData.referenceNo} onChange={handleChange} className="w-full pl-10 p-2 border rounded-md text-gray-600" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                            {submitting ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}