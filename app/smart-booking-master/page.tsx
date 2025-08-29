'use client'

import { useEffect, useState } from "react";
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
    const [cities, setCities] = useState<any[]>([]);
    const [cityNameToCodeMap, setCityNameToCodeMap] = useState<Record<string, string>>({});
    const [cityCodeToNameMap, setCityCodeToNameMap] = useState<Record<string, string>>({});

    const extractCityName = (locationString: string): string => {
        if (!locationString) return "";

        // Clean the string
        const cleaned = locationString.trim();

        // Method 1: Try to find exact match in city master first
        const directMatch = cities.find(city =>
            city.name.toLowerCase() === cleaned.toLowerCase()
        );
        if (directMatch) {
            return directMatch.name;
        }

        // Method 2: Split by comma and check each part against city master
        const parts = cleaned.split(',').map(part => part.trim());

        for (const part of parts) {
            const cityMatch = cities.find(city =>
                city.name.toLowerCase() === part.toLowerCase() ||
                city.code.toLowerCase() === part.toLowerCase()
            );
            if (cityMatch) {
                console.log(`✅ Extracted city: "${part}" → "${cityMatch.name}" from "${locationString}"`);
                return cityMatch.name;
            }
        }

        // Method 3: If no exact match, take first part (assuming city comes first)
        const firstPart = parts[0];

        // Check if first part contains any city name
        const partialMatch = cities.find(city =>
            firstPart.toLowerCase().includes(city.name.toLowerCase()) ||
            city.name.toLowerCase().includes(firstPart.toLowerCase())
        );

        if (partialMatch) {
            console.log(`✅ Partial match: "${firstPart}" → "${partialMatch.name}" from "${locationString}"`);
            return partialMatch.name;
        }

        console.log(`⚠️ Could not extract city from: "${locationString}", using first part: "${firstPart}"`);
        return firstPart;
    };

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
                    } else if (col === "location") {
                        // ✅ Extract only city name from location field
                        const rawLocation = row[importKey];
                        mapped[col] = extractCityName(rawLocation);
                        console.log(`Location processed: "${rawLocation}" → "${mapped[col]}"`);
                    } else {
                        mapped[col] = row[importKey];
                    }
                } else {
                    mapped[col] = "";
                }
            });

            if (mapped.location) {
                const cityCode = getCityCode(mapped.location);
                mapped.destinationCity = cityCode;

                console.log(`Auto-mapped: Location "${mapped.location}" → Destination "${mapped.destinationCity}"`);
            } else if (mapped.destinationCity) {
                // Handle destination-only case
                const extractedCity = extractCityName(mapped.destinationCity);
                mapped.location = extractedCity;
                mapped.destinationCity = getCityCode(extractedCity);
            }

            const awbNo = mapped.awbNo?.toString();
            if (awbNo && awbMap[awbNo]) {
                return { ...awbMap[awbNo], srNo: mapped.srNo, _awbExists: true, _bookingId: awbMap[awbNo].id };
            }

            return { ...mapped, _awbExists: false };
        });

        setTableRows(mappedRows);
        setLoading(false);

        const extractionResults = mappedRows
            .filter(row => row.location)
            .map(row => `${row.location}${row.destinationCity !== row.location ? ` → ${row.destinationCity}` : ''}`)
            .slice(0, 3);

        if (extractionResults.length > 0) {
            toast.success(`Cities extracted: ${extractionResults.join(", ")}${extractionResults.length > 3 ? " +more..." : ""}`);
        }
    };

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const { data } = await axios.get("/api/city-master");
                setCities(data);

                const nameToCode: Record<string, string> = {};
                const codeToName: Record<string, string> = {};

                data.forEach((city: any) => { 
                    nameToCode[city.name.toLowerCase()] = city.code;
                    codeToName[city.code.toLowerCase()] = city.name;
                });

                setCityNameToCodeMap(nameToCode);
                setCityCodeToNameMap(codeToName);

                console.log("City mappings:", { nameToCode, codeToName });
            } catch (error) {
                console.error("Failed to fetch cities:", error);
            }
        };

        fetchCities();
    }, []);

    const getCityCode = (cityName: string): string => {
        if (!cityName) return "";
        const code = cityNameToCodeMap[cityName.toLowerCase()];
        return code || cityName;
    };

    const getCityName = (cityCode: string): string => {
        if (!cityCode) return "";
        const name = cityCodeToNameMap[cityCode.toLowerCase()];
        return name || cityCode;
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

    const MODE_MAP: Record<string, string> = {
        A: "AIR",
        S: "SURFACE",
        R: "ROAD",
        T: "TRAIN"
    };

    async function fetchAndCalculateRate(row: any) {
        if (!row.customerId || !row.mode || !row.destinationCity || !row.chargeWeight) {
            return null;
        }

        try {
            const cityNameForRate = getCityName(row.destinationCity);
            const { data: cityMap } = await axios.get('/api/city-to-zone-state', {
                params: { city: cityNameForRate }
            });

            const dbMode = MODE_MAP[row.mode] || row.mode;

            const consignmentTypeMap: Record<string, string> = {
                "Dox": "DOCUMENT", "Non Dox": "PARCEL", "DOX": "DOCUMENT",
                "NON DOX": "PARCEL", "DOCUMENT": "DOCUMENT", "PARCEL": "PARCEL"
            };
            const consignmentType = consignmentTypeMap[row.dsrNdxPaper] || "DOCUMENT";

            const { data: slabs } = await axios.get('/api/rates/templates/slabs', {
                params: {
                    customerId: row.customerId,
                    mode: dbMode,
                    consignmentType: consignmentType,
                    zoneId: cityMap.zoneId,
                    stateId: cityMap.stateId,
                    city: cityNameForRate,
                }
            });

            if (!slabs || slabs.length === 0) {
                console.warn("No rate slabs found for this combination");
                return null;
            }

            const weight = Number(row.chargeWeight);
            const slab = slabs.find((s: any) => weight >= s.fromWeight && weight <= s.toWeight);

            if (!slab) {
                console.warn("No rate slab found for weight:", weight);
                return null;
            }

            let baseAmount = slab.rate;
            let additionalAmount = 0;
            if (slab.hasAdditionalRate && weight > slab.toWeight) {
                const extraWeight = weight - slab.toWeight;
                const extraUnits = Math.ceil(extraWeight / slab.additionalWeight);
                additionalAmount = extraUnits * slab.additionalRate;
            }

            const subtotal = baseAmount + additionalAmount;

            const customer = customers.find(c => c.id === row.customerId);
            if (!customer) return subtotal;

            const fuelSurchargePercent = customer.fuelSurchargePercent || 0;
            const discountPercent = customer.discountPercent || 0;

            const fuelSurchargeAmount = (subtotal * fuelSurchargePercent) / 100;
            const discountAmount = (subtotal * discountPercent) / 100;

            const finalAmount = subtotal + fuelSurchargeAmount - discountAmount;

            console.log("💼 Billing Calculation:", {
                customer: customer.customerName,
                weight: `${weight} kg`,
                mode: dbMode,
                city: cityNameForRate,
                breakdown: {
                    baseRate: `₹${baseAmount}`,
                    additionalCharges: `₹${additionalAmount}`,
                    subtotal: `₹${subtotal}`,
                    fuelSurcharge: `₹${fuelSurchargeAmount} (${fuelSurchargePercent}%)`,
                    discount: `₹${discountAmount} (${discountPercent}%)`,
                    finalAmount: `₹${finalAmount.toFixed(2)}`
                }
            });

            return parseFloat(finalAmount.toFixed(2));

        } catch (error) {
            console.error("Rate calculation error:", error);
            return null;
        }
    }

    const handleCustomerSelect = async (idx: number, customer: any) => {
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

        const updatedRow = tableRows[idx];
        updatedRow.customerId = customer.id;

        const calculatedRate = await fetchAndCalculateRate(updatedRow);
        if (calculatedRate !== null) {
            setTableRows(rows =>
                rows.map((row, i) => {
                    if (i !== idx) return row;
                    return {
                        ...row,
                        clientBillingValue: calculatedRate
                    };
                })
            );
            toast.success(`Rate calculated: ₹${calculatedRate}`);
        }
        setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
        toast.success(`Customer ${customer.customerName} selected and details auto-filled!`);
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;
                const updated = { ...row, [field]: value };

                if (field === "location") {
                    updated.location = getCityName(value);
                    updated.destinationCity = getCityCode(updated.location);
                } else if (field === "destinationCity") {
                    updated.destinationCity = value;
                    updated.location = getCityName(value);

                    if (getCityCode(value) !== value) {
                        updated.destinationCity = getCityCode(value);
                    }
                }

                if (field === "customerCode") {
                    handleCustomerSearch(idx, value);
                    if (!value) {
                        updated.customerId = "";
                        updated.customerName = "";
                        updated.receiverName = "";
                        updated.receiverContactNo = "";
                        updated.fuelSurcharge = "";
                        updated.address = "";
                        updated.clientBillingValue = "";
                    }
                }

                if (["mode", "destinationCity", "location", "chargeWeight", "dsrNdxPaper"].includes(field) && updated.customerId) {
                    fetchAndCalculateRate(updated).then(amount => {
                        if (amount !== null) {
                            setTableRows(rows2 =>
                                rows2.map((r2, j) =>
                                    j === idx ? { ...r2, clientBillingValue: amount } : r2
                                )
                            );
                        }
                    });
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
                                className="w-full p-3 border border-gray-300 text-gray-600 rounded-lg"
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
                                                            className={`w-full p-1 border rounded text-xs ${(col === "location" || col === "destinationCity") &&
                                                                row.location === row.destinationCity && row.location ?
                                                                "bg-green-50 border-green-300" : ""
                                                                }`}
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