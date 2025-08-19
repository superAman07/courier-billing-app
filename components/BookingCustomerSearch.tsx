'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function BookingCustomerSearch({
    importedRows,
    onSelectCustomerRows,
}: {
    importedRows: any[];
    onSelectCustomerRows: (rows: any[]) => void;
}) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/customers').then(res => {
            setCustomers(res.data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredCustomers([]);
            return;
        }
        setFilteredCustomers(
            customers.filter(c =>
                c.customerName.toLowerCase().includes(search.toLowerCase()) ||
                c.customerCode.toLowerCase().includes(search.toLowerCase())
            )
        );
    }, [search, customers]);

    const handleSelect = (customer: any) => {
        setSelectedCustomer(customer);

        const rows = importedRows.filter(row => {
            const codeMatch =
                (row['Customer Code'] || row['CustomerCode'] || '').toString().trim().toLowerCase() ===
                customer.customerCode.trim().toLowerCase();
            const nameMatch =
                (row['Consignee'] || '').toString().trim().toLowerCase() ===
                customer.customerName.trim().toLowerCase();
            return codeMatch || nameMatch;
        });

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
                    placeholder="Search customer by name or code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                />
            </div>

            {loading && (
                <div className="mt-2 text-sm text-gray-500">Loading customers...</div>
            )}

            {search && filteredCustomers.length > 0 && (
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

            {search && !loading && filteredCustomers.length === 0 && (
                <div className="absolute mt-2 w-full bg-white border rounded-lg shadow p-3 text-sm text-gray-500">
                    No customers found
                </div>
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
                        onClick={() => setSelectedCustomer(null)}
                        className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}