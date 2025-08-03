'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { CustomerMaster, RateMaster } from '@prisma/client';

export default function CopyRatesForm() {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [sourceCustomerId, setSourceCustomerId] = useState<string>('');
    const [targetCustomerId, setTargetCustomerId] = useState<string>('');
    const [sourceRates, setSourceRates] = useState<RateMaster[]>([]);
    const [selectedRateIds, setSelectedRateIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchAllCustomers = async () => {
            try {
                const response = await axios.get('/api/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
            }
        };
        fetchAllCustomers();
    }, []);

    useEffect(() => {
        if (sourceCustomerId) {
            const fetchRates = async () => {
                setIsLoading(true);
                setMessage('');
                try {
                    const response = await axios.get(`/api/rates?customerId=${sourceCustomerId}`);
                    setSourceRates(response.data);
                } catch (error) {
                    console.error("Failed to fetch rates", error);
                    setMessage("Could not load rates for this customer.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRates();
        } else {
            setSourceRates([]);
        }
        setSelectedRateIds(new Set());  
    }, [sourceCustomerId]);

    const handleSelectRate = (rateId: string) => {
        setSelectedRateIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(rateId)) {
                newSelection.delete(rateId);
            } else {
                newSelection.add(rateId);
            }
            return newSelection;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRateIds(new Set(sourceRates.map(r => r.id)));
        } else {
            setSelectedRateIds(new Set());
        }
    };

    const handleCopyRates = async () => {
        if (!targetCustomerId || selectedRateIds.size === 0) {
            setMessage("Please select a target customer and at least one rate to copy.");
            return;
        }
        setIsCopying(true);
        setMessage('');
        try {
            await axios.post('/api/rates/copy', {
                targetCustomerId,
                rateIds: Array.from(selectedRateIds),
            });
            setMessage(`${selectedRateIds.size} rates copied successfully to the target customer!`);
            setSelectedRateIds(new Set());  
        } catch (error) {
            console.error("Failed to copy rates", error);
            setMessage("An error occurred while copying rates.");
        } finally {
            setIsCopying(false);
        }
    };

    const inputStyle = "w-full p-2 text-gray-600 cursor-pointer border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelStyle = "block text-sm font-medium text-gray-700 cursor-pointer mb-1";
    const thStyle = "px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase";

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white">COPY RATES</h1>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b">
                    <div>
                        <label htmlFor="sourceCustomer" className={labelStyle}>Source Customer</label>
                        <select id="sourceCustomer" value={sourceCustomerId} onChange={e => setSourceCustomerId(e.target.value)} className={inputStyle}>
                            <option value="" className='text-gray-600'>-- Select Source --</option>
                            {customers.map(c => <option key={c.id} value={c.id} className='text-gray-600 cursor-pointer'>{c.customerName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="targetCustomer" className={labelStyle}>Target Customer</label>
                        <select id="targetCustomer" value={targetCustomerId} onChange={e => setTargetCustomerId(e.target.value)} className={inputStyle} disabled={!sourceCustomerId}>
                            <option value="">-- Select Target --</option>
                            {customers.filter(c => c.id !== sourceCustomerId).map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                        </select>
                    </div>
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto h-96 border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className={thStyle}><input type="checkbox" onChange={handleSelectAll} checked={sourceRates.length > 0 && selectedRateIds.size === sourceRates.length} /></th>
                                    <th className={thStyle}>Mode</th>
                                    <th className={thStyle}>Con.Type</th>
                                    <th className={thStyle}>Zone</th>
                                    <th className={thStyle}>State</th>
                                    <th className={thStyle}>City</th>
                                    <th className={thStyle}>Wt.From</th>
                                    <th className={thStyle}>Wt.To</th>
                                    <th className={thStyle}>Rate</th>
                                    <th className={thStyle}>AddNl</th>
                                    <th className={thStyle}>AddNl Wt</th>
                                    <th className={thStyle}>AddNl Rate</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={12} className="text-center py-4">Loading rates...</td></tr>
                                ) : sourceRates.length > 0 ? (
                                    sourceRates.map(rate => (
                                        <tr key={rate.id}>
                                            <td className="px-3 py-2"><input type="checkbox" checked={selectedRateIds.has(rate.id)} onChange={() => handleSelectRate(rate.id)} /></td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.mode}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.consignmentType}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.zone}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.state}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.city}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.fromWeight.toFixed(3)}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.toWeight.toFixed(3)}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.rate.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.hasAdditionalRate ? 'Y' : 'N'}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.additionalWeight?.toFixed(3) ?? '0.000'}</td>
                                            <td className="px-3 py-2 text-gray-600 text-sm">{rate.additionalRate?.toFixed(2) ?? '0.00'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={12} className="text-center py-4">{sourceCustomerId ? 'No rates found for this customer.' : 'Please select a source customer.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-6 flex justify-between items-center border-t">
                    {message && <p className="text-sm text-blue-600">{message}</p>}
                    <button onClick={handleCopyRates} disabled={isCopying || selectedRateIds.size === 0 || !targetCustomerId} className="px-6 py-2 cursor-pointer bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isCopying ? 'Copying...' : `Copy ${selectedRateIds.size} Rates`}
                    </button>
                </div>
            </div>
        </div>
    );
}