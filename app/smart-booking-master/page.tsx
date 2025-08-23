'use client'

import { useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";
import { Download } from "lucide-react";

const columns = [
    "srNo", "bookingDate", "awbNo", "destinationCity", "mode", "pcs", "pin", "dsrContents", "dsrNdxPaper", "invoiceValue",
    "actualWeight", "chargeWeight", "invoiceWt", "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
    "childCustomer", "parentCustomer", "paymentStatus", "senderContactNo", "address", "adhaarNo", "customerAttendBy",
    "status", "statusDate", "pendingDaysNotDelivered", "receiverName", "receiverContactNo", "complainNo",
    "shipmentCostOtherMode", "podStatus", "remarks", "countryName", "domesticInternational", "internationalMode"
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
    internationalMode: "International Mode"
};

export default function SmartBookingMasterPage() {
    const [importedRows, setImportedRows] = useState<any[]>([]);
    const [tableRows, setTableRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const handleImport = async (rows: any[]) => {
        setLoading(true);
        let customers: any[] = [];
        try {
            const { data } = await axios.get("/api/customers");
            customers = data;
        } catch {
            toast.error("Failed to fetch customers for auto-fill");
        }
        const customerMap = Object.fromEntries(customers.map((c: any) => [c.customerCode, c]));

        let allBookings: any[] = [];
        try {
            const { data } = await axios.get("/api/booking-master");
            allBookings = data;
        } catch {
            toast.error("Failed to fetch bookings for AWB check");
        }
        const awbMap = Object.fromEntries(allBookings.map((b: any) => [String(b.awbNo), b]));

        const mappedRows = rows.map((row, idx) => {
            const mapped: any = {};
            columns.forEach(col => {
                const excelKey = Object.keys(row).find(
                    k =>
                        k.replace(/[\s_]/g, '').toLowerCase() === col.replace(/[\s_]/g, '').toLowerCase() ||
                        k.replace(/[\s_]/g, '').toLowerCase() === (COLUMN_MAP[col] || '').replace(/[\s_]/g, '').toLowerCase()
                );
                if (col === "bookingDate" && excelKey) {
                    mapped[col] = parseDateString(row[excelKey]);
                } else {
                    mapped[col] = excelKey ? row[excelKey] : "";
                }
            });

            mapped.srNo = idx + 1;

            const awbNo = mapped.awbNo?.toString();
            let awbExists = false;
            let bookingId = null;
            if (awbNo && awbMap[awbNo]) {
                awbExists = true;
                bookingId = awbMap[awbNo].id;
                Object.assign(mapped, awbMap[awbNo], { awbNo, srNo: mapped.srNo });
            }

            // --- Customer auto-fill ---
            const excelCustomerCode = row["Customer Code"] || row["CustomerCode"];
            const cust = excelCustomerCode && customerMap[excelCustomerCode];

            if (cust) {
                mapped.customerId = cust.id;
                mapped.receiverName = cust.customerName;
                mapped.receiverContactNo = cust.mobile;
                mapped.city = cust.city;
                mapped.pincode = cust.pincode;
            }
            let customerExists = !!cust;

            return {
                ...mapped,
                _awbExists: awbExists,
                _bookingId: bookingId,
                _customerExists: customerExists,
                _rowStatus: !customerExists ? "missing-customer" : "new"
            };
        });

        setImportedRows(mappedRows);
        setTableRows(mappedRows);
        setLoading(false);
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        setTableRows(rows =>
            rows.map((row, i) => i === idx ? { ...row, [field]: value } : row)
        );
    };
    const handleSave = async (idx: number) => {
        const row = tableRows[idx];
        if (!row._customerExists) {
            toast.error("Customer not found. Please create Customer Master first.");
            return;
        }
        const cleanRow = { ...row };
        delete cleanRow._customerExists;
        delete cleanRow._rowStatus;

        cleanRow.bookingDate = parseDateString(cleanRow.bookingDate);
        cleanRow.statusDate = parseDateString(cleanRow.statusDate);
        cleanRow.invoiceWt = Number(cleanRow.invoiceWt) || null;
        cleanRow.clientBillingValue = Number(cleanRow.clientBillingValue) || null;
        cleanRow.creditCustomerAmount = Number(cleanRow.creditCustomerAmount) || null;
        cleanRow.regularCustomerAmount = Number(cleanRow.regularCustomerAmount) || null;
        cleanRow.pendingDaysNotDelivered = Number(cleanRow.pendingDaysNotDelivered) || null;
        cleanRow.shipmentCostOtherMode = Number(cleanRow.shipmentCostOtherMode) || null;
        try {
            if (row._awbExists && row._bookingId) {
                await axios.put(`/api/booking-master/${row._bookingId}`, cleanRow);
                toast.success("Booking updated!");
            } else {
                await axios.post("/api/booking-master", cleanRow);
                toast.success("Booking created!");
            }
        } catch {
            toast.error("Failed to save booking.");
        }
    };

    const filteredRows = tableRows
        .map((row, origIndex) => ({ ...row, __origIndex: origIndex })) // keep original index
        .filter(row => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                (row.awbNo || "").toString().toLowerCase().includes(s) ||
                (row.receiverName || "").toLowerCase().includes(s) ||
                (row.destinationCity || "").toLowerCase().includes(s) ||
                (row.status || "").toLowerCase().includes(s) ||
                (row.paymentStatus || "").toLowerCase().includes(s) ||
                (row.city || "").toLowerCase().includes(s) ||
                (row.customerName || "").toLowerCase().includes(s)
                // Add more fields as needed
            );
        });

    const PAYMENT_STATUS_OPTIONS = ["PAID", "UNPAID", "PARTIAL"];
    const MODE_OPTIONS = ["A", "S", "R", "T"];
    const POD_STATUS_OPTIONS = ["Received", "Pending", "Not Required"];
    const STATUS_OPTIONS = ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "RETURNED"];

    return (
        <div className="max-w-7xl mx-auto p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Smart Booking Master</h1>
                    <p className="text-lg font-semibold text-purple-900">Bulk Import & Edit Bookings</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow font-semibold transition"
                >
                    <Download className="w-5 h-5" />
                    Download Excel
                </button>
            </div>
            <BookingImportPanel onData={handleImport} />
            {tableRows.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-4 items-center">
                    <div className="relative w-80">
                        <input
                            type="text"
                            id="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="peer p-2 pt-5 rounded text-gray-600 border border-gray-300 text-xs w-full focus:border-purple-500 focus:outline-none"
                            placeholder=" "
                        />
                        <label
                            htmlFor="search"
                            className="absolute left-2 top-3.5 text-gray-400 text-xs transition-all duration-200 peer-focus:-translate-y-5.5 peer-focus:text-purple-600 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:-translate-y-5.5 peer-[&:not(:placeholder-shown)]:text-purple-600 peer-[&:not(:placeholder-shown)]:text-xs peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-xs pointer-events-none bg-transparent px-1"
                            style={{ background: '#ededed' }}
                        >
                            Search by AWB, Receiver, City, Status, etc.
                        </label>
                    </div>
                    <button
                        className="px-3 py-2.5 rounded bg-purple-700 hover:bg-purple-600 duration-200 cursor-pointer text-[14px]"
                        onClick={() => setSearch("")}
                    >
                        Clear
                    </button>
                </div>
            )}
            {loading && (
                <div className="flex items-center gap-2 text-blue-600 my-4">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Processing import... Please wait.</span>
                </div>
            )}
            {filteredRows.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                    <div className="max-h-[500px] overflow-auto border rounded-lg">
                        <table className="min-w-full border rounded-lg">
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} className="px-3 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                                            {COLUMN_MAP[col] || col}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">Status</th>
                                    <th className="px-3 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row) => {
                                    const idx = row.__origIndex;
                                    return (
                                        <tr
                                            key={row.awbNo ?? idx}
                                            className={
                                                !row._customerExists ? "bg-red-50" :
                                                    row._awbExists ? "bg-yellow-50" : ""
                                            }
                                        >
                                            {columns.map(col => (
                                                <td
                                                    key={col}
                                                    className={
                                                        "px-1 py-2 border-b " +
                                                        (col === "bookingDate" ? "w-32" :
                                                            col === "awbNo" ? "w-40" :
                                                                col === "dsrNdxPaper" ? "w-16" : "w-28")
                                                    }
                                                >
                                                    {col === "paymentStatus" ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(idx, col, e.target.value)}
                                                            className="w-28 p-1 border cursor-pointer text-gray-600 rounded text-xs"
                                                        >
                                                            <option value="">Select</option>
                                                            {PAYMENT_STATUS_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : col === "mode" ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(idx, col, e.target.value)}
                                                            className="w-24 p-1 cursor-pointer border text-gray-600 rounded text-xs"
                                                        >
                                                            <option value="">Select</option>
                                                            {MODE_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : col === "podStatus" ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(idx, col, e.target.value)}
                                                            className="w-28 p-1 border cursor-pointer text-gray-600 rounded text-xs"
                                                        >
                                                            <option value="">Select</option>
                                                            {POD_STATUS_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : col === "status" ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(idx, col, e.target.value)}
                                                            className="w-32 p-1 border cursor-pointer text-gray-600 rounded text-xs"
                                                        >
                                                            <option value="">Select</option>
                                                            {STATUS_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
                                                            ))}
                                                        </select>
                                                    ) : ["bookingDate", "statusDate", "createdAt"].includes(col) ? (
                                                        <input
                                                            type="date"
                                                            value={
                                                                row[col]
                                                                    ? (() => {
                                                                        const d = new Date(row[col]);
                                                                        if (!isNaN(d.getTime())) {
                                                                            return d.toISOString().slice(0, 10);
                                                                        }
                                                                        const parts = row[col].split(/[\/\-]/);
                                                                        if (parts.length === 3) {
                                                                            const [dd, mm, yyyy] = parts;
                                                                            return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
                                                                        }
                                                                        return "";
                                                                    })()
                                                                    : ""
                                                            }
                                                            onChange={e => handleEdit(idx, col, e.target.value)}
                                                            className="w-28 p-1 border text-gray-600 rounded text-xs"
                                                        />
                                                    ) : (
                                                        <input
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(idx, col, e.target.value)}
                                                            className={
                                                                (col === "awbNo" ? "w-36 " : "") +
                                                                (col === "dsrNdxPaper" ? "w-12 text-center " : "") + (col === "srNo" ? "w-12 text-center " : "") +
                                                                "p-1 border text-gray-600 rounded text-xs"
                                                            }
                                                            disabled={col === "awbNo" && row._awbExists}
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 border-b text-xs">
                                                {!row._customerExists ? (
                                                    <span className="text-red-600 font-semibold">Missing Customer</span>
                                                ) : row._awbExists ? (
                                                    <span className="text-yellow-600 font-semibold">Duplicate AWB (Update)</span>
                                                ) : (
                                                    <span className="text-green-600 font-semibold">New</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-b">
                                                <button
                                                    className="bg-blue-600 text-white cursor-pointer px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
                                                    onClick={() => handleSave(idx)}
                                                    disabled={!row._customerExists}
                                                >
                                                    Save
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="text-xs text-gray-500 mt-2">
                            <span className="mr-4"><span className="inline-block w-3 h-3 bg-green-200 mr-1"></span>New</span>
                            <span className="mr-4"><span className="inline-block w-3 h-3 bg-yellow-200 mr-1"></span>Duplicate AWB (Update)</span>
                            <span><span className="inline-block w-3 h-3 bg-red-200 mr-1"></span>Missing Customer</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}