'use client'

import { useEffect, useMemo, useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";
import UploadStatusExcelButton from "@/components/UploadStatusExcelButton";
import { debounce } from 'lodash';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Download, Plus, Users, Save } from 'lucide-react';

const columns = [
    "srNo", "bookingDate", "awbNo", "serviceProvider", "location", "destinationCity", "mode", "pcs", "pin",
    "dsrContents", "dsrNdxPaper", "invoiceValue", "length", "width", "height", "valumetric", "actualWeight", "chargeWeight", "frCharge", "invoiceWt",
    "fuelSurcharge", "shipperCost", "waybillSurcharge", "otherExp", "gst", "clientBillingValue",
    "customerCode", "customerName", "childCustomer", "customerAttendBy", "senderDetail", "senderContactNo", "address",
    "creditCustomerAmount", "regularCustomerAmount", "customerType",
    "paymentStatus", "adhaarNo", "status", "statusDate", "pendingDaysNotDelivered", "receiverName",
    "receiverContactNo", "ref", "delivered", "dateOfDelivery", "todayDate"
];

const COLUMN_MAP: Record<string, string> = {
    srNo: "SR NO.", bookingDate: "Booking Date", awbNo: "Docket", serviceProvider: "Provider", location: "Location",
    destinationCity: "Destination", mode: "Mode", pcs: "No of Pcs", pin: "Pincode",
    dsrContents: "Content", dsrNdxPaper: "Dox / Non Dox", invoiceValue: "Material Value",
    actualWeight: "FR Weight", chargeWeight: "Charge Weight", frCharge: "FR Charge", fuelSurcharge: "Fuel Surcharge",
    shipperCost: "Shipper Cost", waybillSurcharge: "Waybill Surcharge", otherExp: "Other Exp", gst: "GST", length: "Length", width: "Width", height: "Height", valumetric: "Valumatric",
    invoiceWt: "Invoice Wt", clientBillingValue: "Client Billing Value",

    customerCode: "Customer Code",
    customerName: "Customer Name",
    childCustomer: "Child Customer",
    customerAttendBy: "Customer Attend By",
    senderDetail: "Sender Detail",
    senderContactNo: "Sender Contact No",
    address: "Address",

    creditCustomerAmount: "Credit Cust.  Amt", regularCustomerAmount: "Regular Cust. Amt",
    customerType: "Customer Type", paymentStatus: "PAYMENT STATUS",
    adhaarNo: "Adhaar No", status: "STATUS", statusDate: "Status Date",
    pendingDaysNotDelivered: "Pending Days", receiverName: "Receiver Name",
    receiverContactNo: "Receiver Contact No", ref: "Ref", delivered: "DELIVERED",
    dateOfDelivery: "Date of Delivery", todayDate: "Today Date"
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
    customerCode: ["Customer Code", "CustomerCode", "Code"],
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
        const waybillSurcharge = parseFloat(row.waybillSurcharge) || 0;
        const otherExp = parseFloat(row.otherExp) || 0;
        const gstPercent = row._gstPercent || 0;

        const subtotal = frCharge + fuelSurcharge + shipperCost + waybillSurcharge + otherExp;
        const gstAmount = (subtotal * gstPercent) / 100;
        const clientBillingValue = subtotal + gstAmount;

        const updatedRow = { ...row };
        updatedRow.gst = gstAmount.toFixed(2);
        updatedRow.clientBillingValue = clientBillingValue.toFixed(2);
        return updatedRow;
    };

    const debouncedRateCalculation = debounce(async (idx: number, row: any) => {
        if (!row.customerId || !row.pin || !row.chargeWeight || !row.mode) {
            return;
        }

        try {
            const { data } = await axios.post('/api/calculate-rate', {
                customerId: row.customerId,
                destinationPincode: row.pin,
                chargeWeight: row.chargeWeight,
                isDox: row.dsrNdxPaper === 'D',
                mode: row.mode,
                invoiceValue: row.invoiceValue,
                state: row.state,
            });

            setTableRows(rows =>
                rows.map((r, i) => {
                    if (i !== idx) return r;
                    let updatedRow = {
                        ...r, 
                        frCharge: data.frCharge.toFixed(2),
                        waybillSurcharge: data.waybillSurcharge.toFixed(2),
                        otherExp: data.otherExp.toFixed(2),
                        serviceProvider: data.serviceProvider || "DTDC"
                    };

                    const frCharge = parseFloat(updatedRow.frCharge) || 0;
                    const fuelSurchargePercent = updatedRow._fuelSurchargePercent || 0;
                    updatedRow.fuelSurcharge = frCharge > 0 ? ((frCharge * fuelSurchargePercent) / 100).toFixed(2) : "0.00";

                    return recalculateClientBilling(updatedRow);
                })
            );
            toast.success(`Rate calculated for AWB #${row.awbNo}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Could not calculate rate.";
            toast.error(errorMessage, { id: `rate-error-${row.awbNo}` });
        }
    }, 800);

    const debouncedPincodeLookup = debounce(async (idx: number, pincode: string) => {
        if (pincode.length !== 6) return;

        toast.info(`Searching for pincode: ${pincode}...`);
        try {
            const { data } = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);

            if (data && data[0].Status === 'Success') {
                const postOffice = data[0].PostOffice[0];
                const cityName = postOffice.District;
                const stateName = postOffice.State;
                const cityCode = getCityCode(cityName);

                setTableRows(rows => {
                    const newRows = rows.map((row, i) => {
                        if (i !== idx) return row;
                        // Save state to the row
                        return { ...row, location: cityName, destinationCity: cityCode, state: stateName };
                    });
                    
                    // Trigger rate calculation immediately with the new state
                    const updatedRow = newRows[idx];
                    if (updatedRow.customerId && updatedRow.chargeWeight) {
                        debouncedRateCalculation(idx, updatedRow);
                    }
                    
                    return newRows;
                });
                toast.success(`Location found: ${cityName}, ${stateName}`);
            } else {
                toast.warning(`No location found for pincode: ${pincode}`);
            }
        } catch (error) {
            toast.error("Pincode API request failed.");
            console.error("Pincode lookup error:", error);
        }
    }, 800);

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

    const handleAddRow = () => {
        const newRow = {
            __origIndex: tableRows.length, // A temporary unique index
            srNo: tableRows.length + 1,
            bookingDate: new Date().toISOString().split('T')[0],
            awbNo: "",
            serviceProvider: "DTDC",
            location: "",
            destinationCity: "",
            mode: "SURFACE",
            pcs: 1,
            pin: "",
            dsrContents: "",
            dsrNdxPaper: "N",
            invoiceValue: 0,
            actualWeight: 0,
            chargeWeight: 0,
            frCharge: 0,
            fuelSurcharge: 0,
            shipperCost: 0,
            otherExp: 0,
            gst: 0,
            length: 0,
            width: 0,
            height: 0,
            valumetric: 0,
            invoiceWt: 0,
            clientBillingValue: 0,
            customerCode: "",
            customerName: "",
            childCustomer: "",
            customerAttendBy: "",
            senderDetail: "",
            senderContactNo: "",
            address: "",
            creditCustomerAmount: 0,
            regularCustomerAmount: 0,
            customerType: "CREDIT",
            paymentStatus: "UNPAID",
            status: "BOOKED",
            statusDate: null,
            pendingDaysNotDelivered: 0,
            receiverName: "",
            receiverContactNo: "",
            ref: "",
            delivered: "NO",
            dateOfDelivery: null,
            todayDate: getCurrentDate(),
            _awbExists: false,
        };

        setTableRows(prevRows => [newRow, ...prevRows]);
        toast.success("New booking row added. Fill in the details and click Save.");
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
        SF: "SURFACE",
        A: "AIR",
        AR: "AIR",
        P: "PREMIUM",
        R: "RAIL",
        O: "OTHER MODE"
    };
    const handleImport = async (rows: any[]) => {
        setLoading(true);
        toast.info("Processing imported file...");

        let customerData: any[] = [];
        try {
            const { data } = await axios.get("/api/customers");
            customerData = data;
            setCustomers(data);
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

            const importedCustomerCode = row['Customer Code'] || row['CustomerCode'];

            if (importedCustomerCode) {
                // Find matching customer
                const matchingCustomer = customerData.find(
                    (c: any) => c.customerCode?.toLowerCase() === importedCustomerCode.toString().trim().toLowerCase()
                );

                if (matchingCustomer) {
                    // Auto-fill customer details
                    mapped.customerCode = matchingCustomer.customerCode;
                    mapped.customerId = matchingCustomer.id;
                    mapped.customerName = matchingCustomer.customerName;
                    mapped.childCustomer = matchingCustomer.childCustomer || matchingCustomer.customerName;
                    mapped.customerAttendBy = "";
                    mapped.senderContactNo = matchingCustomer.mobile || matchingCustomer.phone || "";
                    mapped.senderDetail = matchingCustomer.customerName || "";
                    mapped._fuelSurchargePercent = matchingCustomer.fuelSurchargePercent || 0;
                    mapped._gstPercent = getGSTPercentage(matchingCustomer.pincode || "", matchingCustomer.state);
                    mapped.address = matchingCustomer.address || "";
                }
            }

            columns.forEach(col => {
                if (col === "srNo") return;
                const customerFields = ["customerId", "customerName", "childCustomer", "fuelSurcharge", "receiverName"];
                if (customerFields.includes(col)) {
                    if (!mapped[col]) mapped[col] = "";
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

        const calculatedRows = await Promise.all(mappedRows.map(async (row) => {
            // Check if we have enough info to calculate
            if (row.customerId && row.pin && row.chargeWeight && row.mode) {
                try {
                    const { data } = await axios.post('/api/calculate-rate', {
                        customerId: row.customerId,
                        destinationPincode: row.pin,
                        chargeWeight: row.chargeWeight,
                        isDox: row.dsrNdxPaper === 'D',
                        mode: row.mode,
                        invoiceValue: row.invoiceValue,
                        state: row.state,
                    });

                    let updatedRow = {
                        ...row,
                        frCharge: data.frCharge.toFixed(2),
                        waybillSurcharge: data.waybillSurcharge.toFixed(2),
                        otherExp: data.otherExp.toFixed(2),
                        serviceProvider: data.serviceProvider || "DTDC"
                    };

                    const frCharge = parseFloat(updatedRow.frCharge) || 0;
                    const fuelSurchargePercent = updatedRow._fuelSurchargePercent || 0;
                    updatedRow.fuelSurcharge = frCharge > 0 ? ((frCharge * fuelSurchargePercent) / 100).toFixed(2) : "0.00";

                    return recalculateClientBilling(updatedRow);
                } catch (error) {
                    console.error(`Calculation failed for row ${row.srNo}`, error);
                    return row; // Return original row if calculation fails
                }
            }
            return row; // Return original row if missing data
        }));

        try {
            toast.info(`Saving ${calculatedRows.length} bookings to database...`);
            const { data: createResult } = await axios.post('/api/booking-master/bulk-create', calculatedRows);
            toast.success("Imported and saved! Review the rows below.");
            
            const rowsForDisplay = calculatedRows.map((r, i) => ({
                ...r,
                _awbExists: true,
                srNo: i + 1
            }));
            
            setTableRows(rowsForDisplay); 

        } catch (error: any) {
            console.error("Bulk save failed:", error);
            toast.error("Saved locally but DB sync failed. Please click Save All.");
            setTableRows(calculatedRows);
        }

        setLoading(false);

        // if (mappedRows.length > 0) {
        //     try {
        //         toast.info(`Saving/Updating ${mappedRows.length} bookings in the database...`);
        //         const { data: createResult } = await axios.post('/api/booking-master/bulk-create', mappedRows); // Send all mappedRows
        //         toast.success(createResult.message || `${createResult.count} bookings processed successfully.`);

        //         await fetchUnassignedBookings();
        //     } catch (error: any) {
        //         console.error("Bulk booking creation/update failed:", error);
        //         toast.error(error.response?.data?.error || "Failed to save/update bookings.");
        //         setTableRows(mappedRows);
        //     }
        // } else {
        //     toast.info("No data to import.");
        // }

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

    const getGSTPercentage = (customerPincode: string, customerState?: string): number => {
        // // 1. Use the provided state if available
        // let stateName = customerState;

        // // 2. Fallback: If state not provided, try looking it up in local PincodeMaster
        // if (!stateName && customerPincode) {
        //     const pincodeData = pincodeMaster.find(p => p.pincode === customerPincode);
        //     stateName = pincodeData?.state?.name || "";
        // }

        // if (!stateName) return 0; // If we still don't know the state, we can't calculate GST

        // if (stateName.toLowerCase() === companyState.toLowerCase()) {
        //     const sgstTax = taxMaster.find(tax => tax.taxCode === 'SGST');
        //     const cgstTax = taxMaster.find(tax => tax.taxCode === 'CGST');

        //     const sgstRate = sgstTax ? parseFloat(sgstTax.ratePercent) : 9;
        //     const cgstRate = cgstTax ? parseFloat(cgstTax.ratePercent) : 9;
        //     const totalRate = sgstRate + cgstRate;

        //     console.log(`📍 Intra-state GST: SGST(${sgstRate}%) + CGST(${cgstRate}%) = ${totalRate}%`);
        //     return totalRate;
        // } else {
        //     const igstTax = taxMaster.find(tax => tax.taxCode === 'IGST');
        //     const igstRate = igstTax ? parseFloat(igstTax.ratePercent) : 18;

        //     console.log(`🌍 Inter-state GST: IGST(${igstRate}%)`);
        //     return igstRate;
        // }
        return 18;
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

            const exactMatch = data.find(
                (c: any) => c.customerCode?.toLowerCase() === searchTerm.trim().toLowerCase()
            );

            if (exactMatch) {
                handleCustomerSelect(idx, exactMatch);
                setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
                return;
            }

            setCustomerSuggestions(prev => ({ ...prev, [idx]: data }));
        } catch (error) {
            console.error("Error searching customers:", error);
        }
    }, 300);

    const handleCustomerSelect = async (idx: number, customer: any) => {
        const originalRow = tableRows[idx];

        const gstPercentage = getGSTPercentage(customer.pincode || "", customer.state);
        let updatedRow = {
            ...originalRow,
            customerCode: customer.customerCode,
            customerId: customer.id,
            customerName: customer.customerName,
            childCustomer: customer.childCustomer || customer.customerName,
            customerAttendBy: "",
            senderContactNo: customer.mobile || customer.phone || "",
            senderDetail: customer.customerName || "",
            _fuelSurchargePercent: customer.fuelSurchargePercent || 0,
            _gstPercent: gstPercentage,
            address: customer.address || "",
            shipperCost: customer.defaultShipperCost || 0,
            todayDate: getCurrentDate(),
        };

        setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
        toast.success(`Customer ${customer.customerName} selected. Calculating rates...`);

        if (updatedRow.pin && updatedRow.chargeWeight > 0 && updatedRow.mode) {
            try {
                const { data } = await axios.post('/api/calculate-rate', {
                    customerId: updatedRow.customerId,
                    destinationPincode: updatedRow.pin,
                    chargeWeight: updatedRow.chargeWeight,
                    isDox: updatedRow.dsrNdxPaper === 'D',
                    mode: updatedRow.mode,
                    invoiceValue: updatedRow.invoiceValue,
                    state: updatedRow.state,
                });

                updatedRow.frCharge = data.frCharge.toFixed(2);
                updatedRow.waybillSurcharge = data.waybillSurcharge.toFixed(2);
                updatedRow.otherExp = data.otherExp.toFixed(2);
                const frCharge = parseFloat(updatedRow.frCharge) || 0;
                const fuelSurchargePercent = updatedRow._fuelSurchargePercent || 0;
                updatedRow.fuelSurcharge = frCharge > 0 ? ((frCharge * fuelSurchargePercent) / 100).toFixed(2) : "0.00";

                updatedRow = recalculateClientBilling(updatedRow);
                toast.success(`Rate calculated (Sector: ${data.calculatedSector})`);

            } catch (error: any) {
                const errorMessage = error.response?.data?.error || "Could not calculate rate.";
                toast.error(errorMessage, { id: `rate-error-${updatedRow.awbNo}` });
            }
        }
        const frCharge = parseFloat(updatedRow.frCharge) || 0;
        const fuelSurchargePercent = updatedRow._fuelSurchargePercent || 0;
        updatedRow.fuelSurcharge = frCharge > 0 ? ((frCharge * fuelSurchargePercent) / 100).toFixed(2) : "0.00";

        const finalRow = recalculateClientBilling(updatedRow);

        setTableRows(rows =>
            rows.map((row, i) => (i === idx ? finalRow : row))
        );
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        setTableRows(rows =>
            rows.map((row, i) => {
                if (i !== idx) return row;
                let updated = { ...row, [field]: value };
                if (field === "pin") {
                    debouncedPincodeLookup(idx, value);
                }

                if (field === "serviceProvider" || field === "invoiceValue") {
                    const provider = field === "serviceProvider" ? value : updated.serviceProvider;
                    const invValue = parseFloat(field === "invoiceValue" ? value : updated.invoiceValue) || 0;
                    
                    if (provider === "DTDC" && invValue > 49999) {
                        updated.waybillSurcharge = (invValue * 0.002).toFixed(2);
                    } else {
                        updated.waybillSurcharge = "0.00";
                    }
                }

                const rateTriggerFields = ["pin", "chargeWeight", "actualWeight", "dsrNdxPaper"];
                if (rateTriggerFields.includes(field) || (field === "customerCode" && !value)) {
                    debouncedRateCalculation(idx, updated);
                }

                if (field === "frCharge") {
                    const frCharge = parseFloat(value) || 0;
                    const fuelSurchargePercent = updated._fuelSurchargePercent || 0;
                    if (frCharge > 0 && fuelSurchargePercent > 0) {
                        updated.fuelSurcharge = ((frCharge * fuelSurchargePercent) / 100).toFixed(2);
                    } else {
                        updated.fuelSurcharge = "0.00";
                    }
                }

                if (["frCharge", "shipperCost", "otherExp", "waybillSurcharge", "serviceProvider", "invoiceValue", "fuelSurcharge"].includes(field)) {
                    updated = recalculateClientBilling(updated);
                }

                if (field === "actualWeight" || field === "chargeWeight") {
                    const actualWeight = field === "actualWeight" ? parseFloat(value) || 0 : parseFloat(updated.actualWeight) || 0;
                    const chargeWeight = field === "chargeWeight" ? parseFloat(value) || 0 : parseFloat(updated.chargeWeight) || 0;
                    updated.invoiceWt = Math.max(actualWeight, chargeWeight).toFixed(2);
                }

                const weightTriggerFields = ["length", "width", "height", "actualWeight"];
                if (weightTriggerFields.includes(field)) {
                    const l = parseFloat(updated.length) || 0;
                    const w = parseFloat(updated.width) || 0;
                    const h = parseFloat(updated.height) || 0;
                    const actualWeight = parseFloat(updated.actualWeight) || 0;
                    let volumetricWeight = 0;

                    if (l > 0 && w > 0 && h > 0) {
                        volumetricWeight = parseFloat(((l * w * h) / 5000).toFixed(2));
                        updated.valumetric = volumetricWeight.toFixed(2);
                    } else {
                        updated.valumetric = "0.00";
                    }

                    updated.chargeWeight = Math.max(actualWeight, volumetricWeight).toFixed(2);
                    updated.invoiceWt = updated.chargeWeight;
                }
                console.log(updated.valumetric);
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
            setLoading(false);
            return;
        }
        const currentPendingDays = calculatePendingDays(row.bookingDate, row.status);
        const cleanRow = { 
            ...row,
            serviceProvider: row.serviceProvider || "DTDC",
            pendingDaysNotDelivered: currentPendingDays 
        };
        delete cleanRow._awbExists;
        delete cleanRow._bookingId;
        delete cleanRow.__origIndex;
        delete cleanRow.customerName;
        delete cleanRow._fuelSurchargePercent;
        delete cleanRow._gstPercent;

        cleanRow.bookingDate = new Date(cleanRow.bookingDate);
        cleanRow.statusDate = cleanRow.statusDate ? new Date(cleanRow.statusDate) : null;
        cleanRow.dateOfDelivery = cleanRow.dateOfDelivery ? new Date(cleanRow.dateOfDelivery) : null;
        cleanRow.todayDate = cleanRow.todayDate ? new Date(cleanRow.todayDate) : new Date();

        ["pcs", "invoiceValue", "actualWeight", "chargeWeight", "frCharge", "fuelSurcharge",
            "shipperCost", "waybillSurcharge", "otherExp", "gst", "valumetric", "invoiceWt",
            "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
            "pendingDaysNotDelivered", "length", "width", "height"].forEach(field => {
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
                const { data } = await axios.post("/api/booking-master", cleanRow);
                setTableRows(rows => rows.map((r, i) => i === idx ? { ...r, _awbExists: true, _bookingId: data.id } : r));
                toast.success("Booking created successfully!");
            }
            if (cleanRow.awbNo) {
                await axios.put('/api/docket-stock', { awbNo: cleanRow.awbNo, status: 'USED' });
            }
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error("Failed to save booking");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (tableRows.length === 0) return;
        
        setLoading(true);
        try {
            // Filter out rows that are already saved (if you want) or just save everything
            // For now, let's save everything currently in the table
            
            // Prepare data: remove UI-only flags
            const rowsToSave = tableRows.map(row => {
                const cleanRow = { ...row };
                // Ensure defaults
                cleanRow.serviceProvider = cleanRow.serviceProvider || "DTDC";
                cleanRow.pendingDaysNotDelivered = calculatePendingDays(cleanRow.bookingDate, cleanRow.status);
                
                // Remove internal flags
                delete cleanRow._awbExists;
                delete cleanRow._bookingId;
                delete cleanRow.__origIndex;
                delete cleanRow.customerName;
                delete cleanRow._fuelSurchargePercent;
                delete cleanRow._gstPercent;

                // Fix dates
                cleanRow.bookingDate = new Date(cleanRow.bookingDate);
                cleanRow.statusDate = cleanRow.statusDate ? new Date(cleanRow.statusDate) : null;
                cleanRow.dateOfDelivery = cleanRow.dateOfDelivery ? new Date(cleanRow.dateOfDelivery) : null;
                cleanRow.todayDate = cleanRow.todayDate ? new Date(cleanRow.todayDate) : new Date();

                // Ensure numbers
                ["pcs", "invoiceValue", "actualWeight", "chargeWeight", "frCharge", "fuelSurcharge",
                "shipperCost", "waybillSurcharge", "otherExp", "gst", "valumetric", "invoiceWt",
                "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
                "pendingDaysNotDelivered", "length", "width", "height"].forEach(field => {
                     if (cleanRow[field]) cleanRow[field] = Number(cleanRow[field]);
                });
                
                return cleanRow;
            });

            const { data: createResult } = await axios.post('/api/booking-master/bulk-create', rowsToSave);
            toast.success(createResult.message || "All bookings saved successfully!");
            
            // Refresh to get IDs and confirm saved state
            await fetchUnassignedBookings();

        } catch (error: any) {
            console.error("Bulk save failed:", error);
            toast.error(error.response?.data?.error || "Failed to save bookings.");
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
    
    const handleDownloadSample = () => {
        window.open("/api/booking-master/sample-import", "_blank");
    };

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
            <div className="flex items-center justify-between mb-6 w-full">
                <div className="w-full">
                    <h1 className="text-3xl font-bold text-gray-900">Smart Booking Master</h1>
                    <div className="flex justify-between max-w-full">
                        <p className="text-lg font-semibold text-purple-900">Bulk Import & Edit Bookings</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleDownloadSample} 
                                className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-sm text-sm"
                                title="Download a sample Excel file to see the correct format"
                            >
                                <FileDown className="w-4 h-4" />
                                Sample Format
                            </button>
                            <button onClick={handleAddRow} className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                                <Plus className="w-5 h-5" />
                                Add New Booking
                            </button>
                        </div>
                    </div>
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
                        {tableRows.length > 0 && (
                            <button 
                                onClick={handleSaveAll} 
                                disabled={loading}
                                className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ml-3 shadow-md"
                            >
                                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Save className="w-5 h-5" />}
                                Save All ({tableRows.length})
                            </button>
                        )}
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
                                                    ) : col === "serviceProvider" ? (
                                                        <select
                                                            value={row[col] || "DTDC"}
                                                            onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                            className="w-full p-1 border rounded text-xs bg-white"
                                                        >
                                                            <option value="DTDC">DTDC</option>
                                                            <option value="Trackon">Trackon</option>
                                                            <option value="Others">Others</option>
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
                                                                <div className="absolute top-full left-0 z-[9999] w-64 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                                                    row[col] || ""
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
                                                            disabled={col === "awbNo" && row._awbExists || col === "todayDate" || col === "pendingDaysNotDelivered" || col === "valumetric" || col === "fuelSurcharge" || col === "gst" || col === "clientBillingValue" || col === "customerName" || col === "childCustomer"}
                                                            placeholder={col === "fuelSurcharge" && (!row.frCharge || row.frCharge === "0") ? "Enter FR Charge" : ""}
                                                            title={col === "gst" ? "Auto-calculated GST percentage" :
                                                                col === "valumetric" ? "Auto-calculated from L/W/H" :
                                                                    col === "fuelSurcharge" ? `Auto-calculated from FR Charge (${row._fuelSurchargePercent || 0}%)` :
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