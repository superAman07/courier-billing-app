'use client'

import { useState } from "react";
import { Database, Download, Users } from "lucide-react";
import BookingImportPanel from "@/components/BookingImportPanel";
import BookingCustomerSearch from "@/components/BookingCustomerSearch";
import BookingImportedRowsTable from "@/components/BookingImportedRowsTable";
import { handleDownload } from "@/lib/downloadExcel";

export default function BookingMasterPage() {
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [customerRows, setCustomerRows] = useState<any[]>([]);

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-10">
      {/* Page Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-600" />
          Booking Master
        </h1>
        <p className="text-gray-500 mt-2">
          Import customer bookings, search and filter by customer, and manage data efficiently.
        </p>
      </header>

      {/* Import Panel (Floating button) */}
      <BookingImportPanel onData={setImportedRows} />

      {/* Main two sections */}
      <div className="space-y-8">
        {/* 1. Customer Filter/Search */}
        <section className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                Search Customer
              </h2>
              <BookingCustomerSearch
                importedRows={importedRows}
                onSelectCustomerRows={setCustomerRows}
              />
              {importedRows.length === 0 && (
                <p className="text-sm text-gray-400 mt-3">
                  ⚠️ Import Excel first to enable customer filtering.
                </p>
              )}
            </div>
            <button
              onClick={handleDownload}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow font-semibold transition"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>
          </div>
        </section>

        {/* 2. Data Table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Imported Rows
          </h2>
          <BookingImportedRowsTable rows={customerRows} />
        </section>
      </div>
    </div>
  );
}