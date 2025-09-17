'use client'

import { useEffect, useMemo, useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";
import { Download, Users } from "lucide-react";
import UploadStatusExcelButton from "@/components/UploadStatusExcelButton";
import { debounce } from 'lodash';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const columns = [
    "srNo", "bookingDate", "awbNo", "location", "destinationCity", "mode", "pcs", "pin",
    "dsrContents", "dsrNdxPaper", "invoiceValue", "length", "width", "height", "valumetric", "actualWeight", "chargeWeight", "frCharge", "invoiceWt",
    "fuelSurcharge", "shipperCost", "otherExp", "gst", "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount", "customerType",
    "senderDetail", "paymentStatus", "senderContactNo", "address", "adhaarNo",
    "customerAttendBy", "status", "statusDate", "pendingDaysNotDelivered", "receiverName",
    "receiverContactNo", "ref", "delivered", "dateOfDelivery", "todayDate", "customerCode"
];

const COLUMN_MAP: Record<string, string> = {
    srNo: "SR NO.", bookingDate: "Booking Date", awbNo: "Docket", location: "Location",
    destinationCity: "Destination", mode: "Mode", pcs: "No of Pcs", pin: "Pincode",
    dsrContents: "Content", dsrNdxPaper: "Dox / Non Dox", invoiceValue: "Material Value",
    actualWeight: "FR Weight", chargeWeight: "Charge Weight", frCharge: "FR Charge", fuelSurcharge: "Fuel Surcharge",
    shipperCost: "Shipper Cost", otherExp: "Other Exp", gst: "GST", length: "Length", width: "Width", height: "Height", valumetric: "Valumatric",
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
    customerAttendBy: ["Consignee"],
    destinationCity: ["Destination City", "Destination"],
    pin: ["Pin", "Pincode"],
    mode: ["Mode"],
    pcs: ["PCS", "No of Pcs"],
    actualWeight: ["Actual Weight", "FR Weight"],
    frCharge: ["FR Charge"],
    chargeWeight: ["Charge Weight"],
    invoiceValue: ["Invoice value", "Material Value"],
    status: ["STATUS", "Status"],
    statusDate: ["Status Date"],
    dsrNdxPaper: ["Dox / Non Dox"],
    dsrContents: ["DSR_CONTENTS", "Content"],
    length: ["Length", "L"],
    width: ["Width", "W"],
    height: ["Height", "H"],
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
    const [taxMaster, setTaxMaster] = useState<any[]>([]);
    const [pincodeMaster, setPincodeMaster] = useState<any[]>([]);
    const [companyState, setCompanyState] = useState<string>("delhi");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalPages, setTotalPages] = useState(1);

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

    const fetchUnassignedBookings = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/booking-master/unassigned');
            const rowsWithIndex = data.map((row: any, idx: number) => ({
                ...row,
                srNo: idx + 1,
                _awbExists: true,
                _bookingId: row.id,
                pendingDaysNotDelivered: calculatePendingDays(row.bookingDate, row.status),
                todayDate: getCurrentDate(),
            }));
            setTableRows(rowsWithIndex);
            if (rowsWithIndex.length > 0) {
                toast.info(`${rowsWithIndex.length} bookings pending for customer assignment.`);
            } else {
                toast.success("All bookings are assigned. No pending data found.");
            }
        } catch (error) {
            toast.error("Failed to load pending bookings.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const extractCityName = (locationString: string): string => {
        if (!locationString) return "";

        const cleaned = locationString.trim();

        const directMatch = cities.find(city =>
            city.name.toLowerCase() === cleaned.toLowerCase()
        );
        if (directMatch) {
            return directMatch.name;
        }

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

        const firstPart = parts[0];

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
    const MODE_MAP: Record<string, string> = {
        E: "EXPRESS",
        S: "SURFACE",
        A: "AIR",
        P: "PREMIUM",
        R: "RAIL",
        O: "OTHER MODE"
    };
    const handleImport = async (rows: any[]) => {
        setLoading(true);
        toast.info("Processing imported file...");

        try {
            const { data: customerData } = await axios.get("/api/customers");
            setCustomers(customerData);
        } catch {
            toast.error("Failed to fetch customers");
            setLoading(false);
            return;
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
                const customerFields = ["customerCode", "customerId", "customerName", "fuelSurcharge", "receiverName"];
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
                    if (col === "mode") {
                        const rawMode = row[importKey]?.toString().toUpperCase();
                        mapped[col] = MODE_MAP[rawMode] || rawMode;
                    } else if (col === "dsrNdxPaper") {
                        const rawValue = row[importKey]?.toString().toUpperCase();
                        if (rawValue === 'D' || rawValue === 'N') {
                            mapped[col] = rawValue;
                        } else if (rawValue === 'DOCUMENT') {
                            mapped[col] = 'D';
                        } else if (rawValue === 'PARCEL' || rawValue === 'NON DOX') {
                            mapped[col] = 'N';
                        } else {
                            mapped[col] = rawValue;
                        }
                    } else if (col === "bookingDate" || col === "statusDate") {
                        mapped[col] = parseDateString(row[importKey]);
                    } else if (col === "location") {
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
            mapped.customerType = "CREDIT";

            if (mapped.location) {
                const cityCode = getCityCode(mapped.location);
                mapped.destinationCity = cityCode;

                console.log(`Auto-mapped: Location "${mapped.location}" → Destination "${mapped.destinationCity}"`);
            } else if (mapped.destinationCity) {
                const extractedCity = extractCityName(mapped.destinationCity);
                mapped.location = extractedCity;
                mapped.destinationCity = getCityCode(extractedCity);
            }

            const awbNo = mapped.awbNo?.toString();
            if (awbNo && awbMap[awbNo]) {
                const updatedRow = { ...awbMap[awbNo], ...mapped, _awbExists: true, _bookingId: awbMap[awbNo].id };
                updatedRow.pendingDaysNotDelivered = calculatePendingDays(updatedRow.bookingDate, updatedRow.status);
                updatedRow.todayDate = getCurrentDate();

                const l = parseFloat(updatedRow.length) || 0;
                const w = parseFloat(updatedRow.width) || 0;
                const h = parseFloat(updatedRow.height) || 0;
                if (l > 0 && w > 0 && h > 0) {
                    const volumetricValue = ((l * w * h) / 5000).toFixed(2);
                    mapped.valumetric = volumetricValue;

                    const actualWeight = parseFloat(mapped.actualWeight) || 0;
                    const volumetricWeight = parseFloat(volumetricValue);
                    if (volumetricWeight > actualWeight) {
                        mapped.chargeWeight = volumetricValue;
                    } else if (actualWeight > 0) {
                        updatedRow.chargeWeight = updatedRow.actualWeight;
                    }
                    updatedRow.invoiceWt = Math.max(actualWeight, parseFloat(updatedRow.chargeWeight) || 0).toFixed(2);
                } else {
                    updatedRow.valumetric = "0.00";
                }
                return updatedRow;
            }
            mapped.paymentStatus = "UNPAID";
            mapped.pendingDaysNotDelivered = calculatePendingDays(mapped.bookingDate, mapped.status);
            mapped.todayDate = getCurrentDate();

            const l = parseFloat(mapped.length) || 0;
            const w = parseFloat(mapped.width) || 0;
            const h = parseFloat(mapped.height) || 0;
            if (l > 0 && w > 0 && h > 0) {
                const volumetricValue = ((l * w * h) / 5000).toFixed(2);
                mapped.valumetric = volumetricValue;

                const actualWeight = parseFloat(mapped.actualWeight) || 0;
                const volumetricWeight = parseFloat(volumetricValue);
                if (volumetricWeight > actualWeight) {
                    mapped.chargeWeight = volumetricValue;
                } else if (actualWeight > 0) {
                    mapped.chargeWeight = actualWeight;
                }
                mapped.invoiceWt = Math.max(actualWeight, parseFloat(mapped.chargeWeight) || 0).toFixed(2);
            } else {
                mapped.valumetric = "0.00";
            }

            return { ...mapped, _awbExists: false };
        });

        if (mappedRows.length > 0) {
            try {
                toast.info(`Saving/Updating ${mappedRows.length} bookings in the database...`);
                const { data: createResult } = await axios.post('/api/booking-master/bulk-create', mappedRows); // Send all mappedRows
                toast.success(createResult.message || `${createResult.count} bookings processed successfully.`);

                await fetchUnassignedBookings();
            } catch (error: any) {
                console.error("Bulk booking creation/update failed:", error);
                toast.error(error.response?.data?.error || "Failed to save/update bookings.");
                setTableRows(mappedRows);
            }
        } else {
            toast.info("No data to import.");
        }

        setLoading(false);

        const extractionResults = mappedRows
            .filter(row => row.location)
            .map(row => `${row.location}${row.destinationCity !== row.location ? ` → ${row.destinationCity}` : ''}`)
            .slice(0, 3);

        if (extractionResults.length > 0) {
            toast.success(`Cities extracted: ${extractionResults.join(", ")}${extractionResults.length > 3 ? " +more..." : ""}`);
        }

        const awbNumbers = mappedRows.map(row => row.awbNo).filter(Boolean);
        if (awbNumbers.length > 0) {
            try {
                const { data } = await axios.post('/api/docket-stock', { awbNumbers });
                if (data.count > 0) {
                    toast.info(`${data.count} new docket(s) added to stock.`);
                }
            } catch (error) {
                console.error("Failed to update docket stock:", error);
                toast.error("Could not update docket stock.");
            }
        }
    };

    useEffect(() => {
        fetchUnassignedBookings();
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
        const fetchTaxMaster = async () => {
            try {
                const { data } = await axios.get("/api/taxMaster");
                setTaxMaster(data);
                console.log("Tax Master loaded:", data);
            } catch (error) {
                console.error("Failed to fetch tax master:", error);
            }
        };

        const fetchPincodeMaster = async () => {
            try {
                const { data } = await axios.get("/api/pincode-master");
                setPincodeMaster(data);
                console.log("Pincode Master loaded:", data);
            } catch (error) {
                console.error("Failed to fetch pincode master:", error);
            }
        };

        fetchCities();
        fetchTaxMaster();
        fetchPincodeMaster();
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
            const totalRate = sgstRate + cgstRate;

            console.log(`📍 Intra-state GST: SGST(${sgstRate}%) + CGST(${cgstRate}%) = ${totalRate}%`);
            return totalRate;
        } else {
            const igstTax = taxMaster.find(tax => tax.taxCode === 'IGST');
            const igstRate = igstTax ? parseFloat(igstTax.ratePercent) : 18;

            console.log(`🌍 Inter-state GST: IGST(${igstRate}%)`);
            return igstRate;
        }
    };

    const calculatePendingDays = (bookingDate: string, status: string): number => {
        if (!status || status.toUpperCase() === "DELIVERED" || !bookingDate) return 0;

        const booking = new Date(bookingDate);
        const today = new Date();
        const diffTime = today.getTime() - booking.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    };

    const getCurrentDate = (): string => {
        return new Date().toISOString().split('T')[0];
    };

    const handleCustomerSearch = debounce(async (idx: number, searchTerm: string) => {
        if (searchTerm.length < 2) {
            setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
            return;
        }

        try {
            const { data } = await axios.get(`/api/customers?query=${searchTerm}`);
            setCustomerSuggestions(prev => ({ ...prev, [idx]: data }));
        } catch (error) {
            console.error("Error searching customers:", error);
        }
    }, 300);

    // async function fetchAndCalculateRate(row: any) {
    //     if (!row.customerId || !row.mode || !row.destinationCity || !row.chargeWeight) {
    //         return null;
    //     }

    //     try {
    //         const cityNameForRate = getCityName(row.destinationCity);
    //         const { data: cityMap } = await axios.get('/api/city-to-zone-state', {
    //             params: { city: cityNameForRate }
    //         });

    //         const dbMode = row.mode;

    //         const consignmentTypeMap: Record<string, string> = {
    //             "Dox": "DOCUMENT", "Non Dox": "PARCEL", "DOX": "DOCUMENT",
    //             "NON DOX": "PARCEL", "DOCUMENT": "DOCUMENT", "PARCEL": "PARCEL"
    //         };
    //         const consignmentType = consignmentTypeMap[row.dsrNdxPaper] || "DOCUMENT";

    //         const { data: slabs } = await axios.get('/api/rates/templates/slabs', {
    //             params: {
    //                 customerId: row.customerId,
    //                 mode: dbMode,
    //                 consignmentType: consignmentType,
    //                 zoneId: cityMap.zoneId,
    //                 stateId: cityMap.stateId,
    //                 city: cityNameForRate,
    //             }
    //         });

    //         if (!slabs || slabs.length === 0) {
    //             console.warn("No rate slabs found for this combination");
    //             return null;
    //         }

    //         const weight = Number(row.chargeWeight);
    //         const slab = slabs.find((s: any) => weight >= s.fromWeight && weight <= s.toWeight);

    //         if (!slab) {
    //             console.warn("No rate slab found for weight:", weight);
    //             return null;
    //         }

    //         let baseAmount = slab.rate;
    //         let additionalAmount = 0;
    //         if (slab.hasAdditionalRate && weight > slab.toWeight) {
    //             const extraWeight = weight - slab.toWeight;
    //             const extraUnits = Math.ceil(extraWeight / slab.additionalWeight);
    //             additionalAmount = extraUnits * slab.additionalRate;
    //         }

    //         const subtotal = baseAmount + additionalAmount;

    //         const customer = customers.find(c => c.id === row.customerId);
    //         if (!customer) return subtotal;

    //         const fuelSurchargePercent = customer.fuelSurchargePercent || 0;
    //         const discountPercent = customer.discountPercent || 0;

    //         const fuelSurchargeAmount = (subtotal * fuelSurchargePercent) / 100;
    //         const discountAmount = (subtotal * discountPercent) / 100;

    //         const finalAmount = subtotal + fuelSurchargeAmount - discountAmount;

    //         console.log("💼 Billing Calculation:", {
    //             customer: customer.customerName,
    //             weight: `${weight} kg`,
    //             mode: dbMode,
    //             city: cityNameForRate,
    //             breakdown: {
    //                 baseRate: `₹${baseAmount}`,
    //                 additionalCharges: `₹${additionalAmount}`,
    //                 subtotal: `₹${subtotal}`,
    //                 fuelSurcharge: `₹${fuelSurchargeAmount} (${fuelSurchargePercent}%)`,
    //                 discount: `₹${discountAmount} (${discountPercent}%)`,
    //                 finalAmount: `₹${finalAmount.toFixed(2)}`
    //             }
    //         });

    //         return parseFloat(finalAmount.toFixed(2));

    //     } catch (error) {
    //         console.error("Rate calculation error:", error);
    //         return null;
    //     }
    // }

    // const handleCustomerSelect = async (idx: number, customer: any) => {
    //     setTableRows(rows =>
    //         rows.map((row, i) => {
    //             if (i !== idx) return row;
    //             const frCharge = parseFloat(row.frCharge) || 0;
    //             const fuelSurchargePercent = customer.fuelSurchargePercent || 0;
    //             let fuelSurcharge = 0;
    //             if (frCharge > 0) {
    //                 fuelSurcharge = (frCharge * fuelSurchargePercent) / 100;
    //             }
    //             return {
    //                 ...row,
    //                 customerCode: customer.customerCode,
    //                 customerId: customer.id,
    //                 customerName: customer.customerName,
    //                 customerAttendBy: customer.contactPerson || "",
    //                 senderContactNo: customer.mobile || customer.phone || "",
    //                 senderDetail: customer.customerName || "",
    //                 _fuelSurchargePercent: fuelSurchargePercent,
    //                 fuelSurcharge: fuelSurcharge.toFixed(2),
    //                 address: customer.address || "",
    //                 todayDate: getCurrentDate(),
    //             };
    //         })
    //     );

    //     const updatedRow = tableRows[idx];
    //     updatedRow.customerId = customer.id;

    //     const calculatedRate = await fetchAndCalculateRate(updatedRow);
    //     if (calculatedRate !== null) {
    //         const gstPercentage = getGSTPercentage(customer.pincode || "");

    //         setTableRows(rows =>
    //             rows.map((row, i) => {
    //                 if (i !== idx) return row;
    //                 return {
    //                     ...row,
    //                     clientBillingValue: calculatedRate,
    //                     gst: gstPercentage
    //                 };
    //             })
    //         );
    //         toast.success(`Rate: ₹${calculatedRate} | GST: ${gstPercentage}%`);
    //     }
    //     setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
    //     toast.success(`Customer ${customer.customerName} selected and details auto-filled!`);
    // };
    const handleCustomerSelect = async (idx: number, customer: any) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;

                const gstPercentage = getGSTPercentage(customer.pincode || "");
                let updatedRow = {
                    ...row,
                    customerCode: customer.customerCode,
                    customerId: customer.id,
                    customerName: customer.customerName,
                    customerAttendBy: customer.contactPerson || "",
                    senderContactNo: customer.mobile || customer.phone || "",
                    senderDetail: customer.customerName || "",
                    _fuelSurchargePercent: customer.fuelSurchargePercent || 0,
                    _gstPercent: gstPercentage, 
                    address: customer.address || "",
                    todayDate: getCurrentDate(),
                };
                const frCharge = parseFloat(updatedRow.frCharge) || 0;
                const fuelSurchargePercent = updatedRow._fuelSurchargePercent || 0;
                updatedRow.fuelSurcharge = frCharge > 0 ? ((frCharge * fuelSurchargePercent) / 100).toFixed(2) : "0.00";

                return recalculateClientBilling(updatedRow);
            })
        );

        setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
        toast.success(`Customer ${customer.customerName} selected and details auto-filled!`);
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;
                let updated = { ...row, [field]: value };

                if (field === "frCharge") {
                    const frCharge = parseFloat(value) || 0;
                    const fuelSurchargePercent = updated._fuelSurchargePercent || 0;
                    if (frCharge > 0 && fuelSurchargePercent > 0) {
                        updated.fuelSurcharge = ((frCharge * fuelSurchargePercent) / 100).toFixed(2);
                    } else {
                        updated.fuelSurcharge = "0.00";
                    }
                }

                if (["frCharge", "shipperCost", "otherExp"].includes(field)) {
                    updated = recalculateClientBilling(updated);
                }

                if (field === "actualWeight" || field === "chargeWeight") {
                    const actualWeight = field === "actualWeight" ? parseFloat(value) || 0 : parseFloat(updated.actualWeight) || 0;
                    const chargeWeight = field === "chargeWeight" ? parseFloat(value) || 0 : parseFloat(updated.chargeWeight) || 0;
                    updated.invoiceWt = Math.max(actualWeight, chargeWeight).toFixed(2);
                }

                if (["length", "width", "height"].includes(field)) {
                    const l = parseFloat(updated.length) || 0;
                    const w = parseFloat(updated.width) || 0;
                    const h = parseFloat(updated.height) || 0;
                    if (l > 0 && w > 0 && h > 0) {
                        const volumetricValue = ((l * w * h) / 5000).toFixed(2);
                        updated.valumetric = volumetricValue;

                        const actualWeight = parseFloat(updated.actualWeight) || 0;
                        const volumetricWeight = parseFloat(volumetricValue);
                        if (volumetricWeight > actualWeight) {
                            updated.chargeWeight = volumetricValue;
                        } else if (actualWeight > 0) {
                            updated.chargeWeight = updated.actualWeight;
                        }
                        updated.invoiceWt = Math.max(actualWeight, parseFloat(updated.chargeWeight) || 0).toFixed(2);
                    } else {
                        updated.valumetric = "0.00";
                    }
                }
                console.log(updated.valumetric);

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
                        updated.gst = "";
                        updated._gstPercent = 0;
                    }
                }

                // if (["mode", "destinationCity", "location", "chargeWeight", "dsrNdxPaper"].includes(field) && updated.customerId) {
                //     fetchAndCalculateRate(updated).then(amount => {
                //         if (amount !== null) {
                //             const customer = customers.find(c => c.id === updated.customerId);
                //             const gstPercentage = customer ? getGSTPercentage(customer.pincode || "") : "";

                //             setTableRows(rows2 =>
                //                 rows2.map((r2, j) =>
                //                     j === idx ? {
                //                         ...r2,
                //                         clientBillingValue: amount,
                //                         gst: gstPercentage
                //                     } : r2
                //                 )
                //             );
                //         }
                //     });
                // }
                // if (field === "clientBillingValue" && updated.customerId) {
                //     const customer = customers.find(c => c.id === updated.customerId);
                //     if (customer) {
                //         const gstPercentage = getGSTPercentage(customer.pincode || "");
                //         updated.gst = gstPercentage;
                //     }
                // }
                if (field === "status" || field === "bookingDate") {
                    updated.pendingDaysNotDelivered = calculatePendingDays(
                        field === "bookingDate" ? value : updated.bookingDate,
                        field === "status" ? value : updated.status
                    );
                }
                updated.todayDate = getCurrentDate();
                return updated;
            })
        );
    };

    const handleSave = async (idx: number) => {
        setLoading(true);
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

        ["pcs", "invoiceValue", "actualWeight", "chargeWeight", "frCharge", "fuelSurcharge",
            "shipperCost", "otherExp", "gst", "valumetric", "invoiceWt",
            "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
            "pendingDaysNotDelivered"].forEach(field => {
                if (field === "gst") {
                    const gstValue = cleanRow[field];
                    if (typeof gstValue === 'string' && gstValue.includes('%')) {
                        cleanRow[field] = parseFloat(gstValue.replace('%', ''));
                    } else {
                        cleanRow[field] = gstValue ? Number(gstValue) : null;
                    }
                } else {
                    cleanRow[field] = cleanRow[field] ? Number(cleanRow[field]) : null;
                }
            });

        try {
            if (row._awbExists && row._bookingId) {
                await axios.put(`/api/booking-master/${row._bookingId}`, cleanRow);
                toast.success("Booking updated!");
            } else {
                await axios.post("/api/booking-master", cleanRow);
                toast.success("Booking created!");
            }
            await axios.put('/api/docket-stock', { awbNo: cleanRow.awbNo, status: 'USED' });
        } catch {
            toast.error("Failed to save booking");
        } finally {
            setLoading(false);
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
        mode: ["AIR", "EXPRESS", "PREMIUM", "RAIL", "SURFACE", "OTHER MODE"],
        status: ["BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "RETURNED"],
        delivered: ["YES", "NO", "PARTIAL"]
    };

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredRows.slice(startIndex, endIndex);
    }, [filteredRows, currentPage, pageSize]);
    useEffect(() => {
        setTotalPages(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
        // Reset to page 1 if we're beyond the new total pages
        if (currentPage > Math.ceil(filteredRows.length / pageSize)) {
            setCurrentPage(1);
        }
    }, [filteredRows, pageSize]);

    // Add these pagination control functions
    const goToPage = (page: number) => {
        const targetPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(targetPage);
    };

    const goToFirstPage = () => goToPage(1);
    const goToPrevPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);
    const goToLastPage = () => goToPage(totalPages);

    return (
        <div className="max-w-[1440px] mx-auto p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Smart Booking Master</h1>
                    <p className="text-lg font-semibold text-purple-900">Bulk Import & Edit Bookings</p>
                </div>
            </div>
            <UploadStatusExcelButton onUploadComplete={fetchUnassignedBookings} />

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
                        <button onClick={handleDownload} className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                            <Download className="w-5 h-5" />
                            Download Excel
                        </button>
                    </div>

                    <div className="mt-8 overflow-x-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} bookings
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">Rows per page:</label>
                                <select
                                    id="pageSize"
                                    value={pageSize}
                                    onChange={e => setPageSize(Number(e.target.value))}
                                    className="text-sm border border-gray-300 text-blue-600 cursor-pointer rounded p-1"
                                >
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="500">500</option>
                                </select>
                            </div>
                        </div>
                        <div className="max-h-[300px] overflow-auto border rounded-lg">
                            <table className="min-w-full text-gray-600">
                                <thead className="sticky top-0 z-20 bg-blue-100">
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
                                    {/* {filteredRows.map((row) => ( */}
                                    {paginatedRows.map((row) => (
                                        <tr key={row.__origIndex} className={row._awbExists ? "bg-yellow-50" : ""}>
                                            {columns.map(col => (
                                                <td key={col} className="px-1 py-2 border-b relative">
                                                    {["paymentStatus", "mode", "status", "delivered"].includes(col) ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                            disabled={col === 'paymentStatus' && row.status !== 'INVOICED'}
                                                            title={col === 'paymentStatus' && row.status !== 'INVOICED' ? 'Payment status can only be changed after an invoice is generated.' : ''}
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
                                                    ) : col === "dsrNdxPaper" ? (
                                                        <select
                                                            value={row[col] || ""}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="D">D (Dox)</option>
                                                            <option value="N">N (Non Dox)</option>
                                                        </select>
                                                    ) : col === "customerType" ? (
                                                        <select
                                                            value={row[col] || "CREDIT"}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs"
                                                        >
                                                            <option value="CREDIT">Credit</option>
                                                            <option value="REGULAR">Regular</option>
                                                            <option value="WALK-IN">Walk-in</option>
                                                        </select>
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
                                                            value={col === "todayDate" ? getCurrentDate() :
                                                                col === "pendingDaysNotDelivered" ?
                                                                    calculatePendingDays(row.bookingDate, row.status) :
                                                                    col === "gst" && row.gst && document.activeElement !== document.getElementById(`gst-input-${row.__origIndex}`)
                                                                        ? `${row.gst}%`
                                                                        : row[col] || ""
                                                            }
                                                            id={col === "gst" ? `gst-input-${row.__origIndex}` : undefined}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className={`w-full p-1 border rounded text-xs ${col === "todayDate" ? "bg-blue-50 border-blue-300" :
                                                                col === "pendingDaysNotDelivered" && row.status !== "DELIVERED" ? "bg-red-50 border-red-300" :
                                                                    col === "gst" && row.gst ? "bg-yellow-50 border-yellow-300" :
                                                                        (col === "location" || col === "destinationCity") &&
                                                                            row.location === row.destinationCity && row.location ?
                                                                            "bg-green-50 border-green-300" : ""
                                                                }`}
                                                            disabled={col === "awbNo" && row._awbExists || col === "todayDate" || col === "pendingDaysNotDelivered" || col === "valumetric" || col === "fuelSurcharge" || col === "gst" || col === "clientBillingValue"}
                                                            placeholder={col === "fuelSurcharge" && (!row.frCharge || row.frCharge === "0") ? "Enter FR Charge" : ""}
                                                            title={col === "gst" ? "Auto-calculated GST percentage" : 
                                                                col === "valumetric" ? "Auto-calculated from L/W/H" : 
                                                                col === "fuelSurcharge" ? `Auto-calculated from FR Charge (${row._fuelSurchargePercent || 0}%)`:
                                                                col === "clientBillingValue" ? "Auto-calculated from components" : ""
                                                            }
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 border-b">
                                                <button
                                                    onClick={() => handleSave(row.__origIndex)}
                                                    className="bg-blue-600 text-white px-3 cursor-pointer py-1 rounded text-xs hover:bg-blue-700"
                                                >
                                                    {loading ? "Saving..." : "Save"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-center">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToFirstPage}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100 disabled:hover:bg-transparent"
                                    title="First Page"
                                >
                                    <ChevronsLeft className="w-4 h-4 cursor-pointer" />
                                </button>
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100 disabled:hover:bg-transparent"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={currentPage}
                                        onChange={(e) => {
                                            const page = parseInt(e.target.value);
                                            if (!isNaN(page)) goToPage(page);
                                        }}
                                        className="w-12 p-1 text-gray-600 text-center border rounded text-sm"
                                    />
                                    <span className="text-gray-600">/</span>
                                    <span className="text-gray-600">{totalPages}</span>
                                </div>

                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100 disabled:hover:bg-transparent"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={goToLastPage}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded border text-gray-600 disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100 disabled:hover:bg-transparent"
                                    title="Last Page"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}