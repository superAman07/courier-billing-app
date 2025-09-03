'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type EmployeeForm = {
  id?: string;
  employeeCode: string;
  employeeName: string;
  address?: string;
  pincode?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  sex?: string;
  email?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  photoUrl?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  workingHours?: number | string;
};

const initialForm: EmployeeForm = {
  employeeCode: '',
  employeeName: '',
  address: '',
  pincode: '',
  city: '',
  phone: '',
  mobile: '',
  sex: 'M',
  email: '',
  maritalStatus: '',
  dateOfBirth: '',
  dateOfJoining: '',
  photoUrl: '',
  shiftStartTime: '10:00',
  shiftEndTime: '18:30',
  workingHours: 8.5,
};

export default function EmployeeMaster() {
  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [employees, setEmployees] = useState<EmployeeForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get('/api/employee-master').then(res => setEmployees(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'radio' ? value : value,
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For demo: just use a local URL. In production, upload to server and save the URL.
    const url = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, photoUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
        dateOfJoining: form.dateOfJoining ? new Date(form.dateOfJoining).toISOString() : null,
        workingHours: form.workingHours ? parseFloat(form.workingHours as string) : null,
      };
      if (editingIndex !== null) {
        const emp = employees[editingIndex];
        await axios.put(`/api/employee-master/${emp.id}`, payload);
        toast.success("Employee updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/employee-master', payload);
        toast.success("Employee added");
      }
      axios.get('/api/employee-master').then(res => setEmployees(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving employee");
    }
  };

  const handleEdit = (idx: number) => {
    const emp = employees[idx];
    setForm({
      ...emp,
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : '',
    });
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const emp = employees[idx];
    if (!confirm(`Delete employee "${emp.employeeName}"?`)) return;
    try {
      await axios.delete(`/api/employee-master/${emp.id}`);
      toast.success("Employee deleted");
      axios.get('/api/employee-master').then(res => setEmployees(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting employee");
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingIndex(null);
  };

  const filtered = employees.filter(emp =>
    emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    (emp.mobile || '').includes(search)
  );

  const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">EMPLOYEE MASTER</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Photo Upload */}
            <div className="flex flex-col items-center justify-start space-y-4">
              <div className="w-120 h-120 border-2 border-gray-300 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Employee Photo" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-gray-400">No Photo</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
              >
                Upload Photo
              </button>
            </div>
            {/* Right: Employee Details */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Employee Code <span className="text-red-600">*</span></label>
                  <input name="employeeCode" placeholder='Enter employee code' value={form.employeeCode} onChange={handleChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Employee Name <span className="text-red-600">*</span></label>
                  <input name="employeeName" placeholder='Enter employee name' value={form.employeeName} onChange={handleChange} className={inputStyle} required />
                </div>
              </div>
              <fieldset className="mt-4 border border-gray-200 rounded p-4">
                <legend className="text-base font-semibold text-blue-700 px-2">Contact Details</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Address</label>
                    <textarea name="address" placeholder='Enter address' value={form.address} onChange={handleChange} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Pincode</label>
                    <input name="pincode" value={form.pincode} placeholder='Enter pincode' onChange={handleChange} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>City</label>
                    <input name="city" value={form.city} placeholder='Enter city' onChange={handleChange} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Phone</label>
                    <input name="phone" value={form.phone} placeholder='Enter phone number' onChange={handleChange} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Mobile</label>
                    <input name="mobile" value={form.mobile} placeholder='Enter mobile number' onChange={handleChange} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Sex</label>
                    <div className="flex items-center text-gray-600 space-x-4 mt-1">
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="sex" value="M" checked={form.sex === 'M'} onChange={handleChange} className="cursor-pointer" />
                        <span>M</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="sex" value="F" checked={form.sex === 'F'} onChange={handleChange} className="cursor-pointer" />
                        <span>F</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>e-mail id</label>
                    <input name="email" value={form.email} placeholder='Enter e-mail id' onChange={handleChange} className={inputStyle} type="email" />
                  </div>
                  <div>
                    <label className={labelStyle}>Marital Status</label>
                    <input name="maritalStatus" value={form.maritalStatus} placeholder='Enter marital status' onChange={handleChange} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Date of Birth</label>
                    <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputStyle} type="date" />
                  </div>
                  <div>
                    <label className={labelStyle}>Date of Joining</label>
                    <input name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} className={inputStyle} type="date" />
                  </div>
                </div>
              </fieldset>
              <fieldset className="mt-4 border border-gray-200 rounded p-4">
                <legend className="text-base font-semibold text-blue-700 px-2">Shift Details</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Shift Start Time</label>
                    <input name="shiftStartTime" value={form.shiftStartTime || ''} onChange={handleChange} className={inputStyle} type="time" />
                  </div>
                  <div>
                    <label className={labelStyle}>Shift End Time</label>
                    <input name="shiftEndTime" value={form.shiftEndTime || ''} onChange={handleChange} className={inputStyle} type="time" />
                  </div>
                  <div>
                    <label className={labelStyle}>Working Hours</label>
                    <input name="workingHours" value={form.workingHours || ''} onChange={handleChange} className={inputStyle} type="number" step="0.1" placeholder="e.g., 8.5" />
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-8">
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold">
              {editingIndex !== null ? 'Update' : 'Save'}
            </button>
            <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded cursor-pointer font-semibold">
              Cancel
            </button>
          </div>
        </form>
        {/* Search and Table */}
        <div className="px-6 pb-2 flex items-center space-x-2 mt-8">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find Employee" className="p-2 border rounded text-gray-500 border-gray-300" />
          <button type="button" className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-200 cursor-pointer rounded" onClick={() => setSearch('')}>Clear</button>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={emp.id}>
                  <td className="px-3 py-2 text-gray-600">{emp.employeeCode}</td>
                  <td className="px-3 py-2 text-gray-600">{emp.employeeName}</td>
                  <td className="px-3 py-2 text-gray-600">{emp.mobile}</td>
                  <td className="px-3 py-2 text-gray-600">{emp.email}</td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-4">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}