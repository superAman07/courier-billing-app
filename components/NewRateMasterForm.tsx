'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { CustomerMaster } from '@prisma/client';
import { toast } from 'sonner';
import { Edit, Loader2, Save, Trash2 } from 'lucide-react';

type SectorRate = {
    id?: string;
    sectorName: string;
    serviceProvider?: string;
    bulkMinWeightSurface?: number;
    bulkMinWeightAir?: number;
    bulkRateSurfaceUpto20?: number;
    bulkRateSurfaceAbove20?: number;
    bulkRateAirUpto20?: number;
    bulkRateAirAbove20?: number;
    doxUpto100g?: number;
    doxUpto250g?: number;
    doxAdd250g?: number;
    doxUpto500g?: number;
    doxAdd500g?: number;
    premiumUpto250g?: number;
    premiumAdd250g?: number;
    premiumUpto500g?: number;
    premiumAdd500g?: number;
};

const SECTORS = [
    "Local", "UP", "UK", "Delhi", "Bihaar / Jharkhand",
    "North (Haryana / Punjaab / Rajasthaan)",
    "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)",
    "Rest of India", "North East", "Special Sector ( Darjling, Silchaar, Daman)"
];

const initialFormState: Omit<SectorRate, 'sectorName'> = {
    serviceProvider: "DTDC"
};

