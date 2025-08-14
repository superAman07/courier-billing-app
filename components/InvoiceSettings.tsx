'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

type InvoiceSettingsForm = {
  id?: string;
  invoiceNoType: "Numeric" | "AlphaNumeric";
  invoicePrefix: string;
  printWithMode: boolean;
  handbillInvoice: boolean;
};

const initialForm: InvoiceSettingsForm = {
  invoiceNoType: "Numeric",
  invoicePrefix: "",
  printWithMode: false,
  handbillInvoice: false,
};

export default function InvoiceSettings() {
  const [form, setForm] = useState<InvoiceSettingsForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    axios.get("/api/invoice-settings").then(res => {
      if (res.data) setForm(res.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRadio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      invoiceNoType: e.target.value as "Numeric" | "AlphaNumeric",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("/api/invoice-settings", form);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">INVOICE SETTINGS</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Invoice No Should Be</label>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2">
                <input type="radio" name="invoiceNoType" className="cursor-pointer" value="Numeric" checked={form.invoiceNoType === "Numeric"} onChange={handleRadio} />
                <span className="text-gray-500 cursor-pointer">Numeric</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="invoiceNoType" className="cursor-pointer" value="AlphaNumeric" checked={form.invoiceNoType === "AlphaNumeric"} onChange={handleRadio} />
                <span className="text-gray-500 cursor-pointer">Alpha Numeric</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Invoice Start No / Prefix</label>
            <input type="text" className="p-2 text-end border rounded w-full text-gray-600 border-gray-300" name="invoicePrefix" value={form.invoicePrefix.toUpperCase()} onChange={handleChange} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" name="printWithMode" className="cursor-pointer" checked={form.printWithMode} onChange={handleChange} />
            <span className="text-gray-700">Print Invoice With Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" name="handbillInvoice" className="cursor-pointer" checked={form.handbillInvoice} onChange={handleChange} />
            <span className="text-gray-700">Handbill Invoice</span>
          </div>
          <button type="submit" className="w-full cursor-pointer py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}