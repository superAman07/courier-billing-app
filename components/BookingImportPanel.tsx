'use client';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

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
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        onClick={() => fileInputRef.current?.click()}
      >
        {fileName ? `Imported: ${fileName}` : 'Import Excel'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading && <div className="text-xs text-blue-700 mt-2">Parsing file...</div>}
    </div>
  );
}