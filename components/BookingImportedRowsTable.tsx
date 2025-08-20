'use client';
import { useState } from "react";
import BookingRowEditModal from "./BookingRowEditModal";

export default function BookingImportedRowsTable({ rows, customerId }: { rows: any[]; customerId: string }) {
  const [editingRow, setEditingRow] = useState<any | null>(null);

  if (!rows || rows.length === 0) {
    return <div className="p-4 text-gray-500">No data to display.</div>;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="overflow-x-auto shadow border bg-white mt-6">
        <table className="w-6xl text-sm">
          <thead className="sticky top-0 bg-blue-100 z-10">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-3 py-2 border-b font-semibold text-blue-900 whitespace-nowrap">{col}</th>
              ))}
              <th className="px-3 py-2 border-b font-semibold text-blue-900">Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 border-b text-gray-700 whitespace-nowrap">
                    {row[col]}
                  </td>
                ))}
                <td className="px-3 py-2 border-b text-center">
                  <button
                    className="text-blue-600 hover:underline cursor-pointer"
                    onClick={() => setEditingRow(row)}
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingRow && (
        <BookingRowEditModal
          row={editingRow}
          customerId={customerId}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}