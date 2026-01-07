'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { CustomerMaster, SectorRate } from '@prisma/client';
import { toast } from 'sonner';
import { Copy, Loader2, Download } from 'lucide-react';

export default function CopyRatesPage() {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [sourceCustomerId, setSourceCustomerId] = useState<string>('');
    const [sourceSectors, setSourceSectors] = useState<SectorRate[]>([]);
    const [selectedSectorNames, setSelectedSectorNames] = useState<Set<string>>(new Set());
    const [destinationCustomerIds, setDestinationCustomerIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSectors, setIsFetchingSectors] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data } = await axios.get('/api/customers');
                setCustomers(data);
            } catch (error) {
                toast.error("Failed to load customer list.");
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (sourceCustomerId) {
            const fetchSourceSectors = async () => {
                setIsFetchingSectors(true);
                try {
                    const { data } = await axios.get(`/api/sector-rates?customerId=${sourceCustomerId}`);
                    setSourceSectors(data);
                } catch (error) {
                    toast.error("Failed to load sectors for source customer.");
                    setSourceSectors([]);
                } finally {
                    setIsFetchingSectors(false);
                }
            };
            fetchSourceSectors();
        } else {
            setSourceSectors([]);
        }
        setSelectedSectorNames(new Set());
    }, [sourceCustomerId]);

    const handleCheckboxChange = (id: string, type: 'destination' | 'sector') => {
        const stateSetter = type === 'destination' ? setDestinationCustomerIds : setSelectedSectorNames;
        stateSetter(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (type: 'destination' | 'sector') => {
        if (type === 'destination') {
            const allDestIds = customers.filter(c => c.id !== sourceCustomerId).map(c => c.id);
            if (destinationCustomerIds.size === allDestIds.length) {
                setDestinationCustomerIds(new Set()); 
            } else {
                setDestinationCustomerIds(new Set(allDestIds)); 
            }
        } else {
            const allSectorNames = sourceSectors.map(s => s.sectorName);
            if (selectedSectorNames.size === allSectorNames.length) {
                setSelectedSectorNames(new Set()); 
            } else {
                setSelectedSectorNames(new Set(allSectorNames)); 
            }
        }
    };

    const handleCopyRates = async () => {
        if (!sourceCustomerId) {
            toast.warning("Please select a source customer.");
            return;
        }
        if (destinationCustomerIds.size === 0) {
            toast.warning("Please select at least one destination customer.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                sourceCustomerId,
                destinationCustomerIds: Array.from(destinationCustomerIds),
                sectorNames: Array.from(selectedSectorNames),
            };
            const response = await axios.post('/api/copy-rates', payload);
            toast.success(response.data.message);
            setDestinationCustomerIds(new Set());
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to copy rates.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAllRates = () => {
        window.open('/api/sector-rates/download-all', '_blank');
    };

    const destinationCustomers = customers.filter(c => c.id !== sourceCustomerId);

    return (
        <>
            <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Copy Customer Rates</h1>
                            <p className="text-purple-100 mt-1">Copy a complete or partial rate card from one customer to others.</p>
                        </div>
                        <button
                            onClick={handleDownloadAllRates}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            <Download className="w-5 h-5" />
                            Download All Rates
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                        <div className="md:col-span-1">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Copy Rates From:</h2>
                            <select
                                value={sourceCustomerId}
                                onChange={e => setSourceCustomerId(e.target.value)}
                                className="w-full p-3 border text-gray-600 cursor-pointer border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">-- Select Source Customer --</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.customerName} ({customer.customerCode})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold text-gray-800">2. Select Sectors to Copy:</h2>
                                {sourceSectors.length > 0 && (
                                    <button onClick={() => handleSelectAll('sector')} className="text-sm cursor-pointer font-medium text-purple-600 hover:text-purple-800">
                                        {selectedSectorNames.size === sourceSectors.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                            <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50 grid grid-cols-2 gap-2">
                                {isFetchingSectors ? <Loader2 className="animate-spin my-4" /> :
                                 sourceSectors.length > 0 ? sourceSectors.map(sector => (
                                    <div key={sector.id} className="flex items-center">
                                        <input type="checkbox" id={`sector-${sector.id}`} checked={selectedSectorNames.has(sector.sectorName)} onChange={() => handleCheckboxChange(sector.sectorName, 'sector')} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                                        <label htmlFor={`sector-${sector.id}`} className="ml-3 text-sm text-gray-700">{sector.sectorName}</label>
                                    </div>
                                )) : <p className="text-sm text-gray-500 col-span-2">{sourceCustomerId ? 'No sectors found for this customer.' : 'Select a source customer to see sectors.'}</p>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">If no sectors are selected, all rates will be copied.</p>
                        </div>
                    </div>

                    <div className="p-6 border-t">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold text-gray-800">3. Copy Rates To:</h2>
                            {destinationCustomers.length > 0 && (
                                <button onClick={() => handleSelectAll('destination')} className="text-sm cursor-pointer font-medium text-purple-600 hover:text-purple-800">
                                    {destinationCustomerIds.size === destinationCustomers.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {sourceCustomerId ? (
                                destinationCustomers.length > 0 ? (
                                    destinationCustomers.map(customer => (
                                        <div key={customer.id} className="flex items-center">
                                            <input type="checkbox" id={`dest-${customer.id}`} checked={destinationCustomerIds.has(customer.id)} onChange={() => handleCheckboxChange(customer.id, 'destination')} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                                            <label htmlFor={`dest-${customer.id}`} className="ml-3 text-sm text-gray-700">{customer.customerName} ({customer.customerCode})</label>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-gray-500 col-span-full">No other customers available.</p>
                            ) : <p className="text-sm text-gray-500 col-span-full">Select a source customer first.</p>}
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 flex justify-end">
                        <button
                            onClick={handleCopyRates}
                            disabled={isLoading || !sourceCustomerId || destinationCustomerIds.size === 0}
                            className="px-6 py-3 text-white bg-purple-600 cursor-pointer rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Copy size={18} />}
                            {isLoading ? 'Copying...' : `Copy to ${destinationCustomerIds.size} Customer(s)`}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}