'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type SmsApiSettingsForm = {
  id?: string;
  apiPart1: string;
  apiPart2: string;
  apiPart3?: string;
  companyName: string;
  phoneNo: string;
};

const initialForm: SmsApiSettingsForm = {
  apiPart1: '',
  apiPart2: '',
  apiPart3: '',
  companyName: '',
  phoneNo: '',
};

export default function SmsApiSettings() {
  const [form, setForm] = useState<SmsApiSettingsForm>(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/sms-api-settings').then(res => {
      if (res.data) setForm(res.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/sms-api-settings', form);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">SETTINGS (SMS API)</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div>
              <label className={labelStyle}>API PART 1</label>
              <textarea name="apiPart1" value={form.apiPart1} onChange={handleChange} className={inputStyle} rows={2} />
            </div>
            <div className="mt-4">
              <label className={labelStyle}>API PART 2</label>
              <textarea name="apiPart2" value={form.apiPart2} onChange={handleChange} className={inputStyle} rows={2} />
            </div>
            <div className="mt-4">
              <label className={labelStyle}>API PART 3 (Optional)</label>
              <textarea name="apiPart3" value={form.apiPart3} onChange={handleChange} className={inputStyle} rows={2} />
            </div>
            <div className="mt-4">
              <label className={labelStyle}>Company Name Associated With</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="mt-4">
              <label className={labelStyle}>Phone No</label>
              <input name="phoneNo" value={form.phoneNo} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="mt-6">
              <button type="submit" className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold`} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-900">
              <div className="font-bold mb-2">How to Decide Part 1, Part 2 &amp; Part 3</div>
              <div>
                Suppose you got the following API from your Bulk SMS Provider:<br />
                <span className="block bg-gray-100 p-2 my-2 rounded text-xs">
                  http://my.smsserver.in/api/pushsms.php?usr=USERNAME&amp;pwd=pass1234&amp;sndr=MYHOTEL&amp;Mobile=98765xxxxx,89745xxxxx&amp;message=This is a sample text sms to show you how api works&amp;type=4
                </span>
                <b>Part 1</b> is from "Http" to "Mobile No.", include <b>&amp;</b> sign also.<br />
                <span className="block bg-gray-100 p-2 my-2 rounded text-xs">
                  http://my.smsserver.in/api/pushsms.php?usr=USERNAME&amp;pwd=pass1234&amp;sndr=MYHOTEL&amp;Mobile=
                </span>
                <b>Part 2</b> is after entering Mobile No.'s to Message.<br />
                <span className="block bg-gray-100 p-2 my-2 rounded text-xs">
                  &amp;Message=
                </span>
                <b>Part 3</b> is optional, if there is some part of API after entering the whole Message, then you need to define it here.<br />
                <span className="block bg-gray-100 p-2 my-2 rounded text-xs">
                  &amp;type=4
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}