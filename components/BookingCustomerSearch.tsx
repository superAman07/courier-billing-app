'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BookingCustomerSearch({ importedRows, onSelectCustomerRows }: { importedRows: any[], onSelectCustomerRows: (rows: any[]) => void }) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    useEffect(() => {
        axios.get('/api/customers').then(res => setCustomers(res.data));
    }, []);

    useEffect(() => {
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
            if (codeMatch || nameMatch) {
                console.log("Matched row:", row);
            }
            return codeMatch || nameMatch;
        });

        console.log("Total matched rows:", rows.length);
        onSelectCustomerRows(rows);
    };

    return (
        <div className="my-4">
            <input
                type="text"
                placeholder="Search customer by name or code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="p-2 border rounded w-full"
            />
            {search && (
                <ul className="bg-white border rounded shadow mt-1 max-h-48 overflow-auto">
                    {filteredCustomers.map(c => (
                        <li
                            key={c.id}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => handleSelect(c)}
                        >
                            {c.customerName} ({c.customerCode})
                        </li>
                    ))}
                </ul>
            )}
            {selectedCustomer && (
                <div className="mt-2 text-green-700 font-semibold">
                    Selected: {selectedCustomer.customerName}
                </div>
            )}
        </div>
    );
}