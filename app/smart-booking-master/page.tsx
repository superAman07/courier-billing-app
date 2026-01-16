'use client'

import { useEffect, useMemo, useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";
import UploadStatusExcelButton from "@/components/UploadStatusExcelButton";
import { debounce } from 'lodash';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Download, Plus, Users, Save, Trash2, Calendar, Filter, X, MapPin, UserCheck, Calculator } from 'lucide-react';

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
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isAutoMapping, setIsAutoMapping] = useState(false);
    const [isAutoMappingCustomers, setIsAutoMappingCustomers] = useState(false);
    const [isCalculatingRates, setIsCalculatingRates] = useState(false);

    const toggleSelection = (index: number) => {
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedIndices(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === paginatedRows.length) {
            setSelectedIndices(new Set());
        } else {
            const allIndices = new Set(paginatedRows.map(r => r.__origIndex));
            setSelectedIndices(allIndices);
        }
    };

    const handleDeleteRow = async (rowIndex: number) => {
        const row = tableRows[rowIndex];
        if(!confirm(`Are you sure you want to delete AWB ${row.awbNo}?`)) return;

        setLoading(true);
        try {
            if (row._bookingId) {
                await axios.delete(`/api/booking-master/${row._bookingId}`);
            }
            
            setTableRows(prev => prev.filter((_, i) => i !== rowIndex));
            toast.success("Row deleted.");
        } catch(e) {
            toast.error("Failed to delete row.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        const indices = Array.from(selectedIndices);
        if(!confirm(`Delete ${indices.length} selected bookings?`)) return;

        setLoading(true);
        try {
            const rowsToDelete = indices.map(i => tableRows[i]);
            const idsToDelete = rowsToDelete.map(r => r._bookingId).filter(Boolean);

            if (idsToDelete.length > 0) {
                 await Promise.all(idsToDelete.map(id => axios.delete(`/api/booking-master/${id}`)));
            }

            setTableRows(prev => prev.filter((_, i) => !selectedIndices.has(i)));
            setSelectedIndices(new Set());
            toast.success("Selected bookings deleted.");
        } catch(e) {
            toast.error("Failed to delete some bookings.");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoMapLocations = async () => {
        const missingLocationIndices = tableRows
            .map((row, idx) => ({ ...row, idx }))
            .filter(r => r.pin && r.pin.length === 6 && (!r.location || !r.destinationCity));

        if (missingLocationIndices.length === 0) {
            toast.info("All valid pincodes are already mapped!");
            return;
        }

        setIsAutoMapping(true);
        toast.info(`Starting auto-map for ${missingLocationIndices.length} rows...`);

        const BATCH_SIZE = 5;
        const DELAY_MS = 1000;

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        let updatedRows = [...tableRows];
        let processedCount = 0;

        for (let i = 0; i < missingLocationIndices.length; i += BATCH_SIZE) {
            const batch = missingLocationIndices.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (item) => {
                try {
                    const localPin = pincodeMaster.find(p => p.pincode === item.pin);
                    
                    if (localPin && localPin.city) {
                        updatedRows[item.idx].location = localPin.city.name;
                        updatedRows[item.idx].destinationCity = localPin.city.code;
                        updatedRows[item.idx].state = localPin.state?.name;
                    } else {
                        const { data } = await axios.get(`https://api.postalpincode.in/pincode/${item.pin}`);
                        if (data && data[0].Status === 'Success') {
                            const postOffice = data[0].PostOffice[0];
                            const cityName = postOffice.District; 
                            const stateName = postOffice.State;
                            const cityCode = getCityCode(cityName);
                            
                            updatedRows[item.idx].location = cityName;
                            updatedRows[item.idx].destinationCity = cityCode || cityName.substring(0, 3).toUpperCase();
                            updatedRows[item.idx].state = stateName;
                        }
                    }
                    processedCount++;
                } catch (e) {
                    console.warn(`Failed to map pin ${item.pin}`);
                }
            }));
            setTableRows([...updatedRows]);
            await delay(DELAY_MS);
        }

        setIsAutoMapping(false);
        toast.success(`Auto-mapping complete. Processed ${processedCount} locations.`);
    };

    const handleAutoMapCustomers = async () => {
        const visibleRows = paginatedRows;

        const rowsToMap = visibleRows.filter(r => 
            r.customerCode && 
            String(r.customerCode).trim() !== "" 
        );

        if (rowsToMap.length === 0) {
            toast.info("No customer codes found on this page to map.");
            return;
        }

        let masterData = customers;
        if (masterData.length === 0) {
            try {
                const { data } = await axios.get("/api/customers");
                masterData = data;
                setCustomers(data);
            } catch (e) {
                toast.error("Failed to load customer master data.");
                return;
            }
        }

        setIsAutoMappingCustomers(true);
        toast.loading(`Mapping ${rowsToMap.length} customers on this page...`);

        let updatedTableRows = [...tableRows];
        let mappedCount = 0;

        rowsToMap.forEach(row => {
            const originalIndex = row.__origIndex; 
            const codeSearch = String(row.customerCode).trim().toLowerCase();
            
            const match = masterData.find((c: any) => 
                c.customerCode.toLowerCase() === codeSearch || 
                (c.customerName && c.customerName.toLowerCase() === codeSearch)
            );
            
            if (match) {
                const targetRow = updatedTableRows[originalIndex];
                
                targetRow.customerId = match.id;
                targetRow.customerName = match.customerName;
                targetRow.childCustomer = match.childCustomer || match.customerName;
                targetRow.senderContactNo = match.mobile || match.phone || "";
                targetRow.senderDetail = match.customerName || "";
                targetRow.address = match.address || "";
                targetRow._fuelSurchargePercent = match.fuelSurchargePercent || 0;
                
                targetRow._gstPercent = getGSTPercentage(match.pincode || "", match.state);
                
                recalculateClientBilling(targetRow);
                
                mappedCount++;
            }
        });
        setTableRows(updatedTableRows);
        setIsAutoMappingCustomers(false);
        toast.dismiss();
        
        if (mappedCount > 0) {
            toast.success(`Successfully mapped/updated ${mappedCount} customers.`);
        } else {
            toast.warning(`No matching customers found in Master.`);
        }
    };

    const handleAutoCalculateRates = async () => {
        const visibleRows = paginatedRows;

        // Filter rows that are ready for calculation:
        // Must have: Customer ID, Pincode, Charge Weight, Mode
        const rowsToCalc = visibleRows.filter(r => 
            r.customerId && 
            r.pin && 
            parseFloat(r.chargeWeight) > 0 &&
            r.mode
        );

        if (rowsToCalc.length === 0) {
            toast.info("No rows ready for calculation (Check missing Customers, Pincodes, or Weights).");
            return;
        }

        setIsCalculatingRates(true);
        toast.info(`Calculating rates for ${rowsToCalc.length} rows...`);

        // Process in small batches to ensure server stability
        const BATCH_SIZE = 5;
        const delayedRows = [...tableRows];
        let successCount = 0;
        let failCount = 0;

        // Helper for batches
        for (let i = 0; i < rowsToCalc.length; i += BATCH_SIZE) {
            const batch = rowsToCalc.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (row) => {
                const idx = row.__origIndex;
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

                    // Update the row with fetched rates
                    delayedRows[idx] = {
                        ...delayedRows[idx],
                        frCharge: data.frCharge.toFixed(2),
                        waybillSurcharge: data.waybillSurcharge.toFixed(2),
                        otherExp: data.otherExp.toFixed(2),
                        serviceProvider: data.serviceProvider || delayedRows[idx].serviceProvider || "DTDC"
                    };

                    // Calculate Fuel Surcharge
                    const frCharge = parseFloat(data.frCharge) || 0;
                    const fuelPercent = delayedRows[idx]._fuelSurchargePercent || 0;
                    
                    if (frCharge > 0 && fuelPercent > 0) {
                         delayedRows[idx].fuelSurcharge = ((frCharge * fuelPercent) / 100).toFixed(2);
                    } else {
                         delayedRows[idx].fuelSurcharge = "0.00";
                    }

                    // Final Totals (GST + CBV)
                    // We call the local helper to ensure math consistency
                    delayedRows[idx] = recalculateClientBilling(delayedRows[idx]);
                    successCount++;

                } catch (error) {
                    console.error(`Rate calc failed for ${row.awbNo}`);
                    failCount++;
                }
            }));

            // Update UI after every batch so user sees progress
            setTableRows([...delayedRows]);
            // Small pause to breathe
            await new Promise(res => setTimeout(res, 200));
        }

        setIsCalculatingRates(false);
        if (successCount > 0) toast.success(`Rates calculated for ${successCount} bookings.`);
        if (failCount > 0) toast.warning(`${failCount} rows failed (Check Rate Master).`);
    };

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
        if (dateFilter.start && row.bookingDate < dateFilter.start) return false;
        if (dateFilter.end && row.bookingDate > dateFilter.end) return false;

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

    const cleanInputClass = (isReadOnly = false, specificColorClass = "") => `
        w-full h-full px-2 py-1.5 text-xs font-semibold
        border border-gray-300 rounded-sm
        ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-transparent text-gray-900 hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'} 
        transition-all duration-75 outline-none
        placeholder:text-gray-400
        ${specificColorClass}
    `;

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
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6 mb-4 sticky top-4 z-30">
                        <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center">
                            
                            {/* LEFT: FILTERS */}
                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Search..."
                                    />
                                    <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>

                                {/* DATE FILTERS */}
                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                    <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                                    <input 
                                        type="date" 
                                        value={dateFilter.start} 
                                        onChange={e => setDateFilter(prev => ({...prev, start: e.target.value}))}
                                        className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-1"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="date" 
                                        value={dateFilter.end} 
                                        onChange={e => setDateFilter(prev => ({...prev, end: e.target.value}))}
                                        className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-1"
                                    />
                                    {(dateFilter.start || dateFilter.end) && (
                                        <button onClick={() => setDateFilter({start:"", end:""})} className="p-1 hover:text-red-500 text-gray-400"><X className="w-3 h-3"/></button>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: ACTIONS */}
                            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                                {selectedIndices.size > 0 && (
                                    <button 
                                        onClick={handleDeleteSelected}
                                        className="flex items-center gap-2 cursor-pointer bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete ({selectedIndices.size})
                                    </button>
                                )}
                                <button onClick={handleDownload} className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors">
                                    <Download className="w-4 h-4" /> Excel
                                </button>
                                <button 
                                    onClick={handleSaveAll} 
                                    disabled={loading}
                                    className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
                                >
                                    {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Save className="w-4 h-4" />}
                                    Save All ({tableRows.length})
                                </button>
                                <button 
                                    onClick={handleAutoMapCustomers}
                                    disabled={isAutoMappingCustomers || loading}
                                    className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                        isAutoMappingCustomers 
                                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed" 
                                        : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                    }`}
                                >
                                    {isAutoMappingCustomers ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"/>
                                            Mapping...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="w-4 h-4" />
                                            Auto-Map Customers
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={handleAutoCalculateRates}
                                    disabled={isCalculatingRates || loading}
                                    className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                        isCalculatingRates 
                                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed" 
                                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    }`}
                                >
                                    {isCalculatingRates ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"/>
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="w-4 h-4" />
                                            Calc Rates
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={handleAutoMapLocations}
                                    disabled={isAutoMapping || loading}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                        isAutoMapping 
                                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed" 
                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    }`}
                                >
                                    {isAutoMapping ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"/>
                                            Mapping...
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="w-4 h-4" /> {/* Import MapPin from lucide-react */}
                                            Auto-Map Locations
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
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
                        <div className="overflow-auto max-h-[65vh] relative">
                            <table className="min-w-full text-left border-collapse">
                                <thead className="bg-slate-800 text-slate-200 sticky top-0 z-20 text-xs uppercase tracking-wider font-semibold shadow-md">
                                    <tr>
                                        <th className="px-3 py-3 border-b border-slate-700 w-10 text-center bg-slate-800 sticky left-0 z-30">
                                            <input type="checkbox" onChange={toggleSelectAll} checked={selectedIndices.size > 0 && selectedIndices.size === paginatedRows.length} />
                                        </th>
                                        {columns.map(col => (
                                            <th key={col} className="px-3 py-3 border-b border-slate-700 min-w-[120px] whitespace-nowrap">
                                                {COLUMN_MAP[col]}
                                            </th>
                                        ))}
                                        <th className="px-3 py-3 border-b border-slate-700 text-center bg-slate-800 sticky right-0 z-30 shadow-[-4px_0px_6px_-2px_rgba(0,0,0,0.2)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {paginatedRows.map((row) => (
                                        <tr key={row.__origIndex} className={`group hover:bg-blue-50/50 transition-colors ${row._awbExists ? "bg-amber-50/30" : "bg-white"}`}>
                                            <td className="px-1 py-1 border-r border-gray-300 text-center sticky left-0 bg-inherit z-10">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIndices.has(row.__origIndex)} 
                                                    onChange={() => toggleSelection(row.__origIndex)} 
                                                    className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            {columns.map(col => { 
                                                const bgClass = 
                                                    col === "todayDate" ? "text-blue-700 font-bold" :
                                                    col === "pendingDaysNotDelivered" && row.status !== "DELIVERED" ? "text-red-600 font-bold bg-red-50" :
                                                    col === "gst" ? "text-amber-700 font-medium" :
                                                    (col === "location" || col === "destinationCity") && row.location === row.destinationCity && row.location ? "text-green-700 font-bold" : 
                                                    col === "awbNo" ? "font-mono font-bold text-gray-900 tracking-wide" : "";

                                                return (
                                                    <td key={col} className={`px-0 py-0 border-r border-b border-gray-300 relative h-10 min-w-[100px]`}>
                                                        {["paymentStatus", "mode", "status", "delivered"].includes(col) ? (
                                                            <select
                                                                value={row[col] || ""}
                                                                onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                                className={cleanInputClass(false, "cursor-pointer bg-gray-50")}
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
                                                                className={cleanInputClass(false, "cursor-pointer bg-gray-50")}
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
                                                                className={cleanInputClass(false, bgClass)}
                                                            />
                                                        ) : col === "dsrNdxPaper" ? (
                                                            <select
                                                                value={row[col] || ""}
                                                                onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                                className={cleanInputClass(false, "cursor-pointer")}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="D">D (Dox)</option>
                                                                <option value="N">N (Non Dox)</option>
                                                            </select>
                                                        ) : col === "customerType" ? (
                                                            <select
                                                                value={row[col] || "CREDIT"}
                                                                onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                                className={cleanInputClass()}
                                                            >
                                                                <option value="CREDIT">Credit</option>
                                                                <option value="REGULAR">Regular</option>
                                                                <option value="WALK-IN">Walk-in</option>
                                                            </select>
                                                        ) : col === "customerCode" ? (
                                                            <div className="relative">
                                                                <input
                                                                    value={row[col] || ""}
                                                                    // onChange={e => handleEdit(row.__origIndex, col, e.target.value)}
                                                                    onChange={e => {
                                                                        handleEdit(row.__origIndex, col, e.target.value);
                                                                        handleCustomerSearch(row.__origIndex, e.target.value);
                                                                    }}
                                                                    className={cleanInputClass()}
                                                                    placeholder="Search..."
                                                                />
                                                                {customerSuggestions[row.__origIndex]?.length > 0 && (
                                                                    <div className="absolute top-10 left-0 z-50 w-64 bg-white border rounded shadow-xl max-h-48 overflow-y-auto">
                                                                        {customerSuggestions[row.__origIndex].map(customer => (
                                                                            <div 
                                                                                key={customer.id} 
                                                                                onClick={() => handleCustomerSelect(row.__origIndex, customer)} 
                                                                                className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b border-gray-100 flex flex-col gap-1 transition-colors"
                                                                            >
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="font-bold text-blue-700">{customer.customerName}</span>
                                                                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                                                        {customer.customerCode}
                                                                                    </span>
                                                                                </div>

                                                                                {customer.childCustomer && customer.childCustomer !== customer.customerName && (
                                                                                    <div className="text-gray-800 font-medium">
                                                                                        Branch: {customer.childCustomer}
                                                                                    </div>
                                                                                )}

                                                                                <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                                                                                    <span className="truncate max-w-[200px]">
                                                                                        {customer.city ? customer.city : 'No City'} 
                                                                                        {customer.address ? ` - ${customer.address.substring(0, 25)}...` : ''}
                                                                                    </span>
                                                                                </div>
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
                                                                className={cleanInputClass(
                                                                    col === "awbNo" && row._awbExists || col === "todayDate" || col === "pendingDaysNotDelivered" || col === "valumetric" || col === "fuelSurcharge" || col === "gst" || col === "clientBillingValue" || col === "customerName" || col === "childCustomer", bgClass
                                                                )}
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
                                                )}
                                            )}
                                            <td className="px-2 py-1 border-l border-gray-200 text-center sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-4px_0px_6px_-2px_rgba(0,0,0,0.05)] z-10 w-[100px]">
                                                <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleSave(row.__origIndex)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Save">
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteRow(row.__origIndex)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
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