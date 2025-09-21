'use client';

import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CustomerFormData = {
  customerCode: string;
  customerName: string;
  childCustomer?: string;
  contactPerson?: string;
  address?: string;
  pincode?: string;
  city?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  isInternational: boolean;
  ownership?: string;
  contractNo?: string;
  contractDate?: string;
  panNo?: string;
  gstNo?: string;
  fuelSurchargePercent?: number;
  discountPercent?: number;
  openingBalance?: number;
  balanceType?: 'Dr' | 'Cr';
};

const initialFormData: CustomerFormData = {
  customerCode: '',
  customerName: '',
  childCustomer: '',
  contactPerson: '',
  address: '',
  pincode: '',
  city: '',
  mobile: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  isInternational: false,
  ownership: '',
  contractNo: '',
  contractDate: '',
  panNo: '',
  gstNo: '',
  fuelSurchargePercent: 0,
  discountPercent: 0,
  openingBalance: 0,
  balanceType: 'Dr',
};

export default function CustomerForm() {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [pincodes, setPincodes] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get('id');

  useEffect(() => {
    axios.get('/api/pincode-master').then(res => setPincodes(res.data));
    if (customerId) {
      const fetchCustomerData = async () => {
        try {
          const response = await axios.get(`/api/customers/${customerId}`);
          const customerData = response.data;
          const data = {
            ...customerData,
            dateOfBirth: customerData.dateOfBirth ? customerData.dateOfBirth.split('T')[0] : '',
            contractDate: customerData.contractDate ? customerData.contractDate.split('T')[0] : '',
            childCustomer: customerData.childCustomer || customerData.customerName,
          };
          setFormData(data);
        } catch (error) {
          console.error("Failed to fetch customer data", error);
          toast.error("Error loading customer data");
          setMessage("Could not load customer data for editing.");
        }
      };
      fetchCustomerData();
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'pincode') {
      const matched = pincodes.find(pin => pin.pincode === value);
      setFormData(prev => ({
        ...prev,
        pincode: value,
        city: matched?.city?.name || ''
      }));
    } else if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'customerName') {
      setFormData(prev => ({ ...prev, customerName: value, childCustomer: value }));
    }
  };

  const handleGenerateCode = async () => {
    try{
      const response = await axios.get('/api/customers/next-code');
      const nextNumber = response.data.nextNumber;
  
      const formattedNumber = String(nextNumber).padStart(4, '0');
      const generatedCode = `CUST-${formattedNumber}`;
      setFormData(prev => ({ ...prev, customerCode: generatedCode }));
    }catch(e){
      console.error("Error generating customer code", e);
      toast.error("Error generating customer code");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(customerId ? 'Updating customer...' : 'Saving customer...');

    try {
      const submissionData = {
        ...formData,
        fuelSurchargePercent: parseFloat(String(formData.fuelSurchargePercent)),
        discountPercent: parseFloat(String(formData.discountPercent)) || 0,
        openingBalance: parseFloat(String(formData.openingBalance)) || 0,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        contractDate: formData.contractDate ? new Date(formData.contractDate).toISOString() : null,
      };
      if (customerId) {
        await axios.put(`/api/customers/${customerId}`, submissionData);
        toast.success("Customer updated successfully");
        setMessage('Customer updated successfully!');
        setTimeout(() => router.push('/all-customers'), 1500);
      } else {
        const response = await axios.post('/api/customers', submissionData);
        toast.success("Customer saved successfully");
        setMessage(`Customer saved successfully! ID: ${response.data.id}`);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving customer");
      setMessage('An error occurred while saving the customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 shadow-md">
          <h1 className="text-2xl font-bold text-white">CUSTOMER MASTER</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Customer Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Customer Details</h2>
            </div>
            <div>
              <label htmlFor="customerCode" className={labelStyle}>Customer Code</label>
              <div className='flex items-center'>
                <div className='flex items-center'>
                  <input type="text" name="customerCode" id="customerCode" placeholder='CUSt-XXXXX' value={formData.customerCode} onChange={handleChange} className={inputStyle} required />
                </div>
                <button type="button" onClick={handleGenerateCode} className="ml-2 px-3 text-sm cursor-pointer py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Generate Code
                </button>
              </div>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="customerName" className={labelStyle}>Customer Name</label>
              <input type="text" name="customerName" placeholder='Enter customer name' id="customerName" value={formData.customerName} onChange={handleChange} className={inputStyle} required />
            </div>
            <div className="lg:col-span-3">
              <label htmlFor="childCustomer" className={labelStyle}>Child Customer</label>
              <input type="text" name="childCustomer" id="childCustomer" placeholder='Enter child customer name' value={formData.childCustomer} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="contactPerson" className={labelStyle}>Contact Person</label>
              <input type="text" name="contactPerson" placeholder='Enter contact person name' id="contactPerson" value={formData.contactPerson} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="address" className={labelStyle}>Address</label>
              <input type="text" name="address" placeholder='Enter address' id="address" value={formData.address} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="pincode" className={labelStyle}>Pincode</label>
              <input type="text" name="pincode" placeholder='Enter pincode' id="pincode" value={formData.pincode} onChange={handleChange} className={inputStyle} list="pincode-list" />
              <datalist id="pincode-list">
                {pincodes.map(pin => (
                  <option key={pin.pincode} value={pin.pincode}>
                    {pin.city?.name ? `${pin.pincode} - ${pin.city.name}` : pin.pincode}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="city" className={labelStyle}>City</label>
              <input type="text" name="city" placeholder='Enter city' id="city" value={formData.city?.toUpperCase()} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="mobile" className={labelStyle}>Mobile</label>
              <input type="tel" name="mobile" placeholder='Enter mobile number' id="mobile" value={formData.mobile} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="phone" className={labelStyle}>Phone</label>
              <input type="tel" name="phone" placeholder='Enter phone number' id="phone" value={formData.phone} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="email" className={labelStyle}>Email ID</label>
              <input type="email" name="email" placeholder='Enter email ID' id="email" value={formData.email} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="dateOfBirth" className={labelStyle}>Date of Birth</label>
              <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="ownership" className={labelStyle}>Ownership</label>
              <select name="ownership" id="ownership" value={formData.ownership} onChange={handleChange} className={`cursor-pointer ${inputStyle}`}>
                <option value="">Select</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Public Limited">Public Limited</option>
              </select>
            </div>
            <div className="flex items-center justify-start mt-6">
              <input type="checkbox" name="isInternational" id="isInternational" checked={formData.isInternational} onChange={handleChange} className="h-4 w-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="isInternational" className="ml-2 block text-sm text-gray-900">Is International Customer</label>
            </div>
          </div>

          {/* Contract & Financials Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Contract & Financials</h2> {/* text-color: #1f2937 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label htmlFor="contractNo" className={labelStyle}>Contract No</label>
                <input type="text" name="contractNo" id="contractNo" placeholder='Enter contract number' value={formData.contractNo} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="contractDate" className={labelStyle}>Contract Date</label>
                <input type="date" name="contractDate" id="contractDate" placeholder='Select contract date' value={formData.contractDate} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="panNo" className={labelStyle}>PAN No.</label>
                <input type="text" name="panNo" id="panNo" placeholder='Enter PAN number' value={formData.panNo} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="gstNo" className={labelStyle}>GST No.</label>
                <input type="text" name="gstNo" id="gstNo" placeholder='Enter GST number' value={formData.gstNo} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="fuelSurchargePercent" className={labelStyle}>Fuel Surcharge %</label>
                <input type="number" name="fuelSurchargePercent" id="fuelSurchargePercent" placeholder='Enter Fuel Surcharge %' value={formData.fuelSurchargePercent} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="discountPercent" className={labelStyle}>Discount %</label>
                <input type="number" name="discountPercent" id="discountPercent" placeholder='Enter Discount %' value={formData.discountPercent} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="openingBalance" className={labelStyle}>Opening Balance</label>
                <input type="number" name="openingBalance" id="openingBalance" placeholder='Enter Opening Balance' value={formData.openingBalance} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="balanceType" className={labelStyle}>Balance Type</label>
                <select name="balanceType" id="balanceType" value={formData.balanceType} onChange={handleChange} className={inputStyle}>
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            {message && <p className="text-sm text-gray-600">{message}</p>}
            <button type="button" className="px-6 py-2 cursor-pointer border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 cursor-pointer border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"> {/* bg-color: #2563eb, hover: #1d4ed8 */}
              {isSubmitting ? 'Saving...' : (customerId ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}