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
    actualWeight: "FR Weight", chargeWeight: "Charge Weight", fuelSurcharge: "Fuel Surcharge",
    shipperCost: "Shipper Cost", otherExp: "Other Exp", gst: "GST", valumetric: "Valumatric",
    invoiceWt: "Invoice Wt", clientBillingValue: "Clinet Billing Value", 
    creditCustomerAmount: "Credit Cust.  Amt", regularCustomerAmount: "Regular Cust. Amt",
    customerType: "Customer Type", senderDetail: "Sender Detail", paymentStatus: "PAYMENT STATUS",
    senderContactNo: "Sender Contact No", address: "Address", adhaarNo: "Adhaar No",
    customerAttendBy: "Customer Attend By", status: "STATUS", statusDate: "Status Date",
    pendingDaysNotDelivered: "Pending Days", receiverName: "Receiver Name",
    receiverContactNo: "Receiver Contact No", ref: "Ref", delivered: "DELIVERED",
    dateOfDelivery: "Date of Delivery", todayDate: "Today Date", customerCode: "Customer Code"
};

// Import file to schema mapping
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
    customerCode: ["Customer Code"]
};

export default function SmartBookingMasterPage() {
    const [tableRows, setTableRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerSuggestions, setCustomerSuggestions] = useState<{ [key: number]: any[] }>({});

    const handleImport = async (rows: any[]) => {
        setLoading(true);
        
        // Fetch customers for suggestions
        try {
            const { data } = await axios.get("/api/customers");
            setCustomers(data);
        } catch {
            toast.error("Failed to fetch customers");
        }

        // Check existing bookings
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
            
            // Auto-fill common data from import file
            columns.forEach(col => {
                if (col === "srNo") return;
                
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

            // Check if AWB already exists
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
            c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
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
                    // Auto-fill customer related data
                    fuelSurcharge: customer.fuelSurchargePercent,
                    // Add other customer fields as needed
                };
            })
        );
        setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;
                const updated = { ...row, [field]: value };
                
                // Handle customer search
                if (field === "customerCode") {
                    handleCustomerSearch(idx, value);
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

        // Convert data types
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


// 'use client'

// import { useState } from "react";
// import BookingImportPanel from "@/components/BookingImportPanel";
// import { toast } from "sonner";
// import axios from "axios";
// import { parseDateString } from "@/lib/convertDateInJSFormat";
// import { handleDownload } from "@/lib/downloadExcel";
// import { Download, Users } from "lucide-react";

// const columns = [
//     "srNo",
//     "bookingDate",
//     "awbNo",
//     "location",
//     "destinationCity",
//     "mode",
//     "pcs",
//     "pin",
//     "dsrContents",
//     "dsrNdxPaper",
//     "invoiceValue",
//     "actualWeight",
//     "chargeWeight",
//     "fuelSurcharge",
//     "shipperCost",
//     "otherExp",
//     "gst",
//     "valumetric",
//     "invoiceWt",
//     "clientBillingValue",
//     "creditCustomerAmount",
//     "regularCustomerAmount",
//     "customerType",
//     "senderDetail",
//     "paymentStatus",
//     "senderContactNo",
//     "address",
//     "adhaarNo",
//     "customerAttendBy",
//     "status",
//     "statusDate",
//     "pendingDaysNotDelivered",
//     "receiverName",
//     "receiverContactNo",
//     "ref",
//     "delivered",
//     "dateOfDelivery",
//     "todayDate",
//     "customerCode"
// ];

// const COLUMN_MAP: Record<string, string> = {
//     srNo: "SR NO.",
//     bookingDate: "Booking Date",
//     awbNo: "Docket",
//     location: "Location",
//     destinationCity: "Destination",
//     mode: "Mode",
//     pcs: "No of Pcs",
//     pin: "Pincode",
//     dsrContents: "Content",
//     dsrNdxPaper: "Dox / Non Dox",
//     invoiceValue: "Material Value",
//     actualWeight: "FR Weight",
//     chargeWeight: "Charge Weight",
//     fuelSurcharge: "Fuel Surcharge",
//     shipperCost: "Shipper Cost",
//     otherExp: "Other Exp",
//     gst: "GST",
//     valumetric: "Valumatric",
//     invoiceWt: "Invoice Wt",
//     clientBillingValue: "Clinet Billing Value",
//     creditCustomerAmount: "Credit Cust.  Amt",
//     regularCustomerAmount: "Regular Cust. Amt",
//     customerType: "Customer Type",
//     senderDetail: "Sender Detail",
//     paymentStatus: "PAYMENT STATUS",
//     senderContactNo: "Sender Contact No",
//     address: "Address",
//     adhaarNo: "Adhaar No",
//     customerAttendBy: "Customer Attend By",
//     status: "STATUS",
//     statusDate: "Status Date",
//     pendingDaysNotDelivered: "Pending Days",
//     receiverName: "Receiver Name",
//     receiverContactNo: "Receiver Contact No",
//     ref: "Ref",
//     delivered: "DELIVERED",
//     dateOfDelivery: "Date of Delivery",
//     todayDate: "Today Date",
//     customerCode: "Customer Code",
//     // customerId: "Customer ID",
// };

// export default function SmartBookingMasterPage() {
//     const [importedRows, setImportedRows] = useState<any[]>([]);
//     const [tableRows, setTableRows] = useState<any[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [search, setSearch] = useState("");
//     const MODE_MAP: Record<string, string> = {
//         A: "AIR",
//         S: "SURFACE",
//         R: "ROAD",
//         T: "TRAIN"
//     };
//     const EXCEL_ALIASES: Record<string, string[]> = {
//         awbNo: ["AwbNo", "Docket"],
//         ref: ["CustRefNo", "Ref"],
//         bookingDate: ["Booking Date"],
//         location: ["Booking City", "Booking Branch", "Location"],
//         destinationCity: ["Destination City", "Destination"],
//         mode: ["Mode"],
//         pcs: ["PCS", "No of Pcs"],
//         pin: ["Pin", "Pincode"],
//         dsrContents: ["DSR_CONTENTS", "Content"],
//         dsrNdxPaper: ["Dox / Non Dox", "DSR_NDX_PAPER"],
//         invoiceValue: ["Invoice value", "Material Value", "Invoice Value"],
//         actualWeight: ["Actual Weight", "FR Weight"],
//         chargeWeight: ["Charge Weight"],
//         fuelSurcharge: ["Fuel Surcharge"],
//         shipperCost: ["Shipper Cost"],
//         otherExp: ["Other Exp"],
//         gst: ["GST"],
//         valumetric: ["Valumetric"],
//         invoiceWt: ["Invoice Wt"],
//         clientBillingValue: ["Clinet Billing Value", "Client Billing Value"],
//         creditCustomerAmount: ["Credit Cust.  Amt", "Credit Customer Amount"],
//         regularCustomerAmount: ["Regular Cust. Amt", "Regular Customer Amount"],
//         customerType: ["Customer Type"],
//         senderDetail: ["Sender Detail"],
//         paymentStatus: ["PAYMENT STATUS", "Payment Status"],
//         senderContactNo: ["Sender Contact No"],
//         address: ["Address"],
//         adhaarNo: ["Adhaar No"],
//         customerAttendBy: ["Customer Attend By"],
//         status: ["STATUS", "Status"],
//         statusDate: ["Status Date"],
//         pendingDaysNotDelivered: ["Pending Days", "Pending Days of Not Delivered"],
//         receiverName: ["Consignee", "Receiver Name"],
//         receiverContactNo: ["Receiver Contact No"],
//         delivered: ["DELIVERED"],
//         dateOfDelivery: ["Date of Delivery"],
//         todayDate: ["Today Date"],
//         customerCode: ["Customer Code", "CustomerCode"],
//     };

//     async function fetchAndCalculateRate(row: any) {
//         if (!row.customerId || !row.mode || !row.consignmentType || !row.city || !row.chargeWeight) {
//             return null;
//         }
//         try {
//             const { data: cityMap } = await axios.get('/api/city-to-zone-state', {
//                 params: { city: row.city }
//             });
//             row.stateId = cityMap.stateId;
//             row.zoneId = cityMap.zoneId;
//             console.log("Fetched from /api/city-to-zone-state: ", cityMap);

//             const dbMode = MODE_MAP[row.mode] || row.mode;

//             const { data: slabs } = await axios.get('/api/rates/templates/slabs', {
//                 params: {
//                     customerId: row.customerId,
//                     mode: dbMode,
//                     consignmentType: row.consignmentType,
//                     zoneId: row.zoneId,
//                     stateId: row.stateId,
//                     city: row.city,
//                 }
//             });
//             console.log("Fetched from slab api /api/rates/templates/slabs ", slabs);

//             const weight = Number(row.chargeWeight);
//             const slab = slabs.find((s: any) => weight >= s.fromWeight && weight <= s.toWeight);
//             if (!slab) {
//                 toast.error("No rate found for this combination. Please check Rate Master.");
//                 return null;
//             }

//             let amount = slab.rate;
//             if (slab.hasAdditionalRate && weight > slab.toWeight) {
//                 const extraWeight = weight - slab.toWeight;
//                 const extraUnits = Math.ceil(extraWeight / slab.additionalWeight);
//                 amount += extraUnits * slab.additionalRate;
//             }
//             console.log("Slab found:", slab, "Weight:", weight, "Amount:", amount);
//             return amount;
//         } catch (error) {
//             console.error("Rate fetch error:", error);
//             return null;
//         }
//     }

//     const handleImport = async (rows: any[]) => {
//         setLoading(true);
//         let customers: any[] = [];
//         try {
//             const { data } = await axios.get("/api/customers");
//             customers = data;
//         } catch {
//             toast.error("Failed to fetch customers for auto-fill");
//         }
//         const customerMap = Object.fromEntries(customers.map((c: any) => [c.customerCode, c]));

//         let allBookings: any[] = [];
//         try {
//             const { data } = await axios.get("/api/booking-master");
//             allBookings = data;
//         } catch {
//             toast.error("Failed to fetch bookings for AWB check");
//         }
//         const awbMap = Object.fromEntries(allBookings.map((b: any) => [String(b.awbNo), b]));
//         const warnedColumns = new Set<string>();

//         const mappedRows = rows.map((row, idx) => {
//             const mapped: any = {};
//             columns.forEach(col => {
//                 let excelKey = Object.keys(row).find(k =>
//                     (EXCEL_ALIASES[col]?.some(alias =>
//                         k.replace(/[\s_]/g, '').toLowerCase() === alias.replace(/[\s_]/g, '').toLowerCase()
//                     )) ||
//                     k.replace(/[\s_]/g, '').toLowerCase() === col.replace(/[\s_]/g, '').toLowerCase() ||
//                     k.replace(/[\s_]/g, '').toLowerCase() === (COLUMN_MAP[col] || '').replace(/[\s_]/g, '').toLowerCase()
//                 );
//                 if (!excelKey && !warnedColumns.has(col)) {
//                     console.warn(`No mapping found for column: ${col}`);
//                     warnedColumns.add(col);
//                 }
//                 if (col === "bookingDate" && excelKey) {
//                     mapped[col] = parseDateString(row[excelKey]);
//                 } else {
//                     mapped[col] = excelKey ? row[excelKey] : "";
//                 }
//             });

//             mapped.srNo = idx + 1;

//             const awbNo = mapped.awbNo?.toString();
//             let awbExists = false;
//             let bookingId = null;
//             if (awbNo && awbMap[awbNo]) {
//                 awbExists = true;
//                 bookingId = awbMap[awbNo].id;
//                 Object.assign(mapped, awbMap[awbNo], { awbNo, srNo: mapped.srNo });
//             }

//             return {
//                 ...mapped,
//                 _awbExists: awbExists,
//                 _bookingId: bookingId,

//             };
//         });

//         for (const mapped of mappedRows) {
//             mapped.creditCustomerAmount = await fetchAndCalculateRate(mapped);
//         }

//         setImportedRows(mappedRows);
//         setTableRows(mappedRows);
//         setLoading(false);
//     };

//     const handleEdit = (idx: number, field: string, value: string) => {
//         setTableRows(rows =>
//             rows.map((row, i) => {
//                 if (i !== idx) return row;
//                 const updated = { ...row, [field]: value };
//                 if (["city", "mode", "consignmentType", "chargeWeight"].includes(field)) {
//                     fetchAndCalculateRate(updated).then(amount => {
//                         setTableRows(rows2 =>
//                             rows2.map((r2, j) => j === idx ? { ...updated, creditCustomerAmount: amount } : r2)
//                         );
//                     });
//                 }

//                 return updated;
//             })
//         );
//     };
//     const handleSave = async (idx: number) => {
//         const row = tableRows[idx];
//         if (!row._customerExists) {
//             toast.error("Customer not found. Please create Customer Master first.");
//             return;
//         }
//         const cleanRow = { ...row };
//         delete cleanRow._customerExists;
//         delete cleanRow._rowStatus;

//         cleanRow.bookingDate = parseDateString(cleanRow.bookingDate);
//         cleanRow.statusDate = parseDateString(cleanRow.statusDate);
//         cleanRow.invoiceWt = Number(cleanRow.invoiceWt) || null;
//         cleanRow.clientBillingValue = Number(cleanRow.clientBillingValue) || null;
//         cleanRow.creditCustomerAmount = Number(cleanRow.creditCustomerAmount) || null;
//         cleanRow.regularCustomerAmount = Number(cleanRow.regularCustomerAmount) || null;
//         cleanRow.pendingDaysNotDelivered = Number(cleanRow.pendingDaysNotDelivered) || null;
//         cleanRow.shipmentCostOtherMode = Number(cleanRow.shipmentCostOtherMode) || null;
//         try {
//             if (row._awbExists && row._bookingId) {
//                 await axios.put(`/api/booking-master/${row._bookingId}`, cleanRow);
//                 toast.success("Booking updated!");
//             } else {
//                 await axios.post("/api/booking-master", cleanRow);
//                 toast.success("Booking created!");
//             }
//         } catch {
//             toast.error("Failed to save booking.");
//         }
//     };

//     const filteredRows = tableRows
//         .map((row, origIndex) => ({ ...row, __origIndex: origIndex })) // keep original index
//         .filter(row => {
//             if (!search) return true;
//             const s = search.toLowerCase();
//             return (
//                 (row.awbNo || "").toString().toLowerCase().includes(s) ||
//                 (row.receiverName || "").toLowerCase().includes(s) ||
//                 (row.destinationCity || "").toLowerCase().includes(s) ||
//                 (row.status || "").toLowerCase().includes(s) ||
//                 (row.paymentStatus || "").toLowerCase().includes(s) ||
//                 (row.city || "").toLowerCase().includes(s) ||
//                 (row.customerName || "").toLowerCase().includes(s)
//             );
//         });

//     const PAYMENT_STATUS_OPTIONS = ["PAID", "UNPAID", "PARTIAL"];
//     const MODE_OPTIONS = ["A", "S", "R", "T"];
//     const POD_STATUS_OPTIONS = ["Received", "Pending", "Not Required"];
//     const STATUS_OPTIONS = ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "RETURNED"];
//     const CONSIGNMENT_TYPE_OPTIONS = ["DOCUMENT", "PARCEL"];

//     return (
//         <div className="max-w-7xl mx-auto p-8 md:p-10">
//             <div className="flex items-center justify-between mb-6">
//                 <div>
//                     <h1 className="text-3xl font-bold text-gray-900">Smart Booking Master</h1>
//                     <p className="text-lg font-semibold text-purple-900">Bulk Import & Edit Bookings</p>
//                 </div>
//             </div>
//             <BookingImportPanel onData={handleImport} />
//             {tableRows.length === 0 && !loading && (
//                 <div className="flex flex-col items-center justify-center mt-24">
//                     <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center border max-w-lg">
//                         <svg className="w-16 h-16 text-purple-400 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-3-3m3 3l3-3M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6" />
//                         </svg>
//                         <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data Imported</h2>
//                         <p className="text-gray-500 mb-4 text-center">
//                             To get started, please <span className="font-semibold text-purple-700">import an Excel file</span> containing your booking data.<br />
//                             You can download a sample format using the <span className="font-semibold text-green-700">Download Excel</span> button above.
//                         </p>
//                         <span className="inline-flex items-center gap-2 text-purple-700 font-medium">
//                             <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
//                             </svg>
//                             Click <span className="font-semibold">Import Excel</span> (bottom right)
//                         </span>
//                     </div>
//                 </div>
//             )}
//             {tableRows.length > 0 && (
//                 <div className="flex justify-between bg-white py-12 px-6 rounded-xl shadow-sm border mt-10">
//                     <div className="my-2 flex flex-wrap gap-4 items-center">
//                         <div>
//                             <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
//                                 <Users className="w-5 h-5 text-purple-600" />
//                                 Search Customer
//                             </h2>
//                             <div className="flex space-x-2">
//                                 <div className="relative w-80">
//                                     <input
//                                         type="text"
//                                         id="search"
//                                         value={search}
//                                         onChange={e => setSearch(e.target.value)}
//                                         className="peer p-2 pt-5 rounded text-gray-600 border border-gray-300 text-xs w-full focus:border-purple-500 focus:outline-none"
//                                         placeholder=" "
//                                     />
//                                     <label
//                                         htmlFor="search"
//                                         className="absolute left-2 top-3.5 text-gray-400 text-xs transition-all duration-200 peer-focus:-translate-y-5.5 peer-focus:text-purple-600 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:-translate-y-5.5 peer-[&:not(:placeholder-shown)]:text-purple-600 peer-[&:not(:placeholder-shown)]:text-xs peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-xs pointer-events-none bg-transparent px-1"
//                                         style={{ background: 'white' }}
//                                     >
//                                         Search by AWB, Receiver, City, Status, etc.
//                                     </label>
//                                 </div>
//                                 <button
//                                     className="px-3 py-2.5 rounded bg-purple-700 hover:bg-purple-600 duration-200 cursor-pointer text-[14px]"
//                                     onClick={() => setSearch("")}
//                                 >
//                                     Clear
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                     <button
//                         onClick={handleDownload}
//                         className="flex cursor-pointer items-center gap-2 px-4 my-7 bg-green-600 hover:bg-green-700 text-white rounded shadow font-semibold transition"
//                     >
//                         <Download className="w-5 h-5" />
//                         Download Excel
//                     </button>
//                 </div>
//             )}
//             {loading && (
//                 <div className="flex items-center gap-2 text-blue-600 my-4">
//                     <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//                     </svg>
//                     <span>Processing import... Please wait.</span>
//                 </div>
//             )}
//             {filteredRows.length > 0 && (
//                 <div className="mt-8 overflow-x-auto">
//                     <div className="max-h-[500px] overflow-auto border rounded-lg">
//                         <table className="min-w-full border rounded-lg">
//                             <thead>
//                                 <tr>
//                                     {columns.map(col => (
//                                         <th key={col} className="px-3 py-2 border-b bg-blue-100 text-xs font-semibold text-blue-900 uppercase">
//                                             {COLUMN_MAP[col] || col}
//                                         </th>
//                                     ))}
//                                     <th className="px-3 py-2 border-b bg-blue-100 text-xs font-semibold text-blue-900 uppercase">Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {filteredRows.map((row) => {
//                                     const idx = row.__origIndex;
//                                     return (
//                                         <tr
//                                             key={row.awbNo ?? idx}
//                                             className={row._awbExists ? "bg-yellow-50" : ""}
//                                         >
//                                             {columns.map(col => (
//                                                 <td
//                                                     key={col}
//                                                     className={
//                                                         "px-1 py-2 border-b " +
//                                                         (col === "bookingDate" ? "w-32" :
//                                                             col === "awbNo" ? "w-40" :
//                                                                 col === "dsrNdxPaper" ? "w-16" : "w-28")
//                                                     }
//                                                 >
//                                                     {col === "paymentStatus" ? (
//                                                         <select
//                                                             value={row[col] || ""}
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className="w-28 p-1 border cursor-pointer text-gray-600 rounded text-xs"
//                                                         >
//                                                             <option value="">Select</option>
//                                                             {PAYMENT_STATUS_OPTIONS.map(opt => (
//                                                                 <option key={opt} value={opt}>{opt}</option>
//                                                             ))}
//                                                         </select>
//                                                     ) : col === "mode" ? (
//                                                         <select
//                                                             value={row[col] || ""}
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className="w-24 p-1 cursor-pointer border text-gray-600 rounded text-xs"
//                                                         >
//                                                             <option value="">Select</option>
//                                                             {MODE_OPTIONS.map(opt => (
//                                                                 <option key={opt} value={opt}>{opt}</option>
//                                                             ))}
//                                                         </select>
//                                                     ) : col === "consignmentType" ? (  // Add this new case
//                                                         <select
//                                                             value={row[col] || ""}
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className="w-28 p-1 border cursor-pointer text-gray-600 rounded text-xs"
//                                                         >
//                                                             <option value="">Select</option>
//                                                             {CONSIGNMENT_TYPE_OPTIONS.map(opt => (
//                                                                 <option key={opt} value={opt}>{opt}</option>
//                                                             ))}
//                                                         </select>
//                                                     ) : col === "podStatus" ? (
//                                                         <select
//                                                             value={row[col] || ""}
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className="w-28 p-1 border cursor-pointer text-gray-600 rounded text-xs"
//                                                         >
//                                                             <option value="">Select</option>
//                                                             {POD_STATUS_OPTIONS.map(opt => (
//                                                                 <option key={opt} value={opt}>{opt}</option>
//                                                             ))}
//                                                         </select>
//                                                     ) : col === "status" ? (
//                                                         <select
//                                                             value={row[col] || ""}
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className="w-32 p-1 border cursor-pointer text-gray-600 rounded text-xs"
//                                                         >
//                                                             <option value="">Select</option>
//                                                             {STATUS_OPTIONS.map(opt => (
//                                                                 <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
//                                                             ))}
//                                                         </select>
//                                                     ) : ["bookingDate", "statusDate", "createdAt"].includes(col) ? (
//                                                         <input
//                                                             type="date"
//                                                             value={
//                                                                 row[col]
//                                                                     ? (() => {
//                                                                         const d = new Date(row[col]);
//                                                                         if (!isNaN(d.getTime())) {
//                                                                             return d.toISOString().slice(0, 10);
//                                                                         }
//                                                                         const parts = row[col].split(/[\/\-]/);
//                                                                         if (parts.length === 3) {
//                                                                             const [dd, mm, yyyy] = parts;
//                                                                             return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
//                                                                         }
//                                                                         return "";
//                                                                     })()
//                                                                     : ""
//                                                             }
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className="w-28 p-1 border text-gray-600 rounded text-xs"
//                                                         />
//                                                     ) : (
//                                                         <input
//                                                             value={row[col] || ""}
//                                                             onChange={e => handleEdit(idx, col, e.target.value)}
//                                                             className={
//                                                                 (col === "awbNo" ? "w-36 " : "") +
//                                                                 (col === "dsrNdxPaper" ? "w-12 text-center " : "") + (col === "srNo" ? "w-12 text-center " : "") +
//                                                                 "p-1 border text-gray-600 rounded text-xs"
//                                                             }
//                                                             disabled={col === "awbNo" && row._awbExists}
//                                                         />
//                                                     )}
//                                                 </td>
//                                             ))} 
//                                             <td className="px-3 py-2 border-b">
//                                                 <button
//                                                     className="bg-blue-600 text-white cursor-pointer px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
//                                                     onClick={() => handleSave(idx)}
//                                                 >
//                                                     Save
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }