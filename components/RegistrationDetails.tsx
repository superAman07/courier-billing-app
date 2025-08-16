'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type RegistrationDetailsForm = {
    id?: string;
    companyName: string;
    ownerName: string;
    address: string;
    pincode: string;
    city: string;
    state: string;
    phone?: string;
    mobile?: string;
    email?: string;
    panNo?: string;
    gstNo?: string;
    serviceTaxNo?: string;
    hsnSacCode?: string;
    stateCode?: string;
    associateWith?: string;
    bankName?: string;
    bankAccountNo?: string;
    ifscCode?: string;
};

const initialForm: RegistrationDetailsForm = {
    companyName: '',
    ownerName: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    phone: '',
    mobile: '',
    email: '',
    panNo: '',
    gstNo: '',
    serviceTaxNo: '',
    hsnSacCode: '',
    stateCode: '',
    associateWith: 'SYSCONIC TECH LTD.',
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
};

export default function RegistrationDetailsPage() {
    const [form, setForm] = useState<RegistrationDetailsForm>(initialForm);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [registrations, setRegistrations] = useState<RegistrationDetailsForm[]>([]);
    const [pincodes, setPincodes] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        axios.get('/api/registration-details').then(res => setRegistrations(res.data));
        axios.get('/api/pincode-master').then(res => setPincodes(res.data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            const matched = pincodes.find((p: any) => p.pincode === value);
            setForm(prev => ({
                ...prev,
                pincode: value,
                city: matched?.city?.name || '',
                state: matched?.state?.name || '',
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingIndex !== null) {
                const reg = registrations[editingIndex];
                await axios.put(`/api/registration-details/${reg.id}`, form);
                toast.success("Registration updated");
                setEditingIndex(null);
            } else {
                await axios.post('/api/registration-details', form);
                toast.success("Registration added");
            }
            axios.get('/api/registration-details').then(res => setRegistrations(res.data));
            setForm(initialForm);
        } catch {
            toast.error("Error saving registration");
        }
    };

    const handleEdit = (idx: number) => {
        setForm(registrations[idx]);
        setEditingIndex(idx);
    };

    const handleDelete = async (idx: number) => {
        const reg = registrations[idx];
        if (!confirm(`Delete registration for "${reg.companyName}"?`)) return;
        try {
            await axios.delete(`/api/registration-details/${reg.id}`);
            toast.success("Registration deleted");
            axios.get('/api/registration-details').then(res => setRegistrations(res.data));
            setEditingIndex(null);
            setForm(initialForm);
        } catch {
            toast.error("Error deleting registration");
        }
    };

    const filtered = registrations.filter(r =>
        r.companyName.toLowerCase().includes(search.toLowerCase()) ||
        r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        r.pincode.includes(search)
    );

    const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
    const sectionHeader = "text-lg font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded mb-4 mt-6 border-l-4 border-blue-600";

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white">REGISTRATION DETAILS</h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-0">
                    <div>
                        <div className={sectionHeader}>Firm Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelStyle}>Company Name <span className="text-red-600">*</span></label>
                                <input name="companyName" placeholder='Enter company name' value={form.companyName} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>Owner Name <span className="text-red-600">*</span></label>
                                <input name="ownerName" placeholder='Enter owner name' value={form.ownerName} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>Address <span className="text-red-600">*</span></label>
                                <textarea name="address" placeholder='Enter address' value={form.address} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>Pincode <span className="text-red-600">*</span></label>
                                <input name="pincode" placeholder='Enter pincode' value={form.pincode} onChange={handleChange} className={inputStyle} list="pincode-list" required />
                                <datalist id="pincode-list">
                                    {pincodes.map((p: any) => (
                                        <option key={p.pincode} value={p.pincode}>
                                            {p.pincode} - {p.city?.name || ''} {p.state?.name || ''}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className={labelStyle}>City <span className="text-red-600">*</span></label>
                                <input name="city" value={form.city.toUpperCase()} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>State <span className="text-red-600">*</span></label>
                                <input name="state" value={form.state.toUpperCase()} onChange={handleChange} className={inputStyle} required />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div>
                            <div className={sectionHeader}>Phone / Mobile / E-mail Details</div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Phone No.</label>
                                    <input name="phone" placeholder='Enter phone number' value={form.phone} onChange={handleChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Mobile <span className="text-red-600">*</span></label>
                                    <input name="mobile" placeholder='Enter mobile number' value={form.mobile} onChange={handleChange} className={inputStyle} required />
                                </div>
                                <div>
                                    <label className={labelStyle}>E-mail Id <span className="text-red-600">*</span></label>
                                    <input name="email" placeholder='Enter email id' value={form.email} onChange={handleChange} className={inputStyle} required />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className={sectionHeader}>Business Details</div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>PAN No <span className="text-red-600">*</span></label>
                                    <input name="panNo" placeholder='Enter PAN number' value={form.panNo} onChange={handleChange} className={inputStyle} required />
                                </div>
                                <div>
                                    <label className={labelStyle}>GST No <span className="text-red-600">*</span></label>
                                    <input name="gstNo" placeholder='Enter GST number' value={form.gstNo} onChange={handleChange} className={inputStyle} required />
                                </div>
                                <div>
                                    <label className={labelStyle}>HSN/SAC Code</label>
                                    <input name="hsnSacCode" placeholder='Enter HSN/SAC code' value={form.hsnSacCode} onChange={handleChange} className={inputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className={sectionHeader}>Associated With</div>
                        <input name="associateWith" value={form.associateWith} onChange={handleChange} className={inputStyle} />
                    </div>

                    <div className="mt-8">
                        <div className={sectionHeader}>Bank Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelStyle}>Bank Name</label>
                                <input name="bankName" placeholder='Enter bank name' value={form.bankName?.toUpperCase()} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Bank Account No</label>
                                <input type='number' name="bankAccountNo" placeholder='Enter bank account number' value={form.bankAccountNo?.toString().toUpperCase()} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>IFSC Code</label>
                                <input name="ifscCode" placeholder='Enter IFSC code' value={form.ifscCode?.toUpperCase()} onChange={handleChange} className={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end space-x-4 mt-8">
                        <button type="submit" className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer text-lg font-semibold">
                            {editingIndex !== null ? 'Update' : 'Add'}
                        </button>
                        {editingIndex !== null && (
                            <button type="button" onClick={() => { setEditingIndex(null); setForm(initialForm); }} className="px-8 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded cursor-pointer text-lg font-semibold">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="px-6 pb-2 flex items-center space-x-2 mt-8">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Registration" className="p-2 border rounded text-gray-500 border-gray-300" />
                    <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => setSearch('')}>Clear</button>
                </div>
                <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pincode</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((reg, idx) => (
                                <tr key={reg.id}>
                                    <td className="px-3 py-2 text-gray-600">{reg.companyName}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.ownerName}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.pincode}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.city.toUpperCase()}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.state.toUpperCase()}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.mobile}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.email}</td>
                                    <td className="px-3 py-2 text-center">
                                        <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}