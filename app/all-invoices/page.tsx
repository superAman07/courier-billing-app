'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

function AllInvoicesContent() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  // Company state for smart preview
  const [companies, setCompanies] = useState<any[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Fetch master data (customers, companies)
  useEffect(() => {
    axios.get('/api/customers').then((res) => setCustomers(res.data));
    axios.get('/api/registration-details').then((res) => {
      setCompanies(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
      };
      if (search) params.invoiceNo = search;
      if (customerId) params.customerId = customerId;
      if (type) params.type = type;

      const { data } = await axios.get('/api/invoices', { params });
      setInvoices(data.data);
      setTotalPages(Math.ceil(data.meta.total / data.meta.limit));
      setTotalRecords(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch invoices', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, customerId, type]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchInvoices]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to DELETE this invoice? Bookings will be reset to BOOKED status.'
      )
    )
      return;

    try {
      await axios.delete(`/api/invoices/${id}`);
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete invoice');
    }
  };

  // Smart Preview Logic (Reusable)
  const handleViewInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;

    let matchedCompanyId: string | null = null;

    if (companies.length > 1) {
      const invNo = String(inv.invoiceNo).toUpperCase();

      if (invNo.startsWith('HVS') || invNo.startsWith('HNVS')) {
        const hvsComp = companies.find((c: any) =>
          String(c.companyName).toLowerCase().includes('hvs')
        );
        if (hvsComp) matchedCompanyId = hvsComp.id;
      } else if (invNo.startsWith('AGS') || invNo.startsWith('ANGS')) {
        const agsComp = companies.find((c: any) => {
          const name = String(c.companyName).toLowerCase();
          return name.includes('awdhoot') || name.includes('awadhoot');
        });
        if (agsComp) matchedCompanyId = agsComp.id;
      }
    }

    if (matchedCompanyId) {
      window.open(`/invoice/preview/${id}?companyId=${matchedCompanyId}`, '_blank');
    } else if (companies.length > 1) {
      setSelectedInvoiceId(id);
      setIsCompanyModalOpen(true);
    } else {
      window.open(`/invoice/preview/${id}`, '_blank');
    }
  };

  const openInvoiceWithCompany = (companyId: string) => {
    if (selectedInvoiceId) {
      window.open(`/invoice/preview/${selectedInvoiceId}?companyId=${companyId}`, '_blank');
      setIsCompanyModalOpen(false);
      setSelectedInvoiceId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all generated invoices</p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Total Records: {totalRecords}
        </div>
      </div>

      {/* Smart Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-gray-800">Select Letterhead</h3>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {companies.map((comp: any) => (
                <button
                  key={comp.id}
                  onClick={() => openInvoiceWithCompany(comp.id)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="font-semibold text-gray-800 group-hover:text-blue-700">
                    {comp.companyName}
                  </div>
                  <div className="text-xs text-gray-500">GST: {comp.gstNo}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white text-gray-500 rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Invoice No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full rounded-lg border-gray-200 border p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border-gray-200 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="BookingMaster_CASH">Cash(Domestic)</option>
            <option value="BookingMaster_CREDIT">Credit(Domestic)</option>
            <option value="InternationalCreditClientBooking">International</option>
          </select>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border-gray-200 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Customers</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.customerCode} - {c.customerName}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearch('');
                setType('');
                setCustomerId('');
                setPage(1);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customer ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.customer.customerName}</span>
                          <span className="text-xs text-gray-500">{invoice.customer.customerCode}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Walk-in / Cash</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.type?.includes('CASH') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {invoice.type?.replace('BookingMaster_', '')}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ₹{invoice.netAmount?.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View/Print"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AllInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">
          Loading...
        </div>
      }
    >
      <AllInvoicesContent />
    </Suspense>
  );
}
