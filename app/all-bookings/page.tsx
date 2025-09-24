'use client'
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { toast } from "sonner";
import { handleDownloadForAllBookings } from "@/lib/downloadExcel";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const columns = [
  "srNo", "bookingDate", "awbNo", "location", "destinationCity", "mode", "pcs", "pin",
  "dsrContents", "dsrNdxPaper", "invoiceValue", "actualWeight", "chargeWeight", "length", "width", "height",
  "valumetric", "invoiceWt", "frCharge", "fuelSurcharge", "shipperCost", "otherExp", "gst", "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
  "customerType", "senderDetail", "customerName", "childCustomer", "paymentStatus", "senderContactNo", "address", "adhaarNo",
  "customerAttendBy", "status", "statusDate", "pendingDaysNotDelivered", "receiverName",
  "receiverContactNo", "ref", "delivered", "dateOfDelivery", "todayDate"
];

const COLUMN_MAP: Record<string, string> = {
  srNo: "SR NO.",
  bookingDate: "Booking Date",
  awbNo: "Docket",
  location: "Location",
  destinationCity: "Destination",
  mode: "Mode",
  pcs: "No of Pcs",
  pin: "Pincode",
  dsrContents: "Content",
  dsrNdxPaper: "Dox / Non Dox",
  invoiceValue: "Material Value",
  actualWeight: "FR Weight",
  chargeWeight: "Charge Weight",
  valumetric: "Volumetric",
  invoiceWt: "Invoice Wt",
  frCharge: "FR Charge",
  fuelSurcharge: "Fuel Surcharge",
  shipperCost: "Shipper Cost",
  otherExp: "Other Exp",
  gst: "GST",
  clientBillingValue: "Client Billing Value",
  creditCustomerAmount: "Credit Cust. Amount",
  regularCustomerAmount: "Regular Cust. Amount",
  customerType: "Customer Type",
  senderDetail: "Sender Detail",
  customerName: "Customer Name",
  childCustomer: "Child Customer",
  paymentStatus: "Payment Status",
  senderContactNo: "Sender Contact No",
  address: "Address",
  adhaarNo: "Adhaar No",
  customerAttendBy: "Customer Attend By",
  status: "Status",
  statusDate: "Status Date",
  pendingDaysNotDelivered: "Pending Days Not Delivered",
  receiverName: "Receiver Name",
  receiverContactNo: "Receiver Contact No",
  ref: "Ref",
  delivered: "Delivered",
  dateOfDelivery: "Date of Delivery",
  todayDate: "Today Date"
};

