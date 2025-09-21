'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { CustomerMaster } from '@prisma/client';
import { toast } from 'sonner';
import CustomerImportButton from './temp/CustomerImportButton';

export default function CustomerListPage() {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [search , setSearch] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/api/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
                toast.error("Error loading customers");
                setMessage("Could not load customers.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = useMemo(() => {
        if (!search) {
            return customers;
        }
        const searchTerm = search.toLowerCase();
        return customers.filter(customer =>
            customer.customerCode.toLowerCase().includes(searchTerm) ||
            customer.customerName.toLowerCase().includes(searchTerm) ||
            (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchTerm)) ||
            (customer.city && customer.city.toLowerCase().includes(searchTerm)) ||
            (customer.mobile && customer.mobile.includes(searchTerm)) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
            (customer.gstNo && customer.gstNo.toLowerCase().includes(searchTerm))
        );
    }, [customers, search]);

    const handleDelete = async (customerId: string) => {
        if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            return;
        }
        try {
            await axios.delete(`/api/customers/${customerId}`);
            setCustomers(prev => prev.filter(c => c.id !== customerId));
            toast.success("Customer deleted successfully");
            setMessage("Customer deleted successfully.");
        } catch (error) {
            console.error("Failed to delete customer", error);
            toast.error("Error deleting customer");
            setMessage("Error deleting customer.");
        }
    };

    const tableHeaderStyle = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCellStyle = "px-4 py-3 whitespace-nowrap text-sm text-gray-700";

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 shadow-md flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Customer List</h1>
                    {/* <CustomerImportButton /> */}
                    <Link href="/customer" className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100">
                        Add New Customer
                    </Link>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, code, city, GST, etc..."
                            className="w-full max-w-md p-2 border border-gray-300 text-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {message && <p className="text-sm text-blue-600 mb-4">{message}</p>}
                    <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
                        <table className="min-w-full h-[10vh] divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky">
                                <tr>
                                    <th className={tableHeaderStyle}>Customer Code</th>
                                    <th className={tableHeaderStyle}>Customer Name</th>
                                    <th className={tableHeaderStyle}>Child Customer</th>
                                    <th className={tableHeaderStyle}>Contact Person</th>
                                    <th className={tableHeaderStyle}>City</th>
                                    <th className={tableHeaderStyle}>Mobile</th>
                                    <th className={tableHeaderStyle}>Email</th>
                                    <th className={tableHeaderStyle}>GST No.</th>
                                    <th className={tableHeaderStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(customer => (
                                        <tr key={customer.id}>
                                            <td className={tableCellStyle}>{customer.customerCode}</td>
                                            <td className={tableCellStyle}>{customer.customerName}</td>
                                            <td className={tableCellStyle}>{customer.childCustomer || customer.customerName}</td>
                                            <td className={tableCellStyle}>{customer.contactPerson || 'N/A'}</td>
                                            <td className={tableCellStyle}>{customer.city || 'N/A'}</td>
                                            <td className={tableCellStyle}>{customer.mobile || 'N/A'}</td>
                                            <td className={tableCellStyle}>{customer.email || 'N/A'}</td>
                                            <td className={tableCellStyle}>{customer.gstNo || 'N/A'}</td>
                                            <td className={`${tableCellStyle} space-x-2`}>
                                                <Link href={`/customer?id=${customer.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</Link>
                                                <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="text-center text-gray-600">No customers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}