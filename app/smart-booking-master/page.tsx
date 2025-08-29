'use client'

import { useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";
import { Download, Users } from "lucide-react";

const columns = [
    "srNo", "bookingDate", "awbNo", "location", "destinationCity", "mode", "pcs", "pin",
    "dsrContents", "dsrNdxPaper", "invoiceValue", "actualWeight", "chargeWeight",
    "fuelSurcharge", "shipperCost", "otherExp", "gst", "valumetric", "invoiceWt",
    "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount", "customerType",
    "senderDetail", "paymentStatus", "senderContactNo", "address", "adhaarNo",
    "customerAttendBy", "status", "statusDate", "pendingDaysNotDelivered", "receiverName",
    "receiverContactNo", "ref", "delivered", "dateOfDelivery", "todayDate", "customerCode"
];

const COLUMN_MAP: Record<string, string> = {
    srNo: "SR NO.", bookingDate: "Booking Date", awbNo: "Docket", location: "Location",
    destinationCity: "Destination", mode: "Mode", pcs: "No of Pcs", pin: "Pincode",
    dsrContents: "Content", dsrNdxPaper: "Dox / Non Dox", invoiceValue: "Material Value",
    actualWeight: "FR Weight", chargeWeight: "Charge Weight", fuelSurcharge: "Fuel Surcharge (in %)",
    shipperCost: "Shipper Cost", otherExp: "Other Exp", gst: "GST", valumetric: "Valumatric",
    invoiceWt: "Invoice Wt", clientBillingValue: "Client Billing Value",
    creditCustomerAmount: "Credit Cust.  Amt", regularCustomerAmount: "Regular Cust. Amt",
    customerType: "Customer Type", senderDetail: "Sender Detail", paymentStatus: "PAYMENT STATUS",
    senderContactNo: "Sender Contact No", address: "Address", adhaarNo: "Adhaar No",
    customerAttendBy: "Customer Attend By", status: "STATUS", statusDate: "Status Date",
    pendingDaysNotDelivered: "Pending Days", receiverName: "Receiver Name",
    receiverContactNo: "Receiver Contact No", ref: "Ref", delivered: "DELIVERED",
    dateOfDelivery: "Date of Delivery", todayDate: "Today Date", customerCode: "Customer Code"
};
 
const IMPORT_ALIASES: Record<string, string[]> = {
    awbNo: ["AwbNo", "Docket"],
    ref: ["CustRefNo", "Ref"],
    bookingDate: ["Booking Date"],
    location: ["Booking City", "Booking Branch", "Location"],
    receiverName: ["Consignee", "Receiver Name"],
    destinationCity: ["Destination City", "Destination"],
    pin: ["Pin", "Pincode"],
    mode: ["Mode"],
    pcs: ["PCS", "No of Pcs"],
    actualWeight: ["Actual Weight", "FR Weight"],
    chargeWeight: ["Charge Weight"],
    invoiceValue: ["Invoice value", "Material Value"],
    status: ["STATUS", "Status"],
    statusDate: ["Status Date"],
    dsrNdxPaper: ["Dox / Non Dox"],
    dsrContents: ["DSR_CONTENTS", "Content"],
};

export default function SmartBookingMasterPage() {
    const [tableRows, setTableRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerSuggestions, setCustomerSuggestions] = useState<{ [key: number]: any[] }>({});

    const handleImport = async (rows: any[]) => {
        setLoading(true);
 
        try {
            const { data } = await axios.get("/api/customers");
            setCustomers(data);
        } catch {
            toast.error("Failed to fetch customers");
        }

        let existingBookings: any[] = [];
        try {
            const { data } = await axios.get("/api/booking-master");
            existingBookings = data;
        } catch {
            toast.error("Failed to fetch existing bookings");
        }
        const awbMap = Object.fromEntries(existingBookings.map((b: any) => [String(b.awbNo), b]));

        const mappedRows = rows.map((row, idx) => {
            const mapped: any = { srNo: idx + 1 };

            columns.forEach(col => {
                if (col === "srNo") return;
                const customerFields = ["customerCode", "customerId", "customerName", "fuelSurcharge"];
                if (customerFields.includes(col)) {
                    mapped[col] = "";
                    return;
                }


                let importKey = Object.keys(row).find(k =>
                    IMPORT_ALIASES[col]?.some(alias =>
                        k.replace(/[\s_]/g, '').toLowerCase() === alias.replace(/[\s_]/g, '').toLowerCase()
                    ) ||
                    k.replace(/[\s_]/g, '').toLowerCase() === col.replace(/[\s_]/g, '').toLowerCase()
                );

                if (importKey) {
                    if (col === "bookingDate" || col === "statusDate") {
                        mapped[col] = parseDateString(row[importKey]);
                    } else {
                        mapped[col] = row[importKey];
                    }
                } else {
                    mapped[col] = "";
                }
            });
            const awbNo = mapped.awbNo?.toString();
            if (awbNo && awbMap[awbNo]) {
                return { ...awbMap[awbNo], srNo: mapped.srNo, _awbExists: true, _bookingId: awbMap[awbNo].id };
            }

            return { ...mapped, _awbExists: false };
        });

        setTableRows(mappedRows);
        setLoading(false);
    };

    const handleCustomerSearch = async (idx: number, searchTerm: string) => {
        if (searchTerm.length < 2) {
            setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
            return;
        }

        const filtered = customers.filter(c =>
            c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);

        setCustomerSuggestions(prev => ({ ...prev, [idx]: filtered }));
    };

    const handleCustomerSelect = (idx: number, customer: any) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;
                return {
                    ...row,
                    customerCode: customer.customerCode,
                    customerId: customer.id,
                    customerName: customer.customerName,
                    receiverName: customer.contactPerson || "",
                    receiverContactNo: customer.mobile || customer.phone || "",
                    fuelSurcharge: customer.fuelSurchargePercent || 0,
                    address: customer.address || "",
                };
            })
        );
        setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
        toast.success(`Customer ${customer.customerName} selected and details auto-filled!`);
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;
                const updated = { ...row, [field]: value };

                if (field === "customerCode") {
                    handleCustomerSearch(idx, value);
                    if (!value) {
                        updated.customerId = "";
                        updated.customerName = "";
                        updated.receiverName = "";
                        updated.receiverContactNo = "";
                        updated.fuelSurcharge = "";
                        updated.address = "";
                    }
                }

                return updated;
            })
        );
    };

    const handleSave = async (idx: number) => {
        const row = tableRows[idx];

        if (!row.customerId) {
            toast.error("Please select a customer first");
            return;
        }

        const cleanRow = { ...row };
        delete cleanRow._awbExists;
        delete cleanRow._bookingId;
        delete cleanRow.__origIndex;
        delete cleanRow.customerName;

        cleanRow.bookingDate = new Date(cleanRow.bookingDate);
        cleanRow.statusDate = cleanRow.statusDate ? new Date(cleanRow.statusDate) : null;
        cleanRow.dateOfDelivery = cleanRow.dateOfDelivery ? new Date(cleanRow.dateOfDelivery) : null;

        ["pcs", "invoiceValue", "actualWeight", "chargeWeight", "fuelSurcharge",
            "shipperCost", "otherExp", "gst", "valumetric", "invoiceWt",
            "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
            "pendingDaysNotDelivered"].forEach(field => {
                cleanRow[field] = cleanRow[field] ? Number(cleanRow[field]) : null;
            });

        try {
            if (row._awbExists && row._bookingId) {
                await axios.put(`/api/booking-master/${row._bookingId}`, cleanRow);
                toast.success("Booking updated!");
            } else {
                await axios.post("/api/booking-master", cleanRow);
                toast.success("Booking created!");
            }
        } catch {
            toast.error("Failed to save booking");
        }
    };

    const filteredRows = tableRows.filter(row => {
        if (!search) return true;
        const s = search.toLowerCase();
        return Object.values(row).some(val =>
            val && val.toString().toLowerCase().includes(s)
        );
    }).map((row, idx) => ({ ...row, __origIndex: tableRows.indexOf(row) }));

    const OPTIONS = {
        paymentStatus: ["PAID", "UNPAID", "PARTIAL"],
        mode: ["A", "S", "R", "T"],
        status: ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "RETURNED"],
        delivered: ["YES", "NO", "PARTIAL"]
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Smart Booking Master</h1>
                    <p className="text-lg font-semibold text-purple-900">Bulk Import & Edit Bookings</p>
                </div>
            </div>

            <BookingImportPanel onData={handleImport} />

            {loading && (
                <div className="flex items-center gap-2 text-blue-600 my-4">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Processing import...</span>
                </div>
            )}

            {tableRows.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center mt-24">
                    <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-lg">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Download className="w-8 h-8 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data Imported</h2>
                        <p className="text-gray-500 mb-4">Import an Excel file to get started</p>
                    </div>
                </div>
            )}

            {tableRows.length > 0 && (
                <>
                    <div className="flex justify-between bg-white py-6 px-6 rounded-xl shadow-sm border mt-10">
                        <div className="relative w-80">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Search by AWB, Customer, Status..."
                            />
                        </div>
                        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                            <Download className="w-5 h-5" />
                            Download Excel
                        </button>
                    </div>

                    <div className="mt-8 overflow-x-auto">
                        <div className="max-h-[600px] overflow-auto border rounded-lg">
                            <table className="min-w-full text-gray-600">
                                <thead className="sticky top-0 bg-blue-100">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col} className="px-3 py-2 text-xs font-semibold text-blue-900 border-b">
                                                {COLUMN_MAP[col]}
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-xs font-semibold text-blue-900 border-b">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row) => (
                                        <tr key={row.__origIndex} className={row._awbExists ? "bg-yellow-50" : ""}>
                                            {columns.map(col => (
                                                <td key={col} className="px-1 py-2 border-b relative">
                                                    {["paymentStatus", "mode", "status", "delivered"].includes(col) ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                        >
                                                            <option value="">Select</option>
                                                            {OPTIONS[col as keyof typeof OPTIONS].map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : ["bookingDate", "statusDate", "dateOfDelivery", "todayDate"].includes(col) ? (
                                                        <input
                                                            type="date"
                                                            value={row[col] ? new Date(row[col]).toISOString().slice(0, 10) : ""}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                        />
                                                    ) : col === "customerCode" ? (
                                                        <div className="relative">
                                                            <input
                                                                value={row[col] || ""}
                                                                onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                                className="w-full p-1 border rounded text-xs"
                                                                placeholder="Search customer..."
                                                            />
                                                            {customerSuggestions[row.__origIndex]?.length > 0 && (
                                                                <div className="absolute top-full left-0 z-10 w-64 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                                    {customerSuggestions[row.__origIndex].map(customer => (
                                                                        <div
                                                                            key={customer.id}
                                                                            onClick={() => handleCustomerSelect(row.__origIndex, customer)}
                                                                            className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
                                                                        >
                                                                            <div className="font-medium">{customer.customerCode}</div>
                                                                            <div className="text-gray-500">{customer.customerName}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                            disabled={col === "awbNo" && row._awbExists}
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 border-b">
                                                <button
                                                    onClick={() => handleSave(row.__origIndex)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}