'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function BookingCustomerSearch({
    importedRows,
    onSelectCustomerRows,
    onSelectCustomer
}: {
    importedRows: any[];
    onSelectCustomerRows: (rows: any[]) => void;
    onSelectCustomer: (customer: any) => void;
}) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [awbCustomerMissing, setAwbCustomerMissing] = useState(false);

    useEffect(() => {
        axios.get('/api/customers').then(res => {
            setCustomers(res.data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setAwbCustomerMissing(false);
        if (!search) {
            setFilteredCustomers([]);
            return;
        }

        // Check if search matches any AWB number in importedRows
        const awbMatches = importedRows.filter(row =>
            (row['AwbNo'] || row['awbNo'] || '').toString().includes(search)
        );

        let customerResults = customers.filter(c =>
            c.customerName.toLowerCase().includes(search.toLowerCase()) ||
            c.customerCode.toLowerCase().includes(search.toLowerCase())
        );

        // If AWB match found, add a virtual result
        if (awbMatches.length > 0) {
            customerResults = [
                ...customerResults,
                {
                    id: 'awb-search',
                    customerName: `AWB: ${search}`,
                    customerCode: awbMatches[0]['Customer Code'] || awbMatches[0]['CustomerCode'] || '',
                    awbNo: search,
                    isAwbSearch: true,
                }
            ];
        }

        setFilteredCustomers(customerResults);
    }, [search, customers, importedRows]);

    const handleSelect = (customer: any) => {
        setSelectedCustomer(customer);
        onSelectCustomer(customer);

        let rows;
        if (customer.isAwbSearch && customer.awbNo) {
            rows = importedRows.filter(row =>
                (row['AwbNo'] || row['awbNo'] || '').toString() === customer.awbNo
            );
            const awbRow = rows[0];
            const awbCustomerCode = awbRow?.['Customer Code'] || awbRow?.['CustomerCode'] || '';
            const awbConsignee = (awbRow?.['Consignee'] || '').toString().trim().toLowerCase();

            const customerExists = customers.some(c =>
                c.customerCode === awbCustomerCode ||
                c.customerName.trim().toLowerCase() === awbConsignee
            );

            if (!customerExists) {
                setAwbCustomerMissing(true);
                setSelectedCustomer(null);
                onSelectCustomerRows([]);
                onSelectCustomer(null);
                return;
            }
        } else {
            rows = importedRows.filter(row => {
                const codeMatch =
                    (row['Customer Code'] || row['CustomerCode'] || '').toString().trim().toLowerCase() ===
                    customer.customerCode.trim().toLowerCase();
                const nameMatch =
                    (row['Consignee'] || '').toString().trim().toLowerCase() ===
                    customer.customerName.trim().toLowerCase();
                return codeMatch || nameMatch;
            });
        }

        setAwbCustomerMissing(false);
        onSelectCustomerRows(rows);
        setSearch('');
        setFilteredCustomers([]);
    };

    return (
        <div className="my-4 relative max-w-lg">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search customer by name, code, or AWB number..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                />
            </div>
            {awbCustomerMissing && (
                <div className="absolute mt-2 w-full bg-yellow-50 border border-yellow-300 rounded-lg shadow p-3 text-sm text-yellow-700">
                    Selected AWB number’s customer does not exist in Customer Master.<br />
                    <a
                        href="/customer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Click here to add Customer Master
                    </a>
                </div>
            )}
            {search && filteredCustomers.length === 0 && !awbCustomerMissing && (
                <div className="absolute mt-2 w-full bg-white border rounded-lg shadow p-3 text-sm text-gray-500">
                    No customers found.<br />
                    <a
                        href="/customer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Click here to add Customer Master
                    </a>
                </div>
            )}

            {loading && (
                <div className="mt-2 text-sm text-gray-500">Loading customers...</div>
            )}

            {search && filteredCustomers.length > 0 && !awbCustomerMissing && (
                <ul className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto animate-fade-in">
                    {filteredCustomers.map(c => (
                        <li
                            key={c.id}
                            className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => handleSelect(c)}
                        >
                            <div className="font-medium text-gray-800">{c.customerName}</div>
                            <div className="text-sm text-gray-500">{c.customerCode}</div>
                        </li>
                    ))}
                </ul>
            )}

            {selectedCustomer && (
                <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg p-3">
                    <div className="flex-1">
                        <div className="font-semibold text-green-800">
                            {selectedCustomer.customerName}
                        </div>
                        <div className="text-sm text-green-600">
                            {selectedCustomer.customerCode}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedCustomer(null);
                            onSelectCustomer(null);
                        }}
                        className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}