export default function NewRateMasterForm() {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(null);
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [rates, setRates] = useState<SectorRate[]>([]);
    const [formData, setFormData] = useState<Omit<SectorRate, 'sectorName'>>(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchAllCustomers = async () => {
            try {
                const response = await axios.get('/api/customers');
                setCustomers(response.data);
            } catch (error) {
                toast.error("Failed to load customers list.");
            }
        };
        fetchAllCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            const fetchRates = async () => {
                setIsLoading(true);
                try {
                    const response = await axios.get(`/api/sector-rates?customerId=${selectedCustomer.id}`);
                    setRates(response.data);
                } catch (error) {
                    toast.error("Could not load rates for this customer.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRates();
        } else {
            setRates([]);
        }
    }, [selectedCustomer]);

    useEffect(() => {
        if (selectedSector) {
            const existingRate = rates.find(r => r.sectorName === selectedSector);
            setFormData(existingRate || { ...initialFormState, serviceProvider: 'DTDC' });
        } else {
            setFormData(initialFormState);
        }
    }, [selectedSector, rates]);

    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value;
        const customer = customers.find(c => c.id === customerId) || null;
        setSelectedCustomer(customer);
        setSelectedSector('');
        setFormData(initialFormState);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Weight') || name.includes('Rate') || name.includes('dox') || name.includes('premium')
                ? (value === '' ? undefined : parseFloat(value))
                : value,
        }));
    };

    const handleDelete = async (rateId: string, sectorName: string) => {
        if (!window.confirm(`Are you sure you want to delete the rates for ${sectorName}?`)) {
            return;
        }
        try {
            await axios.delete(`/api/sector-rates/${rateId}`);
            toast.success(`Rates for ${sectorName} deleted.`);
            setRates(prev => prev.filter(r => r.id !== rateId));
            if (selectedSector === sectorName) {
                setSelectedSector('');
                setFormData(initialFormState);
            }
        } catch (error) {
            toast.error("Failed to delete rates.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !selectedSector) {
            toast.warning("Please select a customer and a sector.");
            return;
        }
        setIsLoading(true);
        try {
            const payload = {
                customerId: selectedCustomer.id,
                sectorName: selectedSector,
                ...formData
            };
            const response = await axios.post('/api/sector-rates', payload);
            toast.success(`Rates for ${selectedSector} saved successfully!`);

            setRates(prev => {
                const index = prev.findIndex(r => r.sectorName === selectedSector);
                if (index > -1) {
                    const newRates = [...prev];
                    newRates[index] = response.data;
                    return newRates;
                }
                return [...prev, response.data];
            });
        } catch (error) {
            toast.error("Error saving rates.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = "w-full p-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500";
    const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

    const renderRateField = (name: keyof Omit<SectorRate, 'sectorName'>, label: string, step = "0.01") => (
        <div>
            <label htmlFor={name} className={labelStyle}>{label}</label>
            <input
                id={name}
                name={name}
                type="number"
                value={formData[name] ?? ''}
                onChange={handleChange}
                className={inputStyle}
                placeholder="NA"
                step={step}
            />
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
                    <h1 className="text-2xl font-bold text-white">Customer Sector Rate Master</h1>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b">
                    <div>
                        <label htmlFor="customerSelect" className="block text-base font-medium text-gray-800 mb-2">1. Select Customer</label>
                        <select id="customerSelect" onChange={handleCustomerChange} value={selectedCustomer?.id || ''} className={`${inputStyle} text-base cursor-pointer`}>
                            <option value="">-- Select a Customer --</option>
                            {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.customerName} ({customer.customerCode})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sectorSelect" className="block text-base font-medium text-gray-800 mb-2">2. Select Sector</label>
                        <select id="sectorSelect" onChange={e => setSelectedSector(e.target.value)} value={selectedSector} className={`${inputStyle} text-base cursor-pointer`} disabled={!selectedCustomer}>
                            <option value="">-- Select a Sector --</option>
                            {SECTORS.map(sector => (
                                <option key={sector} value={sector}>{sector}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedCustomer && rates.length > 0 && (
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Saved Rates for {selectedCustomer.customerName}</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bulk Surface Rate (&lt;20kg)</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dox Rate (&lt;250g)</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rates.map(rate => (
                                        <tr key={rate.id}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{rate.sectorName}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{rate.serviceProvider ?? 'NA'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{rate.bulkRateSurfaceUpto20 ?? 'NA'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{rate.doxUpto250g ?? 'NA'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => setSelectedSector(rate.sectorName)} className="text-indigo-600 hover:text-indigo-900 p-1">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(rate.id!, rate.sectorName)} className="text-red-600 hover:text-red-900 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Rate Entry Form */}
                {selectedCustomer && selectedSector && (
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    Editing Rates for: <span className="text-blue-600">{selectedSector}</span>
                                </h2>
                            </div>
                            <div className="w-1/4">
                                <label htmlFor="serviceProvider" className={labelStyle}>Service Provider</label>
                                <select
                                    id="serviceProvider"
                                    name="serviceProvider"
                                    value={formData.serviceProvider ?? 'DTDC'}
                                    onChange={handleChange}
                                    className={`${inputStyle} cursor-pointer`}
                                >
                                    <option value="DTDC">DTDC</option>
                                    <option value="Trackon">Trackon</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Bulk Load (Non-Dox)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {renderRateField('bulkMinWeightSurface', 'Min Wt Surface (KG)', '0.1')}
                                {renderRateField('bulkMinWeightAir', 'Min Wt Air (KG)', '0.1')}
                                {renderRateField('bulkRateSurfaceUpto20', 'Surface < 20KG Rate')}
                                {renderRateField('bulkRateSurfaceAbove20', 'Surface > 20KG Rate')}
                                {renderRateField('bulkRateAirUpto20', 'Air < 20KG Rate')}
                                {renderRateField('bulkRateAirAbove20', 'Air > 20KG Rate')}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Doox (Documents)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {renderRateField('doxUpto100g', 'Upto 100g')}
                                {renderRateField('doxUpto250g', 'Upto 250g')}
                                {renderRateField('doxAdd250g', 'Add 250g')}
                                {renderRateField('doxUpto500g', 'Upto 500g')}
                                {renderRateField('doxAdd500g', 'Add 500g')}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Premium RS (Dox / Non Dox)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {renderRateField('premiumUpto250g', 'Upto 250g')}
                                {renderRateField('premiumAdd250g', 'Add 250g')}
                                {renderRateField('premiumUpto500g', 'Upto 500g')}
                                {renderRateField('premiumAdd500g', 'Add 500g')}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button type="submit" className="px-6 cursor-pointer py-2 text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                {isLoading ? 'Saving...' : 'Save Rates for this Sector'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}