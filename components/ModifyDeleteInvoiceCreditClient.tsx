'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { parseDateString } from "@/lib/convertDateInJSFormat";

export default function ModifyDeleteInvoiceCreditClient() {
  const [type, setType] = useState<'CreditClientBooking' | 'InternationalCreditClientBooking'>('CreditClientBooking');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    // Fetch customers for dropdown
    axios.get('/api/customers').then(res => {
      setCustomers(
        res.data.filter((c: any) =>
          type === 'CreditClientBooking' ? !c.isInternational : !!c.isInternational
        )
      );
    });
    setCustomerId('');
    setInvoices([]);
  }, [type]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = { type };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (invoiceNo) params.invoiceNo = invoiceNo;
      if (customerId) params.customerId = customerId;
      const { data } = await axios.get('/api/invoices', { params });
      setInvoices(Array.isArray(data) ? data : data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchInvoices();
    // eslint-disable-next-line
  }, [type, customerId]);

  const handleEdit = (inv: any) => {
    setEditId(inv.id);
    setEditDate(inv.invoiceDate?.slice(0, 10) || '');
  };

  const handleEditSave = async (id: string) => {
    try {
      await axios.put(`/api/invoices/${id}`, { invoiceDate: editDate });
      toast.success("Invoice updated!");
      setEditId(null);
      fetchInvoices();
    } catch {
      toast.error("Failed to update invoice.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await axios.delete(`/api/invoices/${id}`);
      toast.success("Invoice deleted!");
      fetchInvoices();
    } catch {
      toast.error("Failed to delete invoice.");
    }
  };

  const handlePrint = (id: string) => {
    window.open(`/invoice/preview/${id}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-center text-indigo-700">MODIFY CREDIT CLIENT INVOICE</h2>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-700">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="border p-2 rounded text-gray-600"
          >
            <option value="CreditClientBooking">Domestic (Credit Client)</option>
            <option value="InternationalCreditClientBooking">International (Credit Client)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">Customer</label>
          <select
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className="border p-2 rounded text-gray-600 min-w-[180px]"
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.customerCode} - {c.customerName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">From Invoice Date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-2 rounded text-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">To Invoice Date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-2 rounded text-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">Invoice No</label>
          <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="border p-2 rounded text-gray-600" />
        </div>
        <button onClick={fetchInvoices} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded" disabled={loading}>
          Search
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border mb-2">
          <thead>
            <tr className="bg-gray-100 text-xs">
              <th className="text-gray-600 px-2 py-1">Invoice No</th>
              <th className="text-gray-600 px-2 py-1">Invoice Date</th>
              <th className="text-gray-600 px-2 py-1">Amount</th>
              <th className="text-gray-600 px-2 py-1">Period From</th>
              <th className="text-gray-600 px-2 py-1">Period To</th>
              <th className="text-gray-600 px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="text-xs">
                  <td className="text-center text-gray-500 px-2 py-1">{inv.invoiceNo}</td>
                  <td className="text-center text-gray-500 px-2 py-1">
                    {editId === inv.id ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="border p-1 rounded text-gray-600"
                      />
                    ) : (
                      inv.invoiceDate?.slice(0, 10)
                    )}
                  </td>
                  <td className="text-center px-2 text-gray-500 py-1">{inv.netAmount?.toFixed(2)}</td>
                  <td className="text-center px-2 text-gray-500 py-1">{parseDateString(inv.periodFrom) || '-'}</td>
                  <td className="text-center px-2 text-gray-500 py-1">{parseDateString(inv.periodTo) || '-'}</td>
                  <td className="text-center px-2 text-gray-500 py-1 space-x-1">
                    {editId === inv.id ? (
                      <>
                        <button className="bg-green-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleEditSave(inv.id)}>Save</button>
                        <button className="bg-gray-400 text-white px-2 py-1 rounded text-xs" onClick={() => setEditId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleEdit(inv)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleDelete(inv.id)}>Delete</button>
                        <button className="bg-gray-700 text-white px-2 py-1 rounded text-xs" onClick={() => handlePrint(inv.id)}>Print</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}