'use client'

import { useEffect, useMemo, useState, useRef } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import { toast } from "sonner";
import axios from "axios";
import { parseDateString } from "@/lib/convertDateInJSFormat";
import { handleDownload } from "@/lib/downloadExcel";
import UploadStatusExcelButton from "@/components/UploadStatusExcelButton";
import { debounce } from 'lodash';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Download, Plus, Users, Save, Trash2, Calendar, Filter, X, MapPin, UserCheck, Calculator, AlertTriangle, Info } from 'lucide-react';

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
    dsrNdxPaper: ["Dox / Non Dox", "D / N", "Doc Type", "Dox/Non-Dox"],
    dsrContents: ["DSR_CONTENTS", "Content"],
    length: ["Length", "L"],
    width: ["Width", "W"],
    height: ["Height", "H"],
    customerCode: ["Customer Code", "CustomerCode", "Code"],
    serviceProvider: ["Provider", "Service Provider", "Courier", "Service"],
};

const parseImportedDate = (dateVal: any): string => {
    if (!dateVal) return "";
    
    if (typeof dateVal === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const dt = new Date(excelEpoch.getTime() + dateVal * 86400000);
        return dt.toISOString().split('T')[0];
    }

    const str = String(dateVal).trim();

    // 1. Handle YYYY/MM/DD or YYYY-MM-DD
    const yyyymmddRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/;
    const yyyyMatch = str.match(yyyymmddRegex);
    if (yyyyMatch) {
         return `${yyyyMatch[1]}-${yyyyMatch[2].padStart(2, '0')}-${yyyyMatch[3].padStart(2, '0')}`;
    }
    
    // 2. Handle DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const match = str.match(ddmmyyyyRegex);
    
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }

    const isoMatch = str.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];

    // Fallback
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return "";
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
    const [companyState, setCompanyState] = useState<string>("delhi");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalPages, setTotalPages] = useState(1);
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isAutoMapping, setIsAutoMapping] = useState(false);
    const [isAutoMappingCustomers, setIsAutoMappingCustomers] = useState(false);
    const [isCalculatingRates, setIsCalculatingRates] = useState(false);

    // const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [showCBVDiagnostics, setShowCBVDiagnostics] = useState(false);
    const [hasCalcRatesRun, setHasCalcRatesRun] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const cancelImportRef = useRef(false);

    const handleCancelImport = () => {
        cancelImportRef.current = true;
    };

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
        if (!confirm(`Are you sure you want to delete AWB ${row.awbNo}?`)) return;

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

        let updatedRows = [...tableRows];
        let processedCount = 0;

                // Collect all unique pincodes that need lookup
        const uniquePins = [...new Set(missingLocationIndices.map(item => item.pin))];
        
        // Single bulk lookup from our local DB
        let pinMap: Record<string, { city: string; cityCode: string; state: string, stateCode: string }> = {};
        try {
            const { data } = await axios.post('/api/pincode-master/bulk-lookup', { pincodes: uniquePins });
            pinMap = data;
        } catch (e) {
            console.warn("Bulk lookup failed, will skip mapping");
        }

        // Apply results instantly — no batching or delays needed!
        missingLocationIndices.forEach(item => {
            const match = pinMap[item.pin];
            if (match) {
                updatedRows[item.idx].location = match.city;
                updatedRows[item.idx].destinationCity = match.stateCode || match.state.substring(0, 2).toUpperCase();
                updatedRows[item.idx].state = match.state;
                processedCount++;
            }
        });
        setTableRows([...updatedRows]);

        setIsAutoMapping(false);
        toast.success(`Auto-mapping complete. Processed ${processedCount} locations.`);
    };
    const handleAutoMapCustomers = async () => {
        const visibleRows = filteredRows;

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
        toast.loading(`Mapping ${rowsToMap.length} customers... (${tableRows.length - rowsToMap.length} already mapped)`, { id: 'map-customers' });

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
        toast.dismiss('map-customers');
        
        if (mappedCount > 0) {
            toast.success(`Successfully mapped/updated ${mappedCount} customers.`);
        } else {
            toast.warning(`No matching customers found in Master.`);
        }
    };
    const handleAutoCalculateRates = async () => {
        const visibleRows = filteredRows;
        
        const rowsToCalc = visibleRows.filter(r => 
            r.customerId && r.pin && parseFloat(r.chargeWeight) > 0 && r.mode
        );

        if (rowsToCalc.length === 0) {
            toast.info("No rows ready for calculation.");
            return;
        }

        setIsCalculatingRates(true);

        try {
            // 1. Prepare all items for calculation
            const items = rowsToCalc.map(row => ({
                customerId: row.customerId,
                destinationPincode: row.pin,
                chargeWeight: row.chargeWeight,
                isDox: row.dsrNdxPaper === 'D',
                mode: row.mode,
                invoiceValue: row.invoiceValue,
                state: row.state,
                city: row.location
            }));

            let updatedRows = [...tableRows];
            let successCount = 0;
            let failCount = 0;
            
            // 2. BATCHING LOGIC (Send 50 rows at a time to prevent DB crash)
            const BATCH_SIZE = 50; 
            const totalBatches = Math.ceil(items.length / BATCH_SIZE);

            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const batchItems = items.slice(i, i + BATCH_SIZE);
                const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
                
                toast.loading(`Calculating rates: Batch ${currentBatchNum} of ${totalBatches}... (${successCount + failCount}/${items.length})`, { id: 'calc-rates' });

                // Call the API with just this batch of 50
                const { data } = await axios.post('/api/calculate-rate/batch', { items: batchItems });
                
                // Process results
                for (const result of data.results) {
                    // result.index is relative to the batch (0 to 49)
                    // We add 'i' to get the true index in the 'rowsToCalc' array
                    const origRow = rowsToCalc[i + result.index];
                    const idx = origRow.__origIndex;
                    
                    if (result.success) {
                        updatedRows[idx] = {
                            ...updatedRows[idx],
                            frCharge: result.frCharge.toFixed(2),
                            waybillSurcharge: result.waybillSurcharge.toFixed(2),
                            otherExp: result.otherExp.toFixed(2),
                            serviceProvider: result.serviceProvider || updatedRows[idx].serviceProvider || "DTDC"
                        };

                        const frCharge = parseFloat(result.frCharge) || 0;
                        const fuelPercent = updatedRows[idx]._fuelSurchargePercent || 0;
                        updatedRows[idx].fuelSurcharge = (frCharge > 0 && fuelPercent > 0)
                            ? ((frCharge * fuelPercent) / 100).toFixed(2)
                            : "0.00";

                        updatedRows[idx] = recalculateClientBilling(updatedRows[idx]);
                        successCount++;
                    } else {
                        failCount++;
                    }
                }
                
                // Fast UI update after every batch
                setTableRows([...updatedRows]);
            }
            
            toast.dismiss('calc-rates');
            setHasCalcRatesRun(true);

            if (successCount > 0) toast.success(`Rates calculated for ${successCount} bookings.`);
            if (failCount > 0) toast.warning(`${failCount} rows failed (Check Rate Master).`);

        } catch (error) {
            console.error("Batch rate error:", error);
            toast.dismiss('calc-rates');
            toast.error("Failed to calculate rates.");
        } finally {
            setIsCalculatingRates(false);
        }
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
                city: row.location 
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

        try {
            const { data: pinMap } = await axios.post('/api/pincode-master/bulk-lookup', { pincodes: [pincode] });
            const match = pinMap[pincode];

            if (match) {
                const cityCode = match.stateCode || match.state.substring(0, 2).toUpperCase();

                setTableRows(rows => {
                    const newRows = rows.map((row, i) => {
                        if (i !== idx) return row;
                        return { ...row, location: match.city, destinationCity: cityCode, state: match.state };
                    });
                    
                    const updatedRow = newRows[idx];
                    if (updatedRow.customerId && updatedRow.chargeWeight) {
                        debouncedRateCalculation(idx, updatedRow);
                    }
                    
                    return newRows;
                });
                toast.success(`Location found: ${match.city}, ${match.state}`);
            } else {
                toast.warning(`No location found for pincode: ${pincode}`);
            }
        } catch (error) {
            toast.error("Pincode lookup failed.");
            console.error("Pincode lookup error:", error);
        }
    }, 300);

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
    // const handleImport = async (rows: any[]) => {
    //     setLoading(true);
    //     toast.info("Processing imported file...");

    //     let customerData: any[] = [];
    //     try {
    //         const { data } = await axios.get("/api/customers");
    //         customerData = data;
    //         setCustomers(data);
    //     } catch {
    //         toast.error("Failed to fetch customers");
    //         setLoading(false);
    //         return;
    //     }

    //     let existingBookings: any[] = [];
    //     try {
    //         const { data } = await axios.get("/api/booking-master");
    //         existingBookings = data;
    //     } catch {
    //         toast.error("Failed to fetch existing bookings");
    //     }
    //     const awbMap = Object.fromEntries(existingBookings.map((b: any) => [String(b.awbNo), b]));

    //     const mappedRows = rows.map((row, idx) => {
    //         const mapped: any = { srNo: idx + 1 };

    //         const importedCustomerCode = row['Customer Code'] || row['CustomerCode'];

    //         if (importedCustomerCode) {
    //             // Find matching customer
    //             const matchingCustomer = customerData.find(
    //                 (c: any) => c.customerCode?.toLowerCase() === importedCustomerCode.toString().trim().toLowerCase()
    //             );

    //             if (matchingCustomer) {
    //                 // Auto-fill customer details
    //                 mapped.customerCode = matchingCustomer.customerCode;
    //                 mapped.customerId = matchingCustomer.id;
    //                 mapped.customerName = matchingCustomer.customerName;
    //                 mapped.childCustomer = matchingCustomer.childCustomer || matchingCustomer.customerName;
    //                 mapped.customerAttendBy = "";
    //                 mapped.senderContactNo = matchingCustomer.mobile || matchingCustomer.phone || "";
    //                 mapped.senderDetail = matchingCustomer.customerName || "";
    //                 mapped._fuelSurchargePercent = matchingCustomer.fuelSurchargePercent || 0;
    //                 mapped._gstPercent = getGSTPercentage(matchingCustomer.pincode || "", matchingCustomer.state);
    //                 mapped.address = matchingCustomer.address || "";
    //             }
    //         }

    //         columns.forEach(col => {
    //             if (col === "srNo") return;
    //             const customerFields = ["customerId", "customerName", "childCustomer", "fuelSurcharge", "receiverName"];
    //             if (customerFields.includes(col)) {
    //                 if (!mapped[col]) mapped[col] = "";
    //                 return;
    //             }

    //             let importKey = Object.keys(row).find(k =>
    //                 IMPORT_ALIASES[col]?.some(alias =>
    //                     k.replace(/[\s_]/g, '').toLowerCase() === alias.replace(/[\s_]/g, '').toLowerCase()
    //                 ) ||
    //                 k.replace(/[\s_]/g, '').toLowerCase() === col.replace(/[\s_]/g, '').toLowerCase()
    //             );

    //             if (importKey) {
    //                 if (col === "mode") {
    //                     const rawMode = row[importKey]?.toString().toUpperCase();
    //                     mapped[col] = MODE_MAP[rawMode] || rawMode;
    //                 } else if (col === "dsrNdxPaper") {
    //                     const rawValue = row[importKey]?.toString().trim().toUpperCase() || "";
    //                     if (rawValue === 'D' || rawValue === 'N') {
    //                         mapped[col] = rawValue;
    //                     } else if (rawValue === 'DOCUMENT' || rawValue === 'DOX' || rawValue === 'DOC') {
    //                         mapped[col] = 'D';
    //                     } else if (rawValue === 'PARCEL' || rawValue === 'NON DOX' || rawValue === 'NON-DOX' || rawValue === 'NDOX') {
    //                         mapped[col] = 'N';
    //                     } else {
    //                         mapped[col] = rawValue || 'N';
    //                     }
    //                 } else if (col === "bookingDate" || col === "statusDate" || col === "dateOfDelivery") {
    //                     mapped[col] = parseImportedDate(row[importKey]);
    //                 } else if (col === "location") {
    //                     const rawLocation = row[importKey];
    //                     mapped[col] = extractCityName(rawLocation);
    //                     console.log(`Location processed: "${rawLocation}" → "${mapped[col]}"`);
    //                 } else {
    //                     mapped[col] = row[importKey];
    //                 }
    //             } else {
    //                 mapped[col] = "";
    //             }
    //         });
    //         mapped.customerType = "CREDIT";

    //         if (!mapped.dsrNdxPaper) {
    //             mapped.dsrNdxPaper = "N";
    //         }

    //         if (mapped.location) {
    //             const cityCode = getCityCode(mapped.location);
    //             mapped.destinationCity = cityCode;

    //             console.log(`Auto-mapped: Location "${mapped.location}" → Destination "${mapped.destinationCity}"`);
    //         } else if (mapped.destinationCity) {
    //             const extractedCity = extractCityName(mapped.destinationCity);
    //             mapped.location = extractedCity;
    //             mapped.destinationCity = getCityCode(extractedCity);
    //         }

    //         const awbNo = mapped.awbNo?.toString();
    //         if (awbNo && awbMap[awbNo]) {
    //             const updatedRow = { ...awbMap[awbNo], ...mapped, _awbExists: true, _bookingId: awbMap[awbNo].id };
    //             updatedRow.pendingDaysNotDelivered = calculatePendingDays(updatedRow.bookingDate, updatedRow.status);
    //             updatedRow.todayDate = getCurrentDate();

    //             const l = parseFloat(updatedRow.length) || 0;
    //             const w = parseFloat(updatedRow.width) || 0;
    //             const h = parseFloat(updatedRow.height) || 0;
    //             if (l > 0 && w > 0 && h > 0) {
    //                 const volumetricValue = ((l * w * h) / 5000).toFixed(2);
    //                 mapped.valumetric = volumetricValue;

    //                 const actualWeight = parseFloat(mapped.actualWeight) || 0;
    //                 const volumetricWeight = parseFloat(volumetricValue);
    //                 if (volumetricWeight > actualWeight) {
    //                     mapped.chargeWeight = volumetricValue;
    //                 } else if (actualWeight > 0) {
    //                     updatedRow.chargeWeight = updatedRow.actualWeight;
    //                 }
    //                 updatedRow.invoiceWt = Math.max(actualWeight, parseFloat(updatedRow.chargeWeight) || 0).toFixed(2);
    //             } else {
    //                 updatedRow.valumetric = "0.00";
    //                 // Even without dimensions, compute invoiceWt from actualWeight & chargeWeight
    //                 const actualWeight = parseFloat(updatedRow.actualWeight) || 0;
    //                 const importedChargeWeight = parseFloat(updatedRow.chargeWeight) || 0;
    //                 if (importedChargeWeight > 0 || actualWeight > 0) {
    //                     updatedRow.chargeWeight = Math.max(actualWeight, importedChargeWeight).toFixed(2);
    //                     updatedRow.invoiceWt = updatedRow.chargeWeight;
    //                 }
    //             }
    //             return updatedRow;
    //         }
    //         mapped.paymentStatus = "UNPAID";
    //         mapped.pendingDaysNotDelivered = calculatePendingDays(mapped.bookingDate, mapped.status);
    //         mapped.todayDate = getCurrentDate();

    //         const l = parseFloat(mapped.length) || 0;
    //         const w = parseFloat(mapped.width) || 0;
    //         const h = parseFloat(mapped.height) || 0;
    //         if (l > 0 && w > 0 && h > 0) {
    //             const volumetricValue = ((l * w * h) / 5000).toFixed(2);
    //             mapped.valumetric = volumetricValue;

    //             const actualWeight = parseFloat(mapped.actualWeight) || 0;
    //             const volumetricWeight = parseFloat(volumetricValue);
    //             if (volumetricWeight > actualWeight) {
    //                 mapped.chargeWeight = volumetricValue;
    //             } else if (actualWeight > 0) {
    //                 mapped.chargeWeight = actualWeight;
    //             }
    //             mapped.invoiceWt = Math.max(actualWeight, parseFloat(mapped.chargeWeight) || 0).toFixed(2);
    //         } else {
    //             mapped.valumetric = "0.00";
    //             // Even without dimensions, compute invoiceWt from actualWeight & chargeWeight
    //             const actualWeight = parseFloat(mapped.actualWeight) || 0;
    //             const importedChargeWeight = parseFloat(mapped.chargeWeight) || 0;
    //             if (importedChargeWeight > 0 || actualWeight > 0) {
    //                 mapped.chargeWeight = Math.max(actualWeight, importedChargeWeight).toFixed(2);
    //                 mapped.invoiceWt = mapped.chargeWeight;
    //             }
    //         }

    //         return { ...mapped, _awbExists: false };
    //     });

    //     // --- Batched Auto-Calculate Rates during Import ---
    //     let calculatedRows = [...mappedRows];
    //     const rowsToCalc = mappedRows.filter(r => 
    //         r.customerId && r.pin && parseFloat(r.chargeWeight) > 0 && r.mode
    //     );

    //     if (rowsToCalc.length > 0) {
    //         try {
    //             toast.info(`Auto-calculating rates for ${rowsToCalc.length} rows...`);
    //             // 1. Prepare items
    //             const items = rowsToCalc.map(row => ({
    //                 customerId: row.customerId,
    //                 destinationPincode: row.pin,
    //                 chargeWeight: row.chargeWeight,
    //                 isDox: row.dsrNdxPaper === 'D',
    //                 mode: row.mode,
    //                 invoiceValue: row.invoiceValue,
    //                 state: row.state,
    //                 city: row.location
    //             }));

    //             // 2. Batch Calculation (50 at a time)
    //             const BATCH_SIZE = 50;
    //             for (let i = 0; i < items.length; i += BATCH_SIZE) {
    //                 const batchItems = items.slice(i, i + BATCH_SIZE);
    //                 const { data } = await axios.post('/api/calculate-rate/batch', { items: batchItems });
                    
    //                 for (const result of data.results) {
    //                     const origRow = rowsToCalc[i + result.index];
    //                     const idx = calculatedRows.findIndex(r => r.srNo === origRow.srNo);
                        
    //                     if (idx !== -1 && result.success) {
    //                         calculatedRows[idx] = {
    //                             ...calculatedRows[idx],
    //                             frCharge: result.frCharge.toFixed(2),
    //                             waybillSurcharge: result.waybillSurcharge.toFixed(2),
    //                             otherExp: result.otherExp.toFixed(2),
    //                             serviceProvider: result.serviceProvider || calculatedRows[idx].serviceProvider || "DTDC"
    //                         };

    //                         const frCharge = parseFloat(result.frCharge) || 0;
    //                         const fuelPercent = calculatedRows[idx]._fuelSurchargePercent || 0;
    //                         calculatedRows[idx].fuelSurcharge = (frCharge > 0 && fuelPercent > 0)
    //                             ? ((frCharge * fuelPercent) / 100).toFixed(2)
    //                             : "0.00";

    //                         calculatedRows[idx] = recalculateClientBilling(calculatedRows[idx]);
    //                     }
    //                 }
    //             }
    //         } catch (error) {
    //             console.error("Auto-calculate during import failed:", error);
    //             toast.error("Auto-calculation failed, saving without rates.");
    //         }
    //     }

    //     try {
    //         toast.info(`Saving ${mappedRows.length} bookings to database...`);
    //         const totalRows = mappedRows.length;
    //         setImportProgress({ current: 0, total: totalRows });

    //         const rowsForApi = mappedRows.map(r => ({
    //             ...r,
    //             pin: r.pin ? String(r.pin) : "", 
    //             customerCode: r.customerCode ? String(r.customerCode) : "",
    //             chargeWeight: parseFloat(r.chargeWeight) || 0,
    //             actualWeight: parseFloat(r.actualWeight) || 0,
    //             pcs: parseInt(r.pcs as string) || 1,
    //             invoiceValue: parseFloat(r.invoiceValue) || 0
    //         }));

    //         const BATCH_SIZE = 50; 
    //         for (let i = 0; i < totalRows; i += BATCH_SIZE) {
    //             const batch = rowsForApi.slice(i, i + BATCH_SIZE);
    //             await axios.post('/api/booking-master/bulk-create', batch);
                
    //             setImportProgress(prev => ({ 
    //                 ...prev, 
    //                 current: Math.min(i + BATCH_SIZE, totalRows) 
    //             }));
    //         }

    //         // const { data: createResult } = await axios.post('/api/booking-master/bulk-create', rowsForApi);
    //         toast.success("Imported and saved! Review the rows below.");
            
    //         const rowsForDisplay = mappedRows.map((r, i) => ({
    //             ...r,
    //             _awbExists: true,
    //             srNo: i + 1,
    //             pin: r.pin ? String(r.pin) : ""
    //         }));
            
    //         setTableRows(rowsForDisplay); 
    const handleImport = async (rows: any[]) => {
        setIsImporting(true);
        setImportProgress(0);
        cancelImportRef.current = false;
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
            setIsImporting(false);
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

        const mappedRows: any[] = [];
        const CHUNK_SIZE = 500;

        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
            if (cancelImportRef.current) {
                toast.error("Import cancelled by user.");
                setIsImporting(false);
                setLoading(false);
                setImportProgress(0);
                return; // Stop processing entirely
            }

            const chunk = rows.slice(i, i + CHUNK_SIZE);
            const processedChunk = chunk.map((row, chunkIdx) => {
                const idx = i + chunkIdx;
                const mapped: any = { srNo: idx + 1 };

                const importedCustomerCode = row['Customer Code'] || row['CustomerCode'];

                if (importedCustomerCode) {
                    const matchingCustomer = customerData.find(
                        (c: any) => c.customerCode?.toLowerCase() === importedCustomerCode.toString().trim().toLowerCase()
                    );

                    if (matchingCustomer) {
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
                            const rawValue = row[importKey]?.toString().trim().toUpperCase() || "";
                            if (rawValue === 'D' || rawValue === 'N') {
                                mapped[col] = rawValue;
                            } else if (rawValue === 'DOCUMENT' || rawValue === 'DOX' || rawValue === 'DOC') {
                                mapped[col] = 'D';
                            } else if (rawValue === 'PARCEL' || rawValue === 'NON DOX' || rawValue === 'NON-DOX' || rawValue === 'NDOX') {
                                mapped[col] = 'N';
                            } else {
                                mapped[col] = rawValue || 'N';
                            }
                        } else if (col === "bookingDate" || col === "statusDate" || col === "dateOfDelivery") {
                            mapped[col] = parseImportedDate(row[importKey]);
                        } else if (col === "location") {
                            const rawLocation = row[importKey];
                            mapped[col] = extractCityName(rawLocation);
                        } else {
                            mapped[col] = row[importKey];
                        }
                    } else {
                        mapped[col] = "";
                    }
                });
                mapped.customerType = "CREDIT";

                if (!mapped.dsrNdxPaper) {
                    mapped.dsrNdxPaper = "N";
                }

                if (mapped.location) {
                    const cityCode = getCityCode(mapped.location);
                    mapped.destinationCity = cityCode;
                } else if (mapped.destinationCity) {
                    const extractedCity = extractCityName(mapped.destinationCity);
                    mapped.location = extractedCity;
                    mapped.destinationCity = getCityCode(extractedCity);
                }

                const awbNo = mapped.awbNo?.toString();
                if (awbNo && awbMap[awbNo]) {
                    mapped._awbExists = true;
                    mapped._bookingId = awbMap[awbNo].id;
                    mapped.status = awbMap[awbNo].status || 'BOOKED';
                    mapped.statusDate = awbMap[awbNo].statusDate;
                    mapped.delivered = awbMap[awbNo].delivered;
                    mapped.dateOfDelivery = awbMap[awbNo].dateOfDelivery;
                    mapped.pendingDaysNotDelivered = calculatePendingDays(mapped.bookingDate, mapped.status);
                } else {
                    mapped._awbExists = false;
                    mapped.status = 'BOOKED';
                    mapped.pendingDaysNotDelivered = calculatePendingDays(mapped.bookingDate, 'BOOKED');
                }

                mapped.todayDate = getCurrentDate();
                return mapped;
            });

            mappedRows.push(...processedChunk);

            // Update UI progress
            setImportProgress(Math.floor(((i + chunk.length) / rows.length) * 100));

            // Yield to browser main thread so UI can update and cancel button can be clicked !!
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const rowsForDisplay = mappedRows.map((r: any, i: number) => ({
            ...r,
            _awbExists: true,
            srNo: i + 1,
            pin: r.pin ? String(r.pin) : ""
        }));

        setTableRows(prev => [...prev, ...rowsForDisplay]);
        setTotalPages(Math.ceil((tableRows.length + rowsForDisplay.length) / pageSize));

        setLoading(false);
        setIsImporting(false);
        setImportProgress(0);

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

        fetchCities();
        fetchTaxMaster();
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
            const { data } = await axios.get(`/api/customers?query=${encodeURIComponent(searchTerm)}`);

            if (!Array.isArray(data)) {
                console.error("Customers API returned non-array data:", data);
                setCustomerSuggestions(prev => ({ ...prev, [idx]: [] }));
                return;
            }

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
        if (cleanRow.status === 'RECALLED') {
            cleanRow.status = 'BOOKED';
        }
        if (!cleanRow.status) {
            cleanRow.status = 'BOOKED';
        }
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
        // Filter out rows that have a valid Client Billing Value
        const validRows = tableRows.filter(row => 
            row.clientBillingValue && 
            parseFloat(row.clientBillingValue.toString()) > 0
        );

        if (validRows.length === 0) {
            toast.warning("No rows have a valid Client Billing Value to save.");
            return;
        }

        const skippedCount = tableRows.length - validRows.length;
        setLoading(true);

        try {
            // Prepare and clean data
            const rowsToSave = validRows.map(row => {
                const cleanRow = { ...row };
                
                cleanRow.serviceProvider = cleanRow.serviceProvider || "DTDC";
                cleanRow.pendingDaysNotDelivered = calculatePendingDays(cleanRow.bookingDate, cleanRow.status);
                
                if (cleanRow.status === 'RECALLED') cleanRow.status = 'BOOKED';
                if (!cleanRow.status) cleanRow.status = 'BOOKED';

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

            // --- THE BATCHING LOGIC FIX ---
            const BATCH_SIZE = 200; // Send 200 rows at a time
            let totalSaved = 0;

            const totalBatches = Math.ceil(rowsToSave.length / BATCH_SIZE);
            
            for (let i = 0; i < rowsToSave.length; i += BATCH_SIZE) {
                const batch = rowsToSave.slice(i, i + BATCH_SIZE);
                const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
                
                toast.loading(`Saving batch ${currentBatchNum} of ${totalBatches}... (${totalSaved}/${rowsToSave.length})`, { id: 'save-batch' });
                
                // Await each batch individually so the server doesn't get flooded
                await axios.post('/api/booking-master/bulk-create', batch);
                totalSaved += batch.length;
            }
            
            toast.dismiss('save-batch'); // Remove the loading toast

            // Keep only the rows that were NOT valid (skipped)
            const remainingRows = tableRows.filter(row => 
                !row.clientBillingValue || 
                parseFloat(row.clientBillingValue.toString()) <= 0
            );
            
            setTableRows(remainingRows);
            
            if (skippedCount > 0) {
                toast.success(`Successfully saved ${totalSaved} bookings. ${skippedCount} rows remaining.`);
            } else {
                toast.success(`Successfully saved all ${totalSaved} bookings!`);
            }
            
            await fetchUnassignedBookings();

        } catch (error: any) {
            console.error("Bulk save failed:", error);
            toast.dismiss('save-batch');
            toast.error(error.response?.data?.error || "Failed to save bookings. Check console for details.");
        } finally {
            setLoading(false);
        }
    };
    // const handleSaveAll = async () => {
    //     if (tableRows.length === 0) return;
        
    //     setLoading(true);
    //     try {
    //         // Filter out rows that are already saved (if you want) or just save everything
    //         // For now, let's save everything currently in the table
            
    //         // Prepare data: remove UI-only flags
    //         const rowsToSave = tableRows.map(row => {
    //             const cleanRow = { ...row };
    //             // Ensure defaults
    //             cleanRow.serviceProvider = cleanRow.serviceProvider || "DTDC";
    //             cleanRow.pendingDaysNotDelivered = calculatePendingDays(cleanRow.bookingDate, cleanRow.status);
                
    //             if (cleanRow.status === 'RECALLED') {
    //                 cleanRow.status = 'BOOKED';
    //             }

    //             // Remove internal flags
    //             delete cleanRow._awbExists;
    //             delete cleanRow._bookingId;
    //             delete cleanRow.__origIndex;
    //             delete cleanRow.customerName;
    //             delete cleanRow._fuelSurchargePercent;
    //             delete cleanRow._gstPercent;

    //             // Fix dates
    //             cleanRow.bookingDate = new Date(cleanRow.bookingDate);
    //             cleanRow.statusDate = cleanRow.statusDate ? new Date(cleanRow.statusDate) : null;
    //             cleanRow.dateOfDelivery = cleanRow.dateOfDelivery ? new Date(cleanRow.dateOfDelivery) : null;
    //             cleanRow.todayDate = cleanRow.todayDate ? new Date(cleanRow.todayDate) : new Date();

    //             // Ensure numbers
    //             ["pcs", "invoiceValue", "actualWeight", "chargeWeight", "frCharge", "fuelSurcharge",
    //             "shipperCost", "waybillSurcharge", "otherExp", "gst", "valumetric", "invoiceWt",
    //             "clientBillingValue", "creditCustomerAmount", "regularCustomerAmount",
    //             "pendingDaysNotDelivered", "length", "width", "height"].forEach(field => {
    //                  if (cleanRow[field]) cleanRow[field] = Number(cleanRow[field]);
    //             });
                
    //             return cleanRow;
    //         });

    //         const { data: createResult } = await axios.post('/api/booking-master/bulk-create', rowsToSave);
    //         toast.success(createResult.message || "All bookings saved successfully!");
            
    //         // Refresh to get IDs and confirm saved state
    //         await fetchUnassignedBookings();

    //     } catch (error: any) {
    //         console.error("Bulk save failed:", error);
    //         toast.error(error.response?.data?.error || "Failed to save bookings.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    useEffect(() => {
        const checkRecall = async () => {
            const storedIds = sessionStorage.getItem('smartBooking_editIds');
            if (storedIds) {
                try {
                    const ids = JSON.parse(storedIds);
                    if (Array.isArray(ids) && ids.length > 0) {
                        toast.info(`Recalling ${ids.length} bookings for correction...`);
                        setLoading(true);
                        
                        // Fetch the data formatted for this table
                        const { data } = await axios.post('/api/booking-master/get-for-edit', { ids });
                        
                        if (data && data.length > 0) {
                            // Populate table
                            setTableRows(data);
                            toast.success("Bookings loaded! Make corrections and click 'Save All'.");
                            
                            // Clear storage so it doesn't happen on reload
                            sessionStorage.removeItem('smartBooking_editIds');
                        }
                    }
                } catch (e) {
                    console.error("Recall failed", e);
                    toast.error("Failed to load recalled bookings");
                } finally {
                    setLoading(false);
                }
            }
        };
        
        checkRecall();
    }, []);

    const filteredRows = useMemo(() => {
        const rowsWithIndex = tableRows.map((row, i) => ({ ...row, __origIndex: i }));
        
        return rowsWithIndex.filter(row => {
            if (dateFilter.start && row.bookingDate < dateFilter.start) return false;
            if (dateFilter.end && row.bookingDate > dateFilter.end) return false;
            if (!search) return true;
            const s = search.toLowerCase();
            return Object.values(row).some(val =>
                val && val.toString().toLowerCase().includes(s)
            );
        });
    }, [tableRows, dateFilter.start, dateFilter.end, search]);

    // CBV Diagnostics: Analyze rows with zero billing value and determine exact reasons
    const cbvDiagnostics = useMemo(() => {
        const issues: { reason: string; solution: string; rows: { srNo: number; awbNo: string; customerName: string }[] }[] = [];

        const noCustomer: typeof issues[0]['rows'] = [];
        const noChargeWeight: typeof issues[0]['rows'] = [];
        const noPincode: typeof issues[0]['rows'] = [];
        const noMode: typeof issues[0]['rows'] = [];
        const noFrCharge: typeof issues[0]['rows'] = [];

        tableRows.forEach(row => {
            const cbv = parseFloat(row.clientBillingValue) || 0;
            if (cbv > 0) return; // This row is fine

            const rowInfo = {
                srNo: row.srNo || 0,
                awbNo: row.awbNo || '—',
                customerName: row.customerName || row.senderDetail || '—',
            };

            // Check in priority order
            if (!row.customerId) {
                noCustomer.push(rowInfo);
            } else if (!row.chargeWeight || parseFloat(row.chargeWeight) <= 0) {
                noChargeWeight.push(rowInfo);
            } else if (!row.pin || row.pin.length < 6) {
                noPincode.push(rowInfo);
            } else if (!row.mode) {
                noMode.push(rowInfo);
            } else if (!row.frCharge || parseFloat(row.frCharge) <= 0) {
                noFrCharge.push(rowInfo);
            }
        });

        if (noCustomer.length > 0) {
            issues.push({
                reason: 'No customer selected',
                solution: 'Select a customer for these rows, or click "Auto-Map Customers" if customer code is available.',
                rows: noCustomer,
            });
        }
        if (noChargeWeight.length > 0) {
            issues.push({
                reason: 'Charge weight is 0 or empty',
                solution: 'Enter the charge weight in the imported file or update it manually in the table.',
                rows: noChargeWeight,
            });
        }
        if (noPincode.length > 0) {
            issues.push({
                reason: 'Pincode is missing or invalid',
                solution: 'Enter a valid 6-digit pincode, or click "Auto-Map Locations" if destination is available.',
                rows: noPincode,
            });
        }
        if (noMode.length > 0) {
            issues.push({
                reason: 'Shipping mode is not set',
                solution: 'Select a mode (AIR, SURFACE, EXPRESS, etc.) for these rows.',
                rows: noMode,
            });
        }
        if (noFrCharge.length > 0) {
            issues.push({
                reason: 'FR Charge is ₹0 — Rate not calculated',
                solution: 'Click "Calc Rates" button to auto-calculate, OR add FR Charge in the import file, OR update the customer\'s rate in Customer Master.',
                rows: noFrCharge,
            });
        }

        const totalAffected = issues.reduce((sum, i) => sum + i.rows.length, 0);
        return { issues, totalAffected };
    }, [tableRows]);


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

            {isImporting ? (
                <div className="bg-purple-50 text-purple-800 p-4 rounded-lg shadow border border-purple-200 flex flex-col sm:flex-row items-center justify-between my-6 gap-4 animate-pulse">
                    <div className="flex-1 w-full flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-2">
                            <h4 className="font-semibold text-sm">Processing Excel File...</h4>
                            <span className="text-xs font-bold bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">{importProgress}%</span>
                        </div>
                        <div className="w-full bg-purple-200/60 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-purple-600 h-full rounded-full transition-all duration-200 ease-out" 
                                style={{ width: `${importProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <button
                        onClick={handleCancelImport}
                        className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-5 py-2 rounded-lg shadow flex items-center justify-center gap-2 transition w-full sm:w-auto font-medium"
                    >
                        <X className="w-5 h-5" /> Cancel Import
                    </button>
                </div>
            ) : null}


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
                                    onClick={handleAutoMapLocations}
                                    disabled={isAutoMapping || loading}
                                    className={`flex items-center gap-2 px-3 cursor-pointer py-2 rounded-lg text-sm font-medium transition-colors border ${
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
                                    onClick={handleSaveAll} 
                                    disabled={loading}
                                    className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
                                >
                                    {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Save className="w-4 h-4" />}
                                    Save All ({tableRows.length})
                                </button>
                                
                            </div>
                        </div>
                    </div>
                    {/* CBV Diagnostics Banner */}
                    {hasCalcRatesRun && cbvDiagnostics.totalAffected > 0 && (
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">
                                        {cbvDiagnostics.totalAffected} booking{cbvDiagnostics.totalAffected > 1 ? 's' : ''} have ₹0 billing value — These will not be saved
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        Click "View Details" to see exact reasons and solutions for each booking
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCBVDiagnostics(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex-shrink-0"
                            >
                                <Info className="w-4 h-4" />
                                View Details
                            </button>
                        </div>
                    )}

                    {/* CBV Diagnostics Modal */}
                    {showCBVDiagnostics && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCBVDiagnostics(false)}>
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">Billing Value Issues</h2>
                                            <p className="text-amber-100 text-sm">{cbvDiagnostics.totalAffected} booking{cbvDiagnostics.totalAffected > 1 ? 's' : ''} need attention</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowCBVDiagnostics(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
                                    {cbvDiagnostics.issues.map((issue, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                                            {/* Issue Header */}
                                            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-red-700 text-sm">❌ {issue.reason}</span>
                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{issue.rows.length} row{issue.rows.length > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>

                                            {/* Affected Rows */}
                                            <div className="px-4 py-2 bg-white">
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {issue.rows.slice(0, 10).map((row, rIdx) => (
                                                        <div key={rIdx} className="flex items-center gap-2 text-xs text-gray-600 py-0.5">
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                                                            <span>Row #{row.srNo}</span>
                                                            <span className="text-gray-400">•</span>
                                                            <span className="font-medium text-gray-800">AWB: {row.awbNo}</span>
                                                            <span className="text-gray-400">•</span>
                                                            <span className="text-gray-500">{row.customerName}</span>
                                                        </div>
                                                    ))}
                                                    {issue.rows.length > 10 && (
                                                        <p className="text-xs text-gray-400 pl-4 py-1">... and {issue.rows.length - 10} more</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Solution */}
                                            <div className="px-4 py-2.5 bg-blue-50 border-t border-blue-100">
                                                <p className="text-xs text-blue-700">
                                                    <span className="font-semibold">💡 Solution: </span>{issue.solution}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Modal Footer */}
                                <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex justify-end">
                                    <button 
                                        onClick={() => setShowCBVDiagnostics(false)} 
                                        className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    onChange={e => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="text-sm border border-gray-300 text-blue-600 cursor-pointer rounded p-1"
                                >
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="500">500</option>
                                    <option value="100000">All</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[65vh] min-h-[300px] relative">
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
                        <div className="mt-4 flex items-center justify-between px-4">
                            {/* Rows per page selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Rows per page:</span>
                                <select 
                                    value={pageSize >= (filteredRows.length || 10000) ? "ALL" : pageSize}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "ALL") {
                                            setPageSize(filteredRows.length > 0 ? filteredRows.length : 10000);
                                        } else {
                                            setPageSize(Number(val));
                                        }
                                        setCurrentPage(1);
                                    }}
                                    className="p-1 text-sm border border-gray-300 rounded text-gray-700 bg-white focus:outline-none focus:border-blue-500 hover:border-blue-400 transition-colors cursor-pointer"
                                >
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="ALL">All ({filteredRows.length})</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-600 font-medium">
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
                    </div>
                </>
            )}
        </div>
    );
}