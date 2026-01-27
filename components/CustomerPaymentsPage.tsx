'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';
import { DollarSign, Receipt, Hourglass, CheckCircle, XCircle, Banknote, Calendar, FileImage, Loader2, Search, Info } from 'lucide-react';

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

interface PaymentDetail {
    amountApplied: number;
    payment: {
        id: string;
        paymentDate: string;
        paymentMethod: string;
        referenceNo: string | null;
        receivedBy: string | null;
        remarks: string | null;
        discuss: string | null;
    }
}

const StatCard = ({ title, value, icon: Icon, colorName }: { title: string, value: string, icon: React.ElementType, colorName: 'blue' | 'green' | 'red' }) => {
    const styles = {
        blue: {
            border: 'border-blue-500',
            bg: 'bg-blue-100',
            text: 'text-blue-500',
        },
        green: {
            border: 'border-green-500',
            bg: 'bg-green-100',
            text: 'text-green-500',
        },
        red: {
            border: 'border-red-500',
            bg: 'bg-red-100',
            text: 'text-red-500',
        },
    };
    const style = styles[colorName];

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 ${style.border}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${style.bg}`}>
                    <Icon className={`w-6 h-6 ${style.text}`} />
                </div>
            </div>
        </div>
    );
};

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
    const [employees, setEmployees] = useState<{ id: string, employeeName: string }[]>([]);
    const [loading, setLoading] = useState({ customers: true, invoices: false, details: false });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [invoicePaymentDetails, setInvoicePaymentDetails] = useState<PaymentDetail[]>([]);
    const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);

    useEffect(() => {
        axios.get('/api/customers?hasInvoices=true')
            .then(res => setCustomers(res.data))
            .catch(() => toast.error('Failed to load customers.'))
            .finally(() => setLoading(prev => ({ ...prev, customers: false })));

        axios.get('/api/employee-master')
            .then(res => setEmployees(res.data))
            .catch(() => toast.error('Failed to load employees.'));
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

    const handleViewDetails = async (invoice: Invoice) => {
        setSelectedInvoiceForDetails(invoice);
        setIsDetailsModalOpen(true);
        setLoading(prev => ({ ...prev, details: true }));
        try {
            const { data } = await axios.get(`/api/invoices/${invoice.id}/payments`);
            setInvoicePaymentDetails(data);
        } catch (error) {
            toast.error("Failed to load payment details.");
        } finally {
            setLoading(prev => ({ ...prev, details: false }));
        }
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
                        className="text-gray-600 cursor-pointer"
                        classNamePrefix="select"
                    />
                </div>

                {selectedCustomer && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard title="Total Invoiced" value={`₹${summary.totalInvoiced.toFixed(2)}`} icon={Receipt} colorName="blue" />
                            <StatCard title="Total Paid" value={`₹${summary.totalPaid.toFixed(2)}`} icon={CheckCircle} colorName="green" />
                            <StatCard title="Balance Due" value={`₹${Math.round(summary.balanceDue).toFixed(2)}`} icon={Hourglass} colorName="red" />
                        </div>

                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="p-4 flex justify-between items-center border-b bg-gray-50">
                                <h2 className="text-xl font-semibold text-gray-700">Invoices for {selectedCustomer.customerName}</h2>
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">
                                    <DollarSign className="w-5 h-5" />
                                    Record Payment
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
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
                                                    <td className="px-4 py-3 font-mono text-sm text-gray-800">{inv.invoiceNo}
                                                        <button onClick={() => handleViewDetails(inv)} title="View payment details">
                                                            <Info className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer ml-1 my-auto" />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-800">₹{inv.netAmount.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm text-green-700">₹{inv.amountPaid.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-sm text-red-700">₹{(Math.round(inv.netAmount - inv.amountPaid)).toFixed(2)}</td>
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
                    employees={employees}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        axios.get(`/api/invoices?customerId=${selectedCustomer!.id}`).then(res => setInvoices(res.data.data));
                    }}
                />
            )}
            {isDetailsModalOpen && (
                <PaymentDetailsModal
                    invoice={selectedInvoiceForDetails}
                    details={invoicePaymentDetails}
                    loading={loading.details}
                    onClose={() => setIsDetailsModalOpen(false)}
                />
            )}
        </div>
    );
}

function PaymentDetailsModal({ invoice, details, loading, onClose }: { invoice: Invoice | null, details: PaymentDetail[], loading: boolean, onClose: () => void }) {
    if (!invoice) return null;
    const [viewMore , setViewMore] = useState(false);

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300"
            >
                <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
                        <p className="text-sm text-gray-500">For Invoice <span className="font-semibold text-gray-700">{invoice.invoiceNo}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><XCircle className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : details.length > 0 ? (
                        <ul className="space-y-3">
                            {details.map(detail => (
                                <li key={detail.payment.id}>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <div>
                                            <p className="font-semibold text-green-600 text-lg">₹{detail.amountApplied.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(detail.payment.paymentDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-700">{detail.payment.paymentMethod}</p>
                                            {detail.payment.referenceNo && <p className="text-xs text-gray-500 font-mono">Ref: {detail.payment.referenceNo}</p>}
                                            <button onClick={()=>setViewMore(!viewMore)} className='text-blue-500 hover:underline cursor-pointer text-[12px]'>View more</button>
                                        </div>
                                    </div>
                                    {viewMore && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                                            {detail.payment.receivedBy && <p className="text-gray-600"><span className="font-semibold">Received By:</span> {detail.payment.receivedBy}</p>}
                                            {detail.payment.remarks && <p className="text-gray-600 mt-1"><span className="font-semibold">Remarks:</span> {detail.payment.remarks}</p>}
                                            {detail.payment.discuss && <p className="text-gray-600 mt-1"><span className="font-semibold">Internal Discussion:</span> {detail.payment.discuss}</p>}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <p>No payments have been applied to this invoice yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RecordPaymentModal({ customer, employees, onClose, onSuccess }: { customer: Customer, employees: { id: string, employeeName: string }[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK',
        referenceNo: '',
        receivedBy: '',
        remarks: '',
        discuss: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('customerId', customer.id);
            data.append('amount', formData.amount);
            data.append('paymentDate', formData.paymentDate);
            data.append('paymentMethod', formData.paymentMethod);
            data.append('referenceNo', formData.referenceNo);
            data.append('receivedBy', formData.receivedBy);
            data.append('remarks', formData.remarks);
            data.append('discuss', formData.discuss);
            await axios.post('/api/customer-payment-updates', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            >
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-800">Record Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} id="payment-form" className="p-6 space-y-4 flex-1 overflow-y-auto">
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
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full cursor-pointer pl-10 p-2 border rounded-md text-gray-600 appearance-none" required>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                        <select name="receivedBy" value={formData.receivedBy} onChange={handleChange} className="w-full p-2 border rounded-md text-gray-600 appearance-none">
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.employeeName}>{emp.employeeName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md text-gray-600" placeholder="Payment notes, e.g., 'Advance for next month'"></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Discussion</label>
                        <textarea name="discuss" value={formData.discuss} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md text-gray-600" placeholder="Internal notes for follow-up"></textarea>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" form="payment-form" disabled={submitting} className="px-4 py-2 cursor-pointer bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                            {submitting ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}