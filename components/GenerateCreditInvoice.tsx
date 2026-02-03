'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function GenerateCreditInvoice() {
  const [type, setType] = useState<'Domestic' | 'International'>('Domestic');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/customers/pending-invoice', {
        params: { type } // Pass 'Domestic' or 'International'
    }).then(res => {
      setCustomers(res.data);
      setLoading(false);
    }).catch(err => {
        console.error("Failed to load pending customers", err);
        setLoading(false);
    });

    axios.get('/api/registration-details').then(res => {
        setCompanies(Array.isArray(res.data) ? res.data : [res.data]);
    });

    setCustomerId('');
    setCustomerSearch('');
    setBookings([]);
    setSelected([]);
  }, [type]);

  const fetchBookings = async () => {
    if (!customerId || !fromDate || !toDate) {
      toast.error('Select customer and date range');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get('/api/booking-master/for-invoice', {
        params: {
          customerId,
          fromDate,
          toDate,
          customerType: 'CREDIT',
          status: 'BOOKED,DELIVERED',
          type
        }
      });
      setBookings(data);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    try {
      const { data } = await axios.get('/api/invoices', {
        params: {
          type: 'BookingMaster_CREDIT',
          customerId
        }
      });
      setInvoices(Array.isArray(data) ? data : data.data);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchInvoices();
  }, [type, customerId]);

  const handleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  const handleSelectAll = () => {
    if (selected.length === bookings.length) setSelected([]);
    else setSelected(bookings.map((b: any) => b.id));
  };

  const submitInvoiceGeneration = async (selectedCompanyId?: string) => {
    setLoading(true);
    try {
      await axios.post('/api/invoices', {
        bookingIds: selected,
        customerId,
        invoiceDate,
        customerType: 'CREDIT',
        companyId: selectedCompanyId
      });
      toast.success('Invoice generated!');
      setBookings([]);
      setSelected([]);
      fetchInvoices();
      setIsCompanyModalOpen(false);
    } catch (error: any) {
      const backendMsg = error?.response?.data?.message;
      if (backendMsg) {
        toast.error(backendMsg);
      } else {
        toast.error(error.message || "Failed to generate invoice");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceDate || selected.length === 0 || !customerId) {
      toast.error('Select invoice date, customer, and at least one consignment');
      return;
    }
    if (companies.length > 1) {
        setSelectedInvoiceId('GENERATING_NEW');
        setIsCompanyModalOpen(true);
    } else {
        submitInvoiceGeneration(companies[0]?.id);
    }
  };

  const handleViewInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    let matchedCompanyId = null;

    if (companies.length > 1) {
        const invNo = inv.invoiceNo.toUpperCase();

        if (invNo.startsWith('HVS') || invNo.startsWith('HNVS')) {
            const hvsComp = companies.find((c: any) => c.companyName.toLowerCase().includes('hvs'));
            if (hvsComp) matchedCompanyId = hvsComp.id;
        } 
        else if (invNo.startsWith('AGS') || invNo.startsWith('ANGS')) {
            const agsComp = companies.find((c: any) => 
                c.companyName.toLowerCase().includes('awdhoot') || 
                c.companyName.toLowerCase().includes('awadhoot')
            );
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
      if (selectedInvoiceId === 'GENERATING_NEW') {
          submitInvoiceGeneration(companyId);
      } else if (selectedInvoiceId) {
          window.open(`/invoice/preview/${selectedInvoiceId}?companyId=${companyId}`, '_blank');
          setIsCompanyModalOpen(false);
          setSelectedInvoiceId(null);
      }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-center bg-indigo-700 text-white py-2 rounded">GENERATE CREDIT CLIENT INVOICE</h2>
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl relative">
                <button 
                    onClick={() => setIsCompanyModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold mb-4 text-gray-800">Select Billing Entity</h3>
                <p className="text-sm text-gray-600 mb-4">Choose which company letterhead to use for this invoice.</p>
                <div className="space-y-3">
                    {companies.map((comp: any) => (
                        <button
                            key={comp.id}
                            onClick={() => openInvoiceWithCompany(comp.id)}
                            className="w-full text-left px-4 py-3 cursor-pointer border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors flex flex-col group"
                        >
                            <span className="font-semibold text-blue-900 group-hover:text-blue-700">{comp.companyName}</span>
                            <span className="text-xs text-gray-500 mt-1">GST: {comp.gstNo}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-700">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'Domestic' | 'International')}
            className="border p-2 rounded text-gray-600"
          >
            <option value="Domestic">Domestic (Credit Client)</option>
            <option value="International">International (Credit Client)</option>
          </select>
        </div>
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-700">Customer</label>
          <div className="relative">
            <input
              type="text"
              className="border p-2 rounded text-gray-600 min-w-[200px] w-full"
              placeholder="Search Customer..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setIsDropdownOpen(true);
                setCustomerId(''); // Clear selection on type
              }}
              onFocus={() => setIsDropdownOpen(true)}
              // Optional: Close on blur with delay to allow click
               onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            />
            
            {/* Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {customers
                  .filter(c => 
                    c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) || 
                    (c.customerCode && c.customerCode.toLowerCase().includes(customerSearch.toLowerCase()))
                  )
                  .map(c => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b last:border-b-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCustomerId(c.id);
                        setCustomerSearch(`${c.customerCode} - ${c.customerName}`);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="font-bold">{c.customerCode}</span> - {c.customerName}
                    </div>
                  ))
                }
                {customers.length > 0 && customers.filter(c => 
                    c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) || 
                    (c.customerCode && c.customerCode.toLowerCase().includes(customerSearch.toLowerCase()))
                  ).length === 0 && (
                    <div className="p-2 text-gray-500 text-sm">No customers found</div>
                  )
                }
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">Invoice Date</label>
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="border p-2 rounded text-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">From Booking Date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-2 rounded text-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700">To Booking Date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-2 rounded text-gray-600" />
        </div>
        <button onClick={fetchBookings} className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded" disabled={loading || !customerId || !fromDate || !toDate}>
          Show Consignments
        </button>
      </div>
      <table className="w-full border mb-2">
        <thead>
          <tr className="bg-gray-100 text-xs">
            <th><input type="checkbox" className='cursor-pointer' checked={selected.length === bookings.length && bookings.length > 0} onChange={handleSelectAll} /></th>
            <th className='text-gray-600'>Booking Date</th>
            <th className='text-gray-600'>Consignment No</th>
            <th className='text-gray-600'>Customer</th>
            <th className='text-gray-600'>Consignee</th>
            <th className='text-gray-600'>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-400">
                No consignments found for the selected customer and date range.
              </td>
            </tr>
          ) : (
            bookings.map((b: any) => { 
              const clientBillingValue = Number(b.clientBillingValue || 0);
              const creditAmount = Number(b.creditCustomerAmount || 0);
              const regularAmount = Number(b.regularCustomerAmount || 0);
              const totalAmount = clientBillingValue + creditAmount + regularAmount;

              return (
                <tr key={b.id} className="text-xs">
                  <td className='text-center'>
                    <input
                      type="checkbox"
                      className='cursor-pointer'
                      checked={selected.includes(b.id)}
                      onChange={() => handleSelect(b.id)}
                    />
                  </td>
                  <td className='text-gray-600 text-center'>{b.bookingDate?.slice(0, 10)}</td>
                  <td className='text-gray-600 text-center'>{b.awbNo}</td>
                  <td className='text-gray-600 text-center'>{b.customer?.customerCode || ''} - {b.customer?.customerName || ''}</td>
                  <td className='text-gray-600 text-center'>{b.receiverName}</td>
                  <td className='text-gray-600 text-center'>₹{totalAmount.toFixed(2)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-2">
        <label className="flex text-gray-600 items-center gap-2 text-xs">
          <input type="checkbox" checked={selected.length === bookings.length && bookings.length > 0} onChange={handleSelectAll} />
          Select All
        </label>
        <button onClick={handleGenerateInvoice} className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer text-white rounded" disabled={loading || selected.length === 0 || !invoiceDate || !customerId}>
          Generate Invoice
        </button>
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-bold mb-2 text-blue-900">Generated Credit Client Invoices</h3>
        <div className="mb-2 text-xs text-blue-700 italic">
          <b>Note:</b> Only consignments with status <span className="font-semibold text-green-700">"BOOKED"</span> will be displayed here for invoice generation.<br />
          If your consignment is missing, please update its status to <span className="font-semibold text-green-700">"BOOKED"</span> from the <span className="underline cursor-pointer" onClick={() => window.open('/update-and-send-delivery-status', '_blank')}>Update and Send Delivery Status</span> page.
        </div>
        <table className="w-full border mb-2">
          <thead>
            <tr className="bg-gray-100 text-xs">
              <th className='text-gray-600'>Invoice No</th>
              <th className='text-gray-600'>Invoice Date</th>
              <th className='text-gray-600'>Total Amount</th>
              <th className='text-gray-600'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoiceLoading ? (
              <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-gray-400">No invoices found.</td></tr>
            ) : (
              invoices.map((inv: any) => (
                <tr key={inv.id} className="text-xs">
                  <td className='text-gray-600 text-center'>{inv.invoiceNo}</td>
                  <td className='text-gray-600 text-center'>{inv.invoiceDate?.slice(0, 10)}</td>
                  <td className='text-gray-600 text-center'>{inv.netAmount}</td>
                  <td className='text-center'>
                    <button
                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 cursor-pointer text-white rounded text-xs"
                      onClick={() => handleViewInvoice(inv.id)}
                    >
                      View
                    </button>
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