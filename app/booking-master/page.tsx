'use client'
import { useState } from "react";
import BookingImportPanel from "@/components/BookingImportPanel";
import BookingCustomerSearch from "@/components/BookingCustomerSearch";
import BookingImportedRowsTable from "@/components/BookingImportedRowsTable";

export default function BookingMasterPage() {
    const [importedRows, setImportedRows] = useState<any[]>([]);
    const [customerRows, setCustomerRows] = useState<any[]>([]);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <BookingImportPanel onData={setImportedRows} />
            <BookingCustomerSearch
                importedRows={importedRows}
                onSelectCustomerRows={setCustomerRows}
            />
            <BookingImportedRowsTable rows={customerRows} />
        </div>
    );
}