const OPTIONS = {
  mode: ["AIR", "EXPRESS", "PREMIUM", "RAIL", "SURFACE", "OTHER MODE"],
  status: ["BOOKED", "IN-TRANSIT", "DELIVERED", "CANCELLED", "RETURNED"],
  paymentStatus: ["PAID", "UNPAID", "PARTIALLY_PAID"],
  dsrNdxPaper: ["D", "N"],
  customerType: ["CREDIT", "REGULAR", "WALK-IN"],
  delivered: ["YES", "NO"],
};

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [pincodeMaster, setPincodeMaster] = useState<any[]>([]);
  const [taxMaster, setTaxMaster] = useState<any[]>([]);
  const [companyState, setCompanyState] = useState<string>("delhi");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    customerName: "",
    bookingDate: "",
    consignStartNo: "",
    consignEndNo: "",
    consignNo: "",
    status: [] as string[],
    paymentStatus: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusFilterRef]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/booking-master/assigned");
      const withSrNo = res.data.map((b: any, idx: number) => ({ ...b, srNo: idx + 1 }));
      setBookings(withSrNo);
    } catch (error) {
      toast.error("Failed to load bookings. Please try again later.");
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pincodeRes, taxRes] = await Promise.all([
          axios.get('/api/pincode-master'),
          axios.get('/api/taxMaster')
        ]);
        setPincodeMaster(pincodeRes.data);
        setTaxMaster(taxRes.data);
      } catch (error) {
        console.error("Failed to fetch master data:", error);
      }
    };
    fetchData();
  }, []);

  const applyFilters = () => {
    let filtered = [...bookings];

    if (filters.customerName) {
      const term = filters.customerName.toLowerCase();
      filtered = filtered.filter(b =>
        (b.customer?.customerName && b.customer.customerName.toLowerCase().includes(term)) ||
        (b.receiverName && b.receiverName.toLowerCase().includes(term))
      );
    }
    if (filters.consignStartNo)
      filtered = filtered.filter(b => b.awbNo?.startsWith(filters.consignStartNo));
    if (filters.consignEndNo)
      filtered = filtered.filter(b => b.awbNo?.endsWith(filters.consignEndNo));
    if (filters.consignNo)
      filtered = filtered.filter(b => b.awbNo?.includes(filters.consignNo));
    if (filters.bookingDate)
      filtered = filtered.filter(b => b.bookingDate?.startsWith(filters.bookingDate));
    if (filters.status.length > 0) {
      filtered = filtered.filter(b => filters.status.includes(b.status));
    }
    if (filters.paymentStatus) {
      filtered = filtered.filter(b => b.paymentStatus === filters.paymentStatus);
    }
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(b => new Date(b.bookingDate) >= startDate);
    }
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => new Date(b.bookingDate) <= endDate);
    }

    setFilteredBookings(filtered);
  };

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, currentPage, pageSize]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredBookings.length / pageSize);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
    }
  }, [filteredBookings, pageSize, currentPage]);

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => {
      const newStatus = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      return { ...prev, status: newStatus };
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/booking-master/${id}`);
      toast.success("Booking deleted successfully.");
      setBookings(bookings => bookings.filter(b => b.id !== id));
    } catch (error) {
      toast.error("Failed to delete booking. Please try again later.");
      console.error("Delete booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGSTPercentage = (customerPincode: string): number => {
    if (!customerPincode) return 0;

    const pincodeData = pincodeMaster.find(p => p.pincode === customerPincode);
    const customerState = pincodeData?.state?.name || "";

    if (!customerState) return 0;

    if (customerState.toLowerCase() === companyState.toLowerCase()) {
      const sgstTax = taxMaster.find(tax => tax.taxCode === 'SGST');
      const cgstTax = taxMaster.find(tax => tax.taxCode === 'CGST');

      const sgstRate = sgstTax ? parseFloat(sgstTax.ratePercent) : 9;
      const cgstRate = cgstTax ? parseFloat(cgstTax.ratePercent) : 9;
      return sgstRate + cgstRate;
    } else {
      const igstTax = taxMaster.find(tax => tax.taxCode === 'IGST');
      return igstTax ? parseFloat(igstTax.ratePercent) : 18;
    }
  };

  const handleEdit = (row: any) => {
    const editableRow = { ...row };

    editableRow._fuelSurchargePercent = row.customer?.fuelSurchargePercent || 0;
    editableRow._gstPercent = getGSTPercentage(row.customer?.pincode || "");

    setEditingId(row.id);
    setEditForm(editableRow);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...editForm };
      delete payload.srNo;
      delete payload.id;
      delete payload.createdAt;
      delete payload.customer;
      delete payload.customerId;

      [
        'length', 'width', 'height',
        'valumetric', 'frCharge', 'fuelSurcharge',
        'shipperCost', 'otherExp', 'gst',
        'pcs', 'invoiceValue', 'actualWeight',
        'chargeWeight', 'invoiceWt', 'clientBillingValue',
        'creditCustomerAmount', 'regularCustomerAmount',
        'pendingDaysNotDelivered'
      ].forEach(field => {
        if (payload[field]) {
          payload[field] = Number(payload[field]);
        }
      });

      ['bookingDate', 'statusDate', 'dateOfDelivery', 'todayDate'].forEach(field => {
        if (payload[field]) {
          payload[field] = new Date(payload[field]);
        }
      });

      if (payload.frCharge || payload.shipperCost || payload.otherExp) {
        const recalculated = recalculateClientBilling(payload);
        payload.gst = Number(recalculated.gst);
        payload.clientBillingValue = Number(recalculated.clientBillingValue);
      }

      await axios.put(`/api/booking-master/${editForm.id}`, payload);
      toast.success("Booking updated successfully.");

      setEditingId(null);
      setEditForm({});

      fetchBookings();
    } catch (err) {
      toast.error("Error updating booking. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let updatedForm = { ...editForm, [name]: value };

    // Auto-calculate valumetric when length, width, or height changes
    if (['length', 'width', 'height'].includes(name)) {
      const l = parseFloat(updatedForm.length) || 0;
      const w = parseFloat(updatedForm.width) || 0;
      const h = parseFloat(updatedForm.height) || 0;

      if (l > 0 && w > 0 && h > 0) {
        const volumetricValue = ((l * w * h) / 5000).toFixed(2);
        updatedForm.valumetric = volumetricValue;

        const actualWeight = parseFloat(updatedForm.actualWeight) || 0;
        const volumetricWeight = parseFloat(volumetricValue);
        if (volumetricWeight > actualWeight) {
          updatedForm.chargeWeight = volumetricValue;
        } else if (actualWeight > 0) {
          updatedForm.chargeWeight = updatedForm.actualWeight;
        }
        updatedForm.invoiceWt = Math.max(actualWeight, parseFloat(updatedForm.chargeWeight) || 0).toFixed(2);
      }
    }
    if (name === "frCharge") {
      const frCharge = parseFloat(value) || 0;
      const fuelSurchargePercent = updatedForm._fuelSurchargePercent || 0;
      if (frCharge > 0 && fuelSurchargePercent > 0) {
        updatedForm.fuelSurcharge = ((frCharge * fuelSurchargePercent) / 100).toFixed(2);
      } else {
        updatedForm.fuelSurcharge = "0.00";
      }
    }

    if (["frCharge", "shipperCost", "otherExp"].includes(name)) {
      updatedForm = recalculateClientBilling(updatedForm);
    }

    setEditForm(updatedForm);
  };

  const recalculateClientBilling = (row: any) => {
    const frCharge = parseFloat(row.frCharge) || 0;
    const fuelSurcharge = parseFloat(row.fuelSurcharge) || 0;
    const shipperCost = parseFloat(row.shipperCost) || 0;
    const otherExp = parseFloat(row.otherExp) || 0;
    const gstPercent = row._gstPercent || 0;

    const subtotal = frCharge + fuelSurcharge + shipperCost + otherExp;
    const gstAmount = (subtotal * gstPercent) / 100;
    const clientBillingValue = subtotal + gstAmount;

    const updatedRow = { ...row };
    updatedRow.gst = gstAmount.toFixed(2);
    updatedRow.clientBillingValue = clientBillingValue.toFixed(2);
    return updatedRow;
  };

  return (
    <div className="max-w-8xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 drop-shadow-sm">
        All Bookings
      </h1>
      <div className="mb-8 bg-white w-full rounded-2xl py-8 px-8 shadow-md border border-blue-100">
        <div className="flex justify-center gap-x-4 mb-4">
          <div className="flex-1">
            <label htmlFor="customerName" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Customer/Receiver Name</label>
            <input
              name="customerName"
              id="customerName"
              value={filters.customerName}
              onChange={handleFilterChange}
              placeholder="Search for Customer"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition"
              autoComplete="off"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="consignNo" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Consignment No</label>
            <input
              name="consignNo"
              id="consignNo"
              value={filters.consignNo}
              onChange={handleFilterChange}
              placeholder="Contains…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition"
            />
          </div>
          <div className="relative" ref={statusFilterRef}>
            <label htmlFor="status" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Status</label>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-full px-3 py-2 text-left rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition flex justify-between items-center"
            >
              <span className="truncate cursor-pointer">
                {filters.status.length > 0 ? filters.status.join(', ') : 'Select Statuses'}
              </span>
              <span className="ml-2">▼</span>
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200">
                <ul>
                  {['BOOKED', 'IN-TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'].map(status => (
                    <li key={status} className="px-3 py-2 hover:bg-blue-50 text-gray-700">
                      <label className="flex items-center cursor-pointer w-full">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => handleStatusChange(status)}
                          className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        {status}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="paymentStatus" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Payment Status</label>
            <select name="paymentStatus" id="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange} className="w-full px-3 py-2 cursor-pointer rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition">
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
            </select>
          </div>
          <div className="flex justify-end ml-12">
            <button
              onClick={() => {
                toast('Downloading Excel...');
                handleDownloadForAllBookings(filteredBookings);
              }}
              className="px-5 py-2 cursor-pointer bg-blue-700 text-white rounded-md shadow-md hover:bg-blue-800 transition"
              disabled={loading}
            >
              Download Excel
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-x-4 mb-2">
          <div>
            <label htmlFor="startDate" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Start Date</label>
            <input name="startDate" id="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition" />
          </div>
          <div>
            <label htmlFor="endDate" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">End Date</label>
            <input name="endDate" id="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition" />
          </div>
          <div className="flex-1">
            <label htmlFor="consignStartNo" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Consignment Start No</label>
            <input
              name="consignStartNo"
              id="consignStartNo"
              value={filters.consignStartNo}
              onChange={handleFilterChange}
              placeholder="Start No"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="consignEndNo" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Consignment End No</label>
            <input
              name="consignEndNo"
              id="consignEndNo"
              value={filters.consignEndNo}
              onChange={handleFilterChange}
              placeholder="End No"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="bookingDate" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Booking Date</label>
            <input
              name="bookingDate"
              id="bookingDate"
              type="date"
              value={filters.bookingDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 font-medium bg-blue-50 text-gray-800 transition"
              placeholder="Booking Date"
            />
          </div>
        </div>
      </div>

      {loading && <div className="p-6 flex justify-center text-center font-medium text-blue-700"><div className="loader"></div></div>}
      {!loading && (
        <div className="overflow-x-auto bg-white rounded-xl shadow border max-h-[70vh] overflow-y-auto">
          <table className="min-w-full text-xs md:text-sm table-auto">
            <thead className="bg-blue-50 sticky top-0 z-10">
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    className="px-3 py-3 border-b font-semibold text-blue-900 whitespace-nowrap"
                  >
                    {COLUMN_MAP[col] || col}
                  </th>
                ))}
                <th className="px-3 py-3 border-b font-semibold text-blue-900">Edit</th>
                <th className="px-3 py-3 border-b font-semibold text-blue-900">Delete</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((row, idx) => (
                <tr key={row.id || idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  {columns.map(col => {
                    if (col === "receiverName") {
                      return (
                        <td
                          key={col}
                          className="px-3 py-2 border-b font-semibold whitespace-nowrap text-gray-700"
                        >
                          {row.receiverName || ""}
                        </td>
                      );
                    }
                    if (col === "customerName") {
                      return (
                        <td key={col} className="px-3 py-2 border-b text-gray-700 whitespace-nowrap">
                          {row.customer?.customerName || ""}
                        </td>
                      );
                    }
                    const isDateField = ["bookingDate", "statusDate", "createdAt", "dateOfDelivery", "todayDate"].includes(col);
                    const isSelectField = ["mode", "status", "paymentStatus", "dsrNdxPaper", "customerType", "delivered"].includes(col);

                    return editingId === row.id ? (
                      <td key={col} className="px-3 py-2 border-b w-[120px] whitespace-nowrap">
                        {isSelectField ? (
                          <select
                            name={col}
                            value={editForm[col] ?? ""}
                            onChange={(e) => handleInputChange(e as any)}
                            className="w-full h-full px-2 py-1 border border-gray-300 rounded-sm bg-white text-gray-700 text-xs md:text-sm cursor-pointer"
                          >
                            <option value="">Select</option>
                            {OPTIONS[col as keyof typeof OPTIONS].map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            name={col}
                            type={isDateField ? 'date' : 'text'}
                            value={isDateField ? (editForm[col] ? new Date(editForm[col]).toISOString().split('T')[0] : '') : (editForm[col] ?? "")}
                            onChange={handleInputChange}
                            className="w-full h-full px-2 py-1 border border-gray-200 rounded-sm bg-white text-gray-700 text-xs md:text-sm"
                            readOnly={["srNo", "id", "valumetric", "gst", "fuelSurcharge", "clientBillingValue", "customerName", "childCustomer"].includes(col)}
                          />
                        )}
                      </td>
                    ) : (
                      <td key={col} className="px-3 py-2 border-b text-gray-700 whitespace-nowrap">
                        {col === 'childCustomer'
                          ? row.customer?.childCustomer || row.customer?.customerName
                          : isDateField ? parseDateString(row[col]) : row[col]}
                      </td>
                    )
                  })}
                  {editingId === row.id ? (
                    <>
                      <td className="px-3 py-1 gap-y-0.5 border-b text-center">
                        <button
                          className="bg-green-600 mb-1 cursor-pointer text-white rounded px-3 py-0.5 hover:bg-green-700 font-medium text-xs md:text-sm mx-1"
                          onClick={handleSave}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="bg-gray-200 text-gray-700 cursor-pointer rounded px-3 py-0.5 hover:bg-gray-300 font-medium text-xs md:text-sm mx-1"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      </td>
                      <td className="px-3 py-2 border-b text-center">{/* blank */}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 border-b text-center">
                        <button
                          className="text-blue-600 hover:underline cursor-pointer font-medium"
                          onClick={() => handleEdit(row)}
                        >
                          ✏️
                        </button>
                      </td>
                      <td className="px-3 py-2 border-b text-center">
                        <button
                          className="text-red-600 hover:underline cursor-pointer font-medium"
                          onClick={() => handleDelete(row.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}{!loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({filteredBookings.length} total records)
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-1 rounded cursor-pointer border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded cursor-pointer border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(Number(e.target.value))}
              className="w-12 p-1 text-gray-400 text-center border rounded text-sm"
              min="1"
              max={totalPages}
            />
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded cursor-pointer border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-1 rounded cursor-pointer border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
          <div>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="text-sm border border-gray-300 text-blue-600 cursor-pointer rounded p-1">
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="200">200 / page</option>
              <option value="500">500 / page</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}