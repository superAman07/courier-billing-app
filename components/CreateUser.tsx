'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type UserForm = {
    id?: string;
    username: string;
    password: string;
    retypePassword: string;
    userType: 'ADMIN' | 'USER';
    active: boolean;
};

const initialForm: UserForm = {
    username: '',
    password: '',
    retypePassword: '',
    userType: 'USER',
    active: true,
};

export default function CreateUser() {
    const [form, setForm] = useState<UserForm>(initialForm);
    const [users, setUsers] = useState<any[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('/api/create-user').then(res => setUsers(res.data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const { name, value, type } = target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.retypePassword) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            if (editingIndex !== null) {
                const user = users[editingIndex];
                await axios.put(`/api/create-user/${user.id}`, {
                    username: form.username,
                    password: form.password ? form.password : undefined,
                    userType: form.userType,
                    active: form.active,
                });
                toast.success("User updated");
                setEditingIndex(null);
            } else {
                await axios.post('/api/create-user', {
                    username: form.username,
                    password: form.password,
                    userType: form.userType,
                    active: form.active,
                });
                toast.success("User created");
            }
            axios.get('/api/create-user').then(res => setUsers(res.data));
            setForm(initialForm);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Error saving user");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (idx: number) => {
        const user = users[idx];
        setForm({
            id: user.id,
            username: user.username,
            password: '',
            retypePassword: '',
            userType: user.userType,
            active: user.active,
        });
        setEditingIndex(idx);
    };

    const handleDelete = async (idx: number) => {
        const user = users[idx];
        if (!confirm(`Delete user "${user.username}"?`)) return;
        try {
            await axios.delete(`/api/create-user/${user.id}`);
            toast.success("User deleted");
            axios.get('/api/create-user').then(res => setUsers(res.data));
            setEditingIndex(null);
            setForm(initialForm);
        } catch {
            toast.error("Error deleting user");
        }
    };

    const handleCancel = () => {
        setForm(initialForm);
        setEditingIndex(null);
    };

    const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
                    <h1 className="text-2xl font-bold text-white">CREATE USERS</h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4">
                    <div>
                        <label className={labelStyle}>User Name <span className="text-red-600">*</span></label>
                        <input name="username" placeholder='Enter username' value={form.username} onChange={handleChange} className={inputStyle} required />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-4">
                        <div className="flex-1">
                            <label className={labelStyle}>
                                Password {editingIndex === null && <span className="text-red-600">*</span>}
                            </label>
                            <input
                                name="password"
                                placeholder="Enter password"
                                value={form.password}
                                onChange={handleChange}
                                className={inputStyle}
                                type="password"
                                autoComplete="new-password"
                                required={editingIndex === null}
                            />
                        </div>
                        <div className="flex-1 mt-4 sm:mt-0">
                            <label className={labelStyle}>
                                Re-Type Password {editingIndex === null && <span className="text-red-600">*</span>}
                            </label>
                            <input
                                name="retypePassword"
                                placeholder="Re-enter password"
                                value={form.retypePassword}
                                onChange={handleChange}
                                className={inputStyle}
                                type="password"
                                autoComplete="new-password"
                                required={editingIndex === null}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4">
                        <div className="flex-1">
                            <label className={labelStyle}>User Type <span className="text-red-600">*</span></label>
                            <select
                                name="userType"
                                value={form.userType}
                                onChange={handleChange}
                                className={`${inputStyle} cursor-pointer`}
                                required
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="USER">USER</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-6 sm:pt-0">
                            <input
                                type="checkbox"
                                name="active"
                                checked={form.active}
                                onChange={handleChange}
                                className="h-4 w-4 cursor-pointer text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                id="active-checkbox"
                            />
                            <label htmlFor="active-checkbox" className="ml-2 text-gray-700">Active</label>
                        </div>
                        <div className="flex space-x-2 pt-6 sm:pt-0">
                            <button
                                type="submit"
                                className={`px-6 py-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded cursor-pointer font-semibold flex items-center justify-center`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        {editingIndex !== null ? 'Updating...' : 'Saving...'}
                                    </>
                                ) : (
                                    editingIndex !== null ? 'Update' : 'Save'
                                )}
                            </button>
                            {editingIndex !== null && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded cursor-pointer font-semibold"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>
                <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Show</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id}>
                                    <td className="px-3 py-2 text-gray-600 font-semibold">{user.username}</td>
                                    <td className="px-3 py-2 text-gray-600">{user.userType}</td>
                                    <td className="px-3 py-2 text-center">{user.active ? '✔️' : ''}</td>
                                    <td className="px-3 py-2 text-center">
                                        <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button type="button" onClick={() => alert(JSON.stringify(user, null, 2))} className="text-green-600 hover:underline cursor-pointer">🔍</button>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-gray-400 py-4">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}