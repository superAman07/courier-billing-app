'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Package, PackageCheck, PackageX, Search, Loader2 } from 'lucide-react';

interface Docket {
    id: string;
    awbNo: string;
    status: 'UNUSED' | 'USED';
    createdAt: string;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color: string }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl shadow-lg text-white transition-transform transform hover:scale-105`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
                <p className="text-4xl font-bold">{value.toLocaleString()}</p>
            </div>
            <Icon className="w-12 h-12 opacity-30" />
        </div>
    </div>
);

export default function DocketStockPage() {
    const [dockets, setDockets] = useState<Docket[]>([]);
    const [counts, setCounts] = useState({ total: 0, unused: 0, used: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNUSED' | 'USED'>('UNUSED');

    useEffect(() => {
        const fetchDockets = async () => {
            setLoading(true);
            try {
                const params = statusFilter === 'ALL' ? {} : { status: statusFilter };
                const { data } = await axios.get('/api/docket-stock', { params });
                setDockets(data.data);
            } catch (error) {
                toast.error('Failed to fetch docket stock.');
            } finally {
                setLoading(false);
            }
        };

        const fetchCounts = async () => {
            try {
                const [allRes, unusedRes, usedRes] = await Promise.all([
                    axios.get('/api/docket-stock'),
                    axios.get('/api/docket-stock', { params: { status: 'UNUSED' } }),
                    axios.get('/api/docket-stock', { params: { status: 'USED' } })
                ]);
                setCounts({
                    total: allRes.data.count,
                    unused: unusedRes.data.count,
                    used: usedRes.data.count
                });
            } catch (error) {
                toast.error("Failed to fetch docket counts.");
            }
        };

        fetchDockets();
        fetchCounts();
    }, [statusFilter]);

    const filteredDockets = useMemo(() => {
        if (!search) return dockets;
        return dockets.filter(docket => docket.awbNo.toLowerCase().includes(search.toLowerCase()));
    }, [dockets, search]);

    const thStyle = "px-4 py-3 text-left text-xs font-semibold text-gray-100 bg-gray-700 uppercase tracking-wider";
    const filterButton = (status: 'ALL' | 'UNUSED' | 'USED', label: string) => (
        <button
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 cursor-pointer text-sm font-semibold rounded-md transition-all duration-200 ${statusFilter === status ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Docket Stock Inventory</h1>
                    <p className="text-lg text-gray-500 mt-1">Manage and track your AWB numbers.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Dockets" value={counts.total} icon={Package} color="from-blue-500 to-blue-700" />
                    <StatCard title="Unused" value={counts.unused} icon={PackageCheck} color="from-green-500 to-green-700" />
                    <StatCard title="Used" value={counts.used} icon={PackageX} color="from-yellow-500 to-yellow-700" />
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2">
                            {filterButton('UNUSED', 'Unused')}
                            {filterButton('USED', 'Used')}
                            {filterButton('ALL', 'All')}
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by AWB number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 text-gray-600 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-700 sticky top-0">
                                <tr>
                                    <th className={thStyle}>AWB Number</th>
                                    <th className={thStyle}>Status</th>
                                    <th className={thStyle}>Date Added</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center py-10"><Loader2 className="mx-auto animate-spin w-8 h-8 text-gray-400" /></td></tr>
                                ) : filteredDockets.length > 0 ? (
                                    filteredDockets.map(docket => (
                                        <tr key={docket.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap font-mono text-sm text-gray-800">{docket.awbNo}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${docket.status === 'UNUSED' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                                                    {docket.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(docket.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="text-center py-10 text-gray-500">No dockets found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}