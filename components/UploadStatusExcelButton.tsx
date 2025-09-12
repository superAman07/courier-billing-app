'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface Props {
    apiEndpoint?: string;
    onUploadComplete?: () => void;
}

export default function UploadStatusExcelButton({ apiEndpoint = '/api/booking-master/bulk-status-upload', onUploadComplete }: Props) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/csv',
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error(`Unsupported file type: ${file.type}`);
            event.target.value = '';
            return;
        }

        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            toast.error('File size exceeds 5MB limit');
            event.target.value = '';
            return;
        }

        try {
            setUploading(true);
            const fileDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("File reading failed"));
                reader.readAsDataURL(file);
            });

            const response = await axios.post(
                apiEndpoint,
                { fileData: fileDataUrl },
                { headers: { 'Content-Type': 'application/json' }, timeout: 120000 }
            );

            if (response.data?.message) {
                toast.success(response.data.message);
            } else {
                toast.success('Status update completed successfully');
            }
            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (error: any) {
            const msg = error?.response?.data?.error || error?.message || 'Upload failed';
            toast.error(msg);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };
    return (
        <div
            className="fixed bottom-4 left-4 z-50"
            style={{ zIndex: 9999 }}
        >
            <label className="cursor-pointer inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium shadow-lg">
                <svg
                    className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l7-7 4 4 5-5" />
                </svg>
                <span>{uploading ? 'Uploading...' : 'Upload Status Excel'}</span>
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    aria-label="Upload Status Excel file"
                />
            </label>
        </div>
    );
}
