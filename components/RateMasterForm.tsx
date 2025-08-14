'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { CustomerMaster, RateMaster } from '@prisma/client';
import { toast } from 'sonner';
import { StateType, ZoneType } from '@/lib/types';

type RateFormData = Omit<RateMaster, 'id' | 'createdAt' | 'updatedAt' | 'customerId' | 'zone' | 'state'> & {
    zoneId?: string;
    stateId?: string;
};

const initialFormData: RateFormData = {
    mode: 'ALL',
    consignmentType: 'ALL',
    zoneId: 'ALL',
    stateId: 'ALL',
    city: '',
    fromWeight: 0,
    toWeight: 0,
    rate: 0,
    hasAdditionalRate: false,
    additionalWeight: 0,
    additionalRate: 0,
};

export default function RateMasterForm() {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(null);
    const [rates, setRates] = useState<RateMaster[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<RateFormData>(initialFormData);
    const [editingRateId, setEditingRateId] = useState<string | null>(null);
    const [zones, setZones] = useState<ZoneType[]>([]);
    const [states, setStates] = useState<StateType[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            axios.get('/api/zone-master'),
            axios.get('/api/state-master')
        ])
            .then(([zonesRes, statesRes]) => {
                setZones(zonesRes.data);
                setStates(statesRes.data);
            })
            .catch(error => {
                toast.error("Failed to load zones or states");
                console.error(error);
            });
    }, []);
    useEffect(() => {
        if (formData.stateId && formData.stateId !== 'ALL') {
            const selectedState = states.find(s => s.id === formData.stateId);
            setCities(selectedState?.cities || []);
        } else {
            setCities([]);
        }
    }, [formData.stateId, states]);
    useEffect(() => {
        const fetchAllCustomers = async () => {
            try {
                const response = await axios.get('/api/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
                setMessage("Could not load customers list.");
                toast.error("Failed to load customers");
            }
        };
        fetchAllCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            const fetchRates = async () => {
                setIsLoading(true);
                setMessage('');
                try {
                    const response = await axios.get(`/api/rates?customerId=${selectedCustomer.id}`);
                    setRates(response.data);
                } catch (error) {
                    console.error("Failed to fetch rates", error);
                    setMessage("Could not load rates for this customer.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRates();
        } else {
            setRates([]);
        }
    }, [selectedCustomer]);

    const filteredRates = useMemo(() => {
        return rates.filter(rate => {
            const cityFilter = formData.city.trim().toLowerCase();
            return (
                (formData.mode === 'ALL' || rate.mode === formData.mode) &&
                (formData.consignmentType === 'ALL' || rate.consignmentType === formData.consignmentType) &&
                (formData.zoneId === 'ALL' || rate.zoneId === formData.zoneId) &&
                (formData.stateId === 'ALL' || rate.stateId === formData.stateId) &&
                (cityFilter === '' || rate.city.toLowerCase().includes(cityFilter))
            );
        });
    }, [rates, formData]);

    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value;
        const customer = customers.find(c => c.id === customerId) || null;
        setSelectedCustomer(customer);
        setFormData(initialFormData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const isNumber = type === 'number';

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : isNumber ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        setIsLoading(true);
        if (editingRateId) {
            try {
                const response = await axios.put(`/api/rates/${editingRateId}`, formData);
                setRates(prev => prev.map(r => r.id === editingRateId ? response.data : r));
                setMessage("Rate updated successfully!");
                toast.success("Rate updated successfully");
                handleCancelEdit();
            } catch (error) {
                toast.error("Error updating rate");
                console.error("Failed to update rate", error);
                setMessage("Error updating rate.");

            } finally {
                setIsLoading(false);
            }
        } else {
            try {
                const response = await axios.post('/api/rates', { ...formData, customerId: selectedCustomer.id });
                setRates(prev => [...prev, response.data]);
                setFormData(prev => ({
                    ...prev,
                    fromWeight: 0,
                    toWeight: 0,
                    rate: 0,
                    hasAdditionalRate: false,
                    additionalWeight: 0,
                    additionalRate: 0,
                }));
                setMessage("Rate added successfully!");
                toast.success("Rate added successfully");
            } catch (error) {
                console.error("Failed to add rate", error);
                setMessage("Error adding rate.");
                toast.error("Error adding rate");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEditCLick = (rate: RateMaster) => {
        setFormData(rate);
        setEditingRateId(rate.id);
        window.scrollTo(0, 0);
    }

    const handleCancelEdit = () => {
        setEditingRateId(null);
        setFormData(initialFormData);
    };

    const handleDeleteRate = async (rateId: string) => {
        if (!confirm("Are you sure you want to delete this rate?")) return;
        try {
            await axios.delete(`/api/rates/${rateId}`);
            setRates(prev => prev.filter(rate => rate.id !== rateId));
            toast.success("Rate deleted successfully");
            setMessage("Rate deleted successfully.");
        } catch (error) {
            console.error("Failed to delete rate", error);
            toast.error("Error deleting rate");
            setMessage("Error deleting rate.");
        }
    };

    const inputStyle = "w-full p-2 cursor-pointer text-gray-600 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelStyle = "block cursor-pointer text-sm font-medium text-gray-700 mb-1";
    const buttonStyle = `${editingRateId ? 'px-1' : 'px-4'} py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`;

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white">CUSTOMER RATE MASTER</h1>
                </div>

                <div className="p-6 border-b">
                    <label htmlFor="customerSelect" className={labelStyle}>Select Customer</label>
                    <select id="customerSelect" onChange={handleCustomerChange} value={selectedCustomer?.id || ''} className={inputStyle}>
                        <option value="" className='cursor-pointer text-gray-600'>-- Select a Customer --</option>
                        {customers.map(customer => (
                            <option className='cursor-pointer text-gray-600' key={customer.id} value={customer.id}>
                                {customer.customerName} ({customer.customerCode})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedCustomer && (
                    <form onSubmit={handleSubmit} className="p-6 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{editingRateId ? "Edit Rate" : "Add New Rate"}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
                            <div>
                                <label htmlFor="mode" className={labelStyle}>Mode</label>
                                <select name="mode" value={formData.mode} onChange={handleChange} className={inputStyle}>
                                    <option value="ALL">ALL</option>
                                    <option value="AIR">AIR</option>
                                    <option value="ROAD">ROAD</option>
                                    <option value="TRAIN">TRAIN</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="consignmentType" className={labelStyle}>Con. Type</label>
                                <select name="consignmentType" value={formData.consignmentType} onChange={handleChange} className={inputStyle}>
                                    <option value="ALL">ALL</option>
                                    <option value="DOCUMENT">DOCUMENT</option>
                                    <option value="PARCEL">PARCEL</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="zone" className={labelStyle}>Zone Wise</label>
                                <select name="zoneId" id="zoneSelect" value={formData.zoneId} onChange={handleChange} className={inputStyle}>
                                    <option value="ALL">ALL</option>
                                    {zones.map(z => (
                                        <option key={z.code} value={z.id} className='uppercase'>{z.code.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="state" className={labelStyle}>State Wise</label>
                                <select name="stateId" id="stateSelect" value={formData.stateId} onChange={handleChange} className={inputStyle}>
                                    <option value="ALL">ALL</option>
                                    {states.map(s => (
                                        <option key={s.code} value={s.id}>{s.code.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city" className={labelStyle}>City Wise</label>
                                {/* <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputStyle} placeholder='All' /> */}
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="ALL">ALL</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.name}>{city.code.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div />

                            <div>
                                <label htmlFor="fromWeight" className={labelStyle}>From Weight</label>
                                <input type="number" name="fromWeight" value={formData.fromWeight} onChange={handleChange} className={inputStyle} step="0.001" />
                            </div>
                            <div>
                                <label htmlFor="toWeight" className={labelStyle}>To Weight</label>
                                <input type="number" name="toWeight" value={formData.toWeight} onChange={handleChange} className={inputStyle} step="0.001" />
                            </div>
                            <div>
                                <label htmlFor="rate" className={labelStyle}>Rate</label>
                                <input type="number" name="rate" value={formData.rate} onChange={handleChange} className={inputStyle} step="0.01" />
                            </div>
                            <div className="flex items-center pt-6">
                                <input type="checkbox" name="hasAdditionalRate" checked={formData.hasAdditionalRate} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <label htmlFor="hasAdditionalRate" className="ml-2 text-sm font-medium text-gray-700">Addnl. Rate?</label>
                            </div>
                            {formData.hasAdditionalRate && (
                                <>
                                    <div>
                                        <label htmlFor="additionalWeight" className={labelStyle}>Addnl. Weight</label>
                                        <input type="number" name="additionalWeight" value={formData.additionalWeight ?? 0} onChange={handleChange} className={inputStyle} step="0.001" />
                                    </div>
                                    <div>
                                        <label htmlFor="additionalRate" className={labelStyle}>Addnl. Rate</label>
                                        <input type="number" name="additionalRate" value={formData.additionalRate ?? 0} onChange={handleChange} className={inputStyle} step="0.01" />
                                    </div>
                                </>
                            )}
                            <div className="col-start-6 flex items-end">
                                {editingRateId && (
                                    <button type="button" onClick={handleCancelEdit} className={`${buttonStyle} w-full mr-2 cursor-pointer`}>
                                        Cancel Edit
                                    </button>
                                )}
                                <button type="submit" className={`${buttonStyle} w-full cursor-pointer`} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : (editingRateId ? 'Update Rate' : 'Add Rate')}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Rates Table */}
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                        {selectedCustomer ? `Rate Master Entry for ${selectedCustomer.customerName}` : 'Rate Master Entries'}
                    </h2>
                    {message && <p className="text-sm text-blue-600 mb-4">{message}</p>}
                    <div className="overflow-x-auto overflow-y-auto h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Con. Type</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wt. From</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wt. To</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Addnl. Wt</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Addnl. Rate</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 ">
                                {isLoading ? (
                                    <tr><td colSpan={11} className="text-center py-4">Loading rates...</td></tr>
                                ) : filteredRates.length > 0 ? (
                                    filteredRates.map(rate => (
                                        <tr key={rate.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.mode}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.consignmentType}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">
                                                {zones.find(z => z.id === rate.zoneId)?.code.toUpperCase() || ''}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">
                                                {states.find(s => s.id === rate.stateId)?.code.toUpperCase() || ''}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.city.toUpperCase()}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.fromWeight}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.toWeight}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.rate.toFixed(2)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.hasAdditionalRate ? rate.additionalWeight?.toFixed(3) : 'N/A'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{rate.hasAdditionalRate ? rate.additionalRate?.toFixed(2) : 'N/A'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">
                                                <button onClick={() => handleEditCLick(rate)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</button>
                                                <button onClick={() => handleDeleteRate(rate.id)} className="text-red-600 hover:text-red-900 cursor-pointer">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="text-center text-gray-500 py-4">
                                            {selectedCustomer ? 'No rates found for this customer.' : 'Please select a customer to view their rates.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}