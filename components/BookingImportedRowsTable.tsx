'use client';

export default function BookingImportedRowsTable({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) {
    return <div className="p-4 text-gray-500">No data to display.</div>;
  }

  // Get all unique column names from the first row
  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full border">
        <thead className="bg-blue-50">
          <tr>
            {columns.map(col => (
              <th key={col} className="px-2 py-1 border text-blue-900">{col}</th>
            ))}
            <th className="px-2 py-1 border text-blue-900">Edit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col} className="px-2 py-1 border text-gray-700">
                  {row[col]}
                </td>
              ))}
              <td className="px-2 py-1 border text-center">
                <button className="text-blue-600 hover:underline cursor-pointer">✏️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}