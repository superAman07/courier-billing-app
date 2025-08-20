
'use client';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2 } from 'lucide-react'; 

export default function BookingImportPanel({ onData }: { onData: (rows: any[]) => void }) {
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
            onData(data as any[]);
            setLoading(false);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex cursor-pointer items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 
                 hover:from-purple-700 hover:to-purple-800 px-5 py-3 rounded-full shadow-lg 
                 text-white font-medium transition-transform transform hover:scale-105 
                 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                    <Upload className="w-5 h-5" />
                )}
                <span>{fileName ? 'Change File' : 'Import Excel'}</span>
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
            />

            {fileName && !loading && (
                <div className="px-4 py-2 rounded-lg bg-white shadow text-gray-700 text-sm border">
                    <span className="font-medium text-purple-700">Imported:</span> {fileName}
                </div>
            )}

            {loading && (
                <div className="px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing file...
                </div>
            )}
        </div>
    );
}