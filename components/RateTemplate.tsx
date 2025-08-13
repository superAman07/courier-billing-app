'use client';

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CustomerMaster, RateMaster } from "@prisma/client";
import { toast } from "sonner";

type TemplateRow = {
    mode: string;
    consignmentType: string;
    zone: string;
    state: string;
    city: string;
    _count: { _all: number };
};

export default function RateTemplate() {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [sourceId, setSourceId] = useState("");
    const [targetId, setTargetId] = useState("");
    const [filters, setFilters] = useState({ mode: "ALL", consignmentType: "ALL", zone: "ALL", state: "ALL", city: "" });
    const [templates, setTemplates] = useState<TemplateRow[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [detail, setDetail] = useState<{ open: boolean; title: string; slabs: RateMaster[] }>({ open: false, title: "", slabs: [] });

    const keyOf = (t: TemplateRow) => [t.mode, t.consignmentType, t.zone, t.state, t.city].join("|");

    useEffect(() => {
        axios.get("/api/customers").then(r => setCustomers(r.data));
    }, []);

    useEffect(() => {
        if (!sourceId) { setTemplates([]); setSelectedKeys(new Set()); return; }
        (async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ customerId: sourceId, ...filters, city: filters.city });
                const res = await axios.get(`/api/rates/templates?${params.toString()}`);
                setTemplates(res.data);
                setSelectedKeys(new Set());
            } catch {
                setMessage("Failed to load templates."); 
            } finally {
                setIsLoading(false);
            }
        })();
    }, [sourceId, filters]);

    const toggleSelect = (t: TemplateRow) => {
        const k = keyOf(t);
        setSelectedKeys(prev => {
            const n = new Set(prev);
            n.has(k) ? n.delete(k) : n.add(k);
            return n;
        });
    };
    const selectAll = (checked: boolean) => {
        setSelectedKeys(checked ? new Set(templates.map(keyOf)) : new Set());
    };

    const openDetail = async (t: TemplateRow) => {
        try {
            const { mode, consignmentType, zone, state, city } = t;
            const params = new URLSearchParams({ customerId: sourceId, mode, consignmentType, zone, state, city });
            const res = await axios.get(`/api/rates/templates/slabs?${params.toString()}`);
            setDetail({ open: true, slabs: res.data, title: `${t.mode} | ${t.consignmentType} | ${t.zone} | ${t.state} | ${t.city}` });
        } catch {
            setMessage("Failed to load details.");
            toast.error("Failed to load details");
        }
    };

    const copySelected = async (overwrite = false) => {
        if (!targetId || selectedKeys.size === 0) { setMessage("Pick a target and at least one template."); return; }
        const combos = templates.filter(t => selectedKeys.has(keyOf(t))).map(t => ({
            mode: t.mode, consignmentType: t.consignmentType, zone: t.zone, state: t.state, city: t.city,
        }));
        try {
            const res = await axios.post("/api/rates/templates/copy", { sourceCustomerId: sourceId, targetCustomerId: targetId, combos, overwrite });
            setMessage(`Copied ${res.data.count} slabs.`);
            toast.success(`Copied ${res.data.count} slabs`);
        } catch {
            setMessage("Copy failed.");
            toast.error("Copy failed.");
        }
    };

    const inputStyle = "w-full p-2 cursor-pointer text-gray-600 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelStyle = "block cursor-pointer text-sm font-medium text-gray-700 mb-1";
    const thStyle = "px-3 py-2 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase";

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700">
                    <h1 className="text-2xl font-bold text-white">RATE TEMPLATE</h1>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 border-b">
                    <div>
                        <label className={labelStyle}>Source Customer</label>
                        <select value={sourceId} onChange={e => setSourceId(e.target.value)} className={inputStyle}>
                            <option value="">-- Select Source --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Target Customer</label>
                        <select value={targetId} onChange={e => setTargetId(e.target.value)} className={inputStyle} disabled={!sourceId}>
                            <option value="">-- Select Target --</option>
                            {customers.filter(c => c.id !== sourceId).map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                        </select>
                    </div>
 
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className={labelStyle}>Mode</label>
                            <select value={filters.mode} onChange={e => setFilters({ ...filters, mode: e.target.value })} className={inputStyle}>
                                <option value="ALL">ALL</option><option value="AIR">AIR</option><option value="ROAD">ROAD</option><option value="TRAIN">TRAIN</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Con. Type</label>
                            <select value={filters.consignmentType} onChange={e => setFilters({ ...filters, consignmentType: e.target.value })} className={inputStyle}>
                                <option value="ALL">ALL</option><option value="DOCUMENT">DOCUMENT</option><option value="PARCEL">PARCEL</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Zone wise</label>
                            <select value={filters.zone} onChange={e => setFilters({ ...filters, zone: e.target.value })} className={inputStyle}>
                                <option value="ALL">ALL</option><option value="E">E</option><option value="W">W</option><option value="N">N</option><option value="S">S</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>State wise</label>
                            <select value={filters.state} onChange={e => setFilters({ ...filters, state: e.target.value })} className={inputStyle}>
                                <option value="ALL">ALL</option>
                                <option value="CENTRAL">CENTRAL</option>
                                <option value="EAST">EAST</option>
                                <option value="NORTH">NORTH</option>
                                <option value="SOUTH">SOUTH</option>
                                <option value="WEST">WEST</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>City wise</label>
                            <input value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className={inputStyle} placeholder="ALL" />
                        </div>
                    </div>
                </div>
 
                <div className="p-6">
                    {message && <p className="text-sm text-blue-600 mb-3">{message}</p>}
                    <div className="overflow-x-auto overflow-y-auto h-96 border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className={thStyle}><input type="checkbox" onChange={e => selectAll(e.target.checked)} checked={templates.length > 0 && selectedKeys.size === templates.length} /></th>
                                    <th className={thStyle}>Mode</th>
                                    <th className={thStyle}>Con. Type</th>
                                    <th className={thStyle}>Zone</th>
                                    <th className={thStyle}>State</th>
                                    <th className={thStyle}>City</th>
                                    <th className={thStyle}>Detail</th>
                                    <th className={thStyle}>Copy</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                                ) : templates.length > 0 ? (
                                    templates.map(t => (
                                        <tr key={keyOf(t)}>
                                            <td className="px-3 py-2"><input type="checkbox" checked={selectedKeys.has(keyOf(t))} onChange={() => toggleSelect(t)} /></td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{t.mode}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{t.consignmentType}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{t.zone}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{t.state}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{t.city}</td>
                                            <td className="px-3 py-2">
                                                <button type="button" className="text-indigo-600 hover:underline cursor-pointer" onClick={() => openDetail(t)}>View ({t._count._all})</button>
                                            </td>
                                            <td className="px-3 py-2">
                                                <button type="button" className="text-blue-600 hover:underline cursor-pointer" onClick={() => { setSelectedKeys(new Set([keyOf(t)])); copySelected(false); }}>Copy</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={8} className="text-center py-4">{sourceId ? "No templates found." : "Select a source customer."}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
 
                <div className="p-6 flex items-center justify-end space-x-3 border-t">
                    <button className="px-4 py-2 border rounded-md text-sm" disabled={selectedKeys.size === 0 || !targetId} onClick={() => copySelected(false)}>Copy Selected</button>
                    <button className="px-4 py-2 border rounded-md text-sm" disabled={selectedKeys.size === 0 || !targetId} onClick={() => copySelected(true)}>Copy Selected (Overwrite)</button>
                </div>
            </div>
 
            {detail.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">{detail.title}</h3>
                            <button className="text-gray-500 cursor-pointer" onClick={() => setDetail({ open: false, title: "", slabs: [] })}>✕</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className={thStyle}>Wt.From</th>
                                        <th className={thStyle}>Wt.To</th>
                                        <th className={thStyle}>Rate</th>
                                        <th className={thStyle}>Addnl?</th>
                                        <th className={thStyle}>Addnl Wt</th>
                                        <th className={thStyle}>Addnl Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {detail.slabs.map(s => (
                                        <tr key={s.id}>
                                            <td className="px-3 py-2 text-sm text-gray-500">{s.fromWeight.toFixed(3)}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{s.toWeight.toFixed(3)}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{s.rate.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{s.hasAdditionalRate ? "Y" : "N"}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{s.additionalWeight?.toFixed(3) ?? "0.000"}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{s.additionalRate?.toFixed(2) ?? "0.00"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}