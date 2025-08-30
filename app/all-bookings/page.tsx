'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { toast } from "sonner";
import { handleDownload } from "@/lib/downloadExcel";

const columns = [
  "srNo", "bookingDate", "awbNo", "location", "destinationCity", "mode", "pcs", "pin",
  "dsrContents", "dsrNdxPaper", "invoiceValue", "actualWeight", "chargeWeight",
  "valumetric", "invoiceWt", "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
  "customerType", "senderDetail", "paymentStatus", "senderContactNo", "address", "adhaarNo",
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
  clientBillingValue: "Client Billing Value",
  creditCustomerAmount: "Credit Cust. Amount",
  regularCustomerAmount: "Regular Cust. Amount",
  customerType: "Customer Type",
  senderDetail: "Sender Detail",
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

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [filters, setFilters] = useState({
    customerName: "",
    bookingDate: "",
    consignStartNo: "",
    consignEndNo: "",
    consignNo: "",
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/booking-master");
      const withSrNo = res.data.map((b: any, idx: number) => ({ ...b, srNo: idx + 1 }));
      setBookings(withSrNo);
    } catch (error) {
      toast.error("Failed to load bookings. Please try again later.");
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

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

    setFilteredBookings(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm({ ...row });
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
      await axios.put(`/api/booking-master/${editForm.id}`, payload);
      toast.success("Booking updated successfully.")
      setEditingId(null)
      setEditForm({})
      fetchBookings()
    } catch (err) {
      toast.error("Error updating booking. Please try again.")
      console.error(err)
    } finally {
      setSaving(false)
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 drop-shadow-sm">
        All Bookings
      </h1>
      <div className="mb-8 bg-white rounded-2xl shadow-md px-6 py-6 flex flex-col md:flex-row md:items-end gap-6 border border-blue-100">
        <div className="flex-1">
          <label htmlFor="customerName" className="block mb-1 text-[15px] text-blue-900 font-semibold tracking-wide">Customer Name</label>
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
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              toast('Downloading Excel...');
              handleDownload();
            }}
            className="px-5 py-2 cursor-pointer bg-blue-700 text-white rounded-md shadow-md hover:bg-blue-800 transition"
            disabled={loading}
          >
            Download Excel
          </button>
        </div>
      </div>

      {loading && <div className="p-6 flex justify-center text-center font-medium text-blue-700"><div className="loader"></div></div>}
      {!loading && (
        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="min-w-full text-xs md:text-sm table-auto">
            <thead className="bg-blue-50">
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
              {filteredBookings.map((row, idx) => (
                <tr key={row.id || idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  {columns.map(col => {
                    if (col === "receiverName") {
                      return (
                        <td
                          key={col}
                          className="px-3 py-2 border-b font-semibold whitespace-nowrap text-gray-700"
                          title={`${row.customer?.customerName || ""} (${row.customer?.customerCode || ""}) - ${row.receiverName || ""}`}
                        >
                          {row.customer?.customerName && row.customer?.customerCode
                            ? `${row.customer.customerName} (${row.customer.customerCode}) - ${row.receiverName || ""}`
                            : row.receiverName}
                        </td>
                      );
                    }
                    const isDateField = ["bookingDate", "statusDate", "createdAt", "dateOfDelivery", "todayDate"].includes(col);
                    return editingId === row.id ? (
                      <td key={col} className="px-3 py-2 border-b w-[120px] whitespace-nowrap">
                        <input
                          name={col}
                          value={editForm[col] ?? ""}
                          onChange={handleInputChange}
                          className="w-full h-full px-2 py-1 border border-gray-200 rounded-sm bg-white text-gray-700 text-xs md:text-sm"
                          readOnly={col === "srNo" || col === "id"}
                        />
                      </td>
                    ) : (
                      <td key={col} className="px-3 py-2 border-b text-gray-700 whitespace-nowrap">
                        {isDateField ? parseDateString(row[col]) : row[col]}
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
      )}
    </div>
  );
}