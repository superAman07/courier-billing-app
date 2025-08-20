'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";

const columns = [
  "srNo", "bookingDate", "awbNo", "destinationCity", "mode", "pcs", "pin", "dsrContents", "dsrNdxPaper", "invoiceValue",
  "actualWeight", "chargeWeight", "invoiceWt", "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
  "childCustomer", "parentCustomer", "paymentStatus", "senderContactNo", "address", "adhaarNo", "customerAttendBy",
  "status", "statusDate", "pendingDaysNotDelivered", "receiverName", "receiverContactNo", "complainNo",
  "shipmentCostOtherMode", "podStatus", "remarks", "countryName", "domesticInternational", "internationalMode", "createdAt"
];

const COLUMN_MAP: Record<string, string> = {
  srNo: "SR NO.",
  bookingDate: "Booking Date",
  awbNo: "AwbNo",
  destinationCity: "Destination City",
  mode: "Mode",
  pcs: "PCS",
  pin: "Pin Code",
  dsrContents: "DSR_CONTENTS",
  dsrNdxPaper: "DSR_NDX_PAPER",
  invoiceValue: "Invoice Value",
  actualWeight: "Actual Weight",
  chargeWeight: "Charge Weight",
  invoiceWt: "Invoice Wt",
  clientBillingValue: "Client Billing Value",
  creditCustomerAmount: "Credit Customer Amount",
  regularCustomerAmount: "Regular Customer Amount",
  childCustomer: "Child Customer",
  parentCustomer: "Parent Customer",
  paymentStatus: "Payment Status",
  senderContactNo: "Sender Contact No",
  address: "Address",
  adhaarNo: "Adhaar No",
  customerAttendBy: "Customer Attend By",
  status: "Status",
  statusDate: "Status Date",
  pendingDaysNotDelivered: "Pending Days of Not Delivered",
  receiverName: "Receiver Name",
  receiverContactNo: "Receiver Contact No",
  complainNo: "Complain No.",
  shipmentCostOtherMode: "Shipment Cost by other Mode",
  podStatus: "POD Status",
  remarks: "Remarks",
  countryName: "Country Name",
  domesticInternational: "Domestic / International",
  internationalMode: "International Mode",
  createdAt: "Created At"
};

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({}); // Stores the current values for edit

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await axios.get("/api/booking-master");
    const withSrNo = res.data.map((b: any, idx: number) => ({ ...b, srNo: idx + 1 }));
    setBookings(withSrNo);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    await axios.delete(`/api/booking-master/${id}`);
    setBookings(bookings => bookings.filter(b => b.id !== id));
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
    const payload = { ...editForm };
    delete payload.srNo;
    delete payload.id;
    delete payload.createdAt;
    delete payload.customer;
    delete payload.customerId;
    await axios.put(`/api/booking-master/${editForm.id}`, payload);
    setEditingId(null);
    setEditForm({});
    fetchBookings();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">All Bookings</h1>
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
            {bookings.map((row, idx) => (
              <tr key={row.id || idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                {columns.map(col => {
                  const isDateField = ["bookingDate", "statusDate", "createdAt"].includes(col);
                  return (
                    editingId === row.id ? (
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
                  );
                })} 
                {editingId === row.id ? (
                  <>
                    <td className="px-3 py-1 gap-y-0.5 border-b text-center">
                      <button
                        className="bg-green-600 mb-1 cursor-pointer text-white rounded px-3 py-0.5 hover:bg-green-700 font-medium text-xs md:text-sm mx-1"
                        onClick={handleSave}
                      >
                        Save
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
    </div>
  );
}
