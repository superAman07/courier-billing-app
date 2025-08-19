'use client';
import { useState } from "react";

const bookingFields = [
  "SR NO.",
  "Booking Date",
  "AwbNo",
  "Destination City",
  "Mode",
  "PCS",
  "Pin",
  "DSR_CONTENTS",
  "DSR_NDX_PAPER",
  "Invoice value",
  "Actual Weight",
  "Charge Weight",
  "Invoice Wt",
  "Clinet Billing Value",
  "Credit Customer Amount",
  "Regular Customer Amount",
  "Child Customer",
  "Parrent Customer",
  "PAYMENT STATUS",
  "Sender Contact No",
  "Address",
  "Adhaar No",
  "Customer Attend By",
  "STATUS",
  "Status Date",
  "Pending Days of Not Delivered",
  "Receiver Name",
  "Receiver Contact No",
  "Complain No.",
  "Shipment Cost by other Mode",
  "POD Status",
  "Remarks",
  "Country Name",
  "Domestic / International",
  "International Mode"
];

export default function BookingRowEditModal({
  row,
  onClose,
}: {
  row: any;
  onClose: () => void;
}) {
  // Initialize form with imported values where available, else empty
  const [form, setForm] = useState(
    bookingFields.reduce((acc, field) => {
      acc[field] = row[field] || "";
      return acc;
    }, {} as Record<string, string>)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to DB via API
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Edit Booking Row</h2>
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto">
          {bookingFields.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <label className="w-48 font-medium text-gray-700">{key}</label>
              <input
                name={key}
                value={form[key]}
                onChange={handleChange}
                className="flex-1 p-2 border rounded"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}