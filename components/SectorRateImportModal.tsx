'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileDown, Download, Loader2, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ImportResult = {
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; customer?: string; sector?: string; reason: string }>;
} | null;

export default function SectorRateImportModal({ isOpen, onClose, onSuccess }: Props) {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setResult(null);
        onClose();
    };

    const handleDownloadCustomers = () => {
        window.open('/api/customers/download', '_blank');
    };

    const handleDownloadSample = () => {
        window.open('/api/sector-rates/sample-import', '_blank');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await axios.post('/api/sector-rates/import', formData);
            setResult(data);
            if (data.successCount > 0) {
                onSuccess(); // Refresh parent data
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to import rates.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-blue-600 p-4 flex justify-between items-center shrink-0">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <Upload className="w-5 h-5" /> Bulk Import Rates
                    </h2>
                    <button onClick={handleClose} className="text-white/80 hover:text-white cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {!result ? (
                        // --- UPLOAD VIEW ---
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Step 1: Prepare Data</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={handleDownloadCustomers}
                                        className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                                    >
                                        <Download className="w-6 h-6 text-blue-600 mb-2" />
                                        <span className="text-xs font-medium text-gray-600">1. Customer List</span>
                                    </button>
                                    <button 
                                        onClick={handleDownloadSample}
                                        className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-center"
                                    >
                                        <FileDown className="w-6 h-6 text-green-600 mb-2" />
                                        <span className="text-xs font-medium text-gray-600">2. Rate Template</span>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Use the Customer List to get valid codes. Fill the Rate Template and upload below.
                                </p>
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-xs font-semibold text-blue-800 mb-1">✅ Valid Sector Names:</p>
                                    <p className="text-xs text-blue-700">
                                        Local, UP, UK, Delhi, Bihaar / Jharkhand, North (Haryana / Punjaab / Rajasthaan), 
                                        Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata), Rest of India, North East, 
                                        Special Sector ( Darjling, Silchaar, Daman)
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 The system will auto-correct minor typos and spacing issues.
                                    </p>
                                </div>
                            </div>

                            <hr />

                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Step 2: Upload File</p>
                                <div className="relative">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-600"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                                <span className="font-medium">Processing File...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6" />
                                                <span className="font-medium">Click to Upload Excel</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- RESULT VIEW ---
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                                {result.errorCount === 0 ? (
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Import Completed</h3>
                                    <p className="text-sm text-gray-600">
                                        <span className="text-green-600 font-semibold">{result.successCount}</span> rates updated successfully.
                                    </p>
                                    {result.errorCount > 0 && (
                                        <p className="text-sm text-red-600 font-medium">
                                            {result.errorCount} rows failed to import.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {result.errorCount > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-semibold text-red-800">Error Report</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-4 py-2">Row</th>
                                                    <th className="px-4 py-2">Customer</th>
                                                    <th className="px-4 py-2">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {result.errors.map((err, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-gray-500">{err.row}</td>
                                                        <td className="px-4 py-2 font-mono text-xs">{err.customer || '-'}</td>
                                                        <td className="px-4 py-2 text-red-600">{err.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleClose}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}