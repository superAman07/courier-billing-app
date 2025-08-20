'use client';
import { parseDateString } from "@/lib/convertDateInJSFormat";
import axios from "axios";
import { useState, useRef, useEffect } from "react";

const bookingFields = [
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
  customerId,
  onClose,
}: {
  row: any;
  customerId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    bookingFields.reduce((acc, field) => {
      acc[field] = row[field] || "";
      return acc;
    }, {} as Record<string, string>)
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        bookingDate: parseDateString(form["Booking Date"]),
        awbNo: form["AwbNo"],
        destinationCity: form["Destination City"],
        mode: form["Mode"],
        pcs: Number(form["PCS"]),
        pin: form["Pin"],
        dsrContents: form["DSR_CONTENTS"],
        dsrNdxPaper: form["DSR_NDX_PAPER"],
        invoiceValue: Number(form["Invoice value"]),
        actualWeight: Number(form["Actual Weight"]),
        chargeWeight: Number(form["Charge Weight"]),
        invoiceWt: Number(form["Invoice Wt"]),
        clientBillingValue: Number(form["Clinet Billing Value"]),
        creditCustomerAmount: Number(form["Credit Customer Amount"]),
        regularCustomerAmount: Number(form["Regular Customer Amount"]),
        childCustomer: form["Child Customer"],
        parentCustomer: form["Parrent Customer"],
        paymentStatus: form["PAYMENT STATUS"],
        senderContactNo: form["Sender Contact No"],
        address: form["Address"],
        adhaarNo: form["Adhaar No"],
        customerAttendBy: form["Customer Attend By"],
        status: form["STATUS"],
        statusDate: parseDateString(form["Status Date"]),
        pendingDaysNotDelivered: Number(form["Pending Days of Not Delivered"]),
        receiverName: form["Receiver Name"],
        receiverContactNo: form["Receiver Contact No"],
        complainNo: form["Complain No."],
        shipmentCostOtherMode: Number(form["Shipment Cost by other Mode"]),
        podStatus: form["POD Status"],
        remarks: form["Remarks"],
        countryName: form["Country Name"],
        domesticInternational: form["Domestic / International"],
        internationalMode: form["International Mode"],
        customerId,
      };

      await axios.post("/api/booking-master", payload);
      onClose();
    } catch (error) {
      console.error("Failed to save booking:", error);
    }
  };

  return (
    <div ref={panelRef} className="w-full mt-8">
      <div className="w-full rounded-xl shadow-lg border border-blue-200 bg-white px-8 py-8 transition-all animate-in fade-in slide-in-from-top">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Edit Booking Row</h2>
        <form
          id="edit-booking-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-7 max-h-[65vh] overflow-y-auto"
        >
          {bookingFields.map((key) => {
            // Use date input for Booking Date and Status Date
            const isDateField = key === "Booking Date" || key === "Status Date";
            let value = form[key];
            // Convert to YYYY-MM-DD for date input
            if (isDateField && value && typeof value === "string" && value.includes("/")) {
              // Convert DD/MM/YYYY to YYYY-MM-DD
              const [d, m, y] = value.split("/");
              value = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            }
            return (
              <div key={key}>
                <label className="block mb-2 text-[15px] font-medium text-gray-700">{key}</label>
                <input
                  name={key}
                  type={isDateField ? "date" : "text"}
                  value={value}
                  onChange={handleChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
                  autoComplete="off"
                />
              </div>
            );
          })}
          {/* {bookingFields.map((key) => (
            <div key={key}>
              <label className="block mb-2 text-[15px] font-medium text-gray-700">{key}</label>
              <input
                name={key}
                value={form[key]}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
                autoComplete="off"
              />
            </div>
          ))} */}
        </form>
        <div className="flex justify-center gap-4 mt-8 border-t pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md cursor-pointer border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-booking-form"
            className="px-5 py-2 rounded-md cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow font-semibold transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

//   // Initialize form with imported values where available, else empty
//   const [form, setForm] = useState(
//     bookingFields.reduce((acc, field) => {
//       acc[field] = row[field] || "";
//       return acc;
//     }, {} as Record<string, string>)
//   );

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // TODO: Save to DB via API
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
//         <h2 className="text-lg font-bold mb-4">Edit Booking Row</h2>
//         <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto">
//           {bookingFields.map((key) => (
//             <div key={key} className="flex items-center gap-2">
//               <label className="w-48 font-medium text-gray-700">{key}</label>
//               <input
//                 name={key}
//                 value={form[key]}
//                 onChange={handleChange}
//                 className="flex-1 p-2 border rounded"
//               />
//             </div>
//           ))}
//           <div className="flex justify-end gap-2 mt-4">
//             <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
//             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }