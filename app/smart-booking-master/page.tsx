'use client'

import { useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";

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

    return (
        <div className="max-w-7xl mx-auto p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Bulk Import & Edit Bookings</h1>
                <button
                    onClick={handleDownload}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow font-semibold transition"
                >
                    Download Excel
                </button>
            </div>
            <BookingImportPanel onData={handleImport} />
            {loading && <div className="text-blue-600 my-4">Processing import...</div>}
            {tableRows.length > 0 && (
                <div className="mt-8 overflow-x-auto">
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
                            {tableRows.map((row, idx) => (
                                <tr key={idx} className={
                                    !row._customerExists ? "bg-red-50" :
                                        row._awbExists ? "bg-yellow-50" : ""
                                }>
                                    {columns.map(col => (
                                        <td key={col} className="px-3 py-2 border-b">
                                            {["bookingDate", "statusDate", "createdAt"].includes(col) ? (
                                                <input
                                                    type="date"
                                                    value={
                                                        row[col]
                                                            ? (() => {
                                                                // Try to format as yyyy-MM-dd for <input type="date">
                                                                const d = new Date(row[col]);
                                                                if (!isNaN(d.getTime())) {
                                                                    return d.toISOString().slice(0, 10);
                                                                }
                                                                // Try dd/mm/yyyy or dd-mm-yyyy
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
                                                    className="w-full p-1 border text-gray-600 rounded text-xs"
                                                />
                                            ) : (
                                                <input
                                                    value={row[col] || ""}
                                                    onChange={e => handleEdit(idx, col, e.target.value)}
                                                    className="w-full p-1 border text-gray-600 rounded text-xs"
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
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
                                            onClick={() => handleSave(idx)}
                                            disabled={!row._customerExists}
                                        >
                                            Save
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-xs text-gray-500 mt-2">
                        <span className="mr-4"><span className="inline-block w-3 h-3 bg-green-200 mr-1"></span>New</span>
                        <span className="mr-4"><span className="inline-block w-3 h-3 bg-yellow-200 mr-1"></span>Duplicate AWB (Update)</span>
                        <span><span className="inline-block w-3 h-3 bg-red-200 mr-1"></span>Missing Customer</span>
                    </div>
                </div>
            )}
        </div>
    );
}