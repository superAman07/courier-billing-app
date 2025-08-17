'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type SmsTemplateForm = {
  id?: string;
  templateName: string;
  templateText: string;
};

const initialForm: SmsTemplateForm = {
  templateName: '',
  templateText: '',
};

export default function SmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplateForm[]>([]);
  const [form, setForm] = useState<SmsTemplateForm>(initialForm);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    axios.get('/api/sms-templates').then(res => setTemplates(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingIndex !== null) {
        const t = templates[editingIndex];
        await axios.put(`/api/sms-templates/${t.id}`, form);
        toast.success("Template updated");
        setEditingIndex(null);
      } else {
        await axios.post('/api/sms-templates', form);
        toast.success("Template added");
      }
      axios.get('/api/sms-templates').then(res => setTemplates(res.data));
      setForm(initialForm);
    } catch {
      toast.error("Error saving template");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (idx: number) => {
    setForm(templates[idx]);
    setEditingIndex(idx);
  };

  const handleDelete = async (idx: number) => {
    const t = templates[idx];
    if (!confirm(`Delete template "${t.templateName}"?`)) return;
    try {
      await axios.delete(`/api/sms-templates/${t.id}`);
      toast.success("Template deleted");
      axios.get('/api/sms-templates').then(res => setTemplates(res.data));
      setEditingIndex(null);
      setForm(initialForm);
    } catch {
      toast.error("Error deleting template");
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingIndex(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-md">
          <h1 className="text-2xl font-bold text-white">SMS TEMPLATES</h1>
        </div>
        <div className="p-4 text-blue-700 font-semibold">Double click to edit any SMS Template</div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-600">*</span></label>
            <input name="templateName" placeholder='Enter template name' value={form.templateName} onChange={handleChange} className="w-full p-2 text-gray-600 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Content <span className="text-red-600">*</span></label>
            <textarea name="templateText" placeholder='Enter template content' value={form.templateText} onChange={handleChange} className="w-full p-2 text-gray-600 border border-gray-300 rounded-md shadow-sm" rows={2} required />
          </div>
          <div className="col-span-2 flex space-x-2 mt-2">
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold">
              {editingIndex !== null ? (loading ? 'Updating...' : 'Update') : (loading ? 'Adding...' : 'Add')}
            </button>
            {editingIndex !== null && (
              <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded cursor-pointer font-semibold">
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Template Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Template Content</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t, idx) => (
                <tr key={t.id} onDoubleClick={() => handleEdit(idx)}>
                  <td className="px-3 py-2 text-gray-600 font-semibold">{t.templateName}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={t.templateText}>
                    <span
                      className="cursor-pointer" 
                    >
                      {t.templateText.length > 60 ? t.templateText.slice(0, 60) + '...' : t.templateText}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline cursor-pointer">✏️</button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:underline cursor-pointer">🗑️</button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-4">No templates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}