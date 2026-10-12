import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdPersonAdd, MdSave } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { supabase } from '../Context/supabaseClient';
import { CustomerComboboxItem } from './CustomerCombobox';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  initialCustomerName?: string;
  initialPhone?: string;
  onClose: () => void;
  onSuccess: (customer: CustomerComboboxItem) => void;
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  initialCustomerName = '',
  initialPhone = '',
  onClose,
  onSuccess
}) => {
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [phone, setPhone] = useState(initialPhone);
  const [contactPerson, setContactPerson] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomerName(initialCustomerName);
      setPhone(initialPhone);
      setContactPerson('');
      setCompany('');
    }
  }, [isOpen, initialCustomerName, initialPhone]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      toast.error('Customer or project name is required');
      return;
    }

    try {
      setLoading(true);

      // Check if already exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id, customerName, customername, primaryPhone, phone')
        .or(`customerName.ilike.${cleanName},customername.ilike.${cleanName}`)
        .limit(1);

      if (existing && existing.length > 0) {
        const found = existing[0];
        // If phone provided, update existing
        if (cleanPhone) {
          await supabase
            .from('customers')
            .update({
              primaryPhone: cleanPhone,
              phone: cleanPhone
            })
            .eq('id', found.id);
        }

        toast.success(`Found existing customer "${cleanName}"`);
        onSuccess({
          id: found.id,
          name: cleanName,
          phone: cleanPhone || found.primaryPhone || found.phone || '',
          source: 'Registered Customer'
        });
        onClose();
        return;
      }

      // Create new customer
      const payload: any = {
        customerName: cleanName,
        customername: cleanName,
        primaryPhone: cleanPhone,
        phone: cleanPhone,
        company: company.trim() || 'CRM / Project',
        contactPerson: contactPerson.trim() || cleanName
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select();

      if (error) {
        console.error('Customer insert error:', error);
        toast.error('Failed to create customer: ' + error.message);
        return;
      }

      toast.success(`Customer "${cleanName}" registered successfully!`);
      const createdItem: CustomerComboboxItem = {
        id: data && data[0] ? data[0].id : Date.now(),
        name: cleanName,
        phone: cleanPhone,
        source: 'Registered Customer'
      };

      onSuccess(createdItem);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-800 dark:text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <MdPersonAdd size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Add Customer</h3>
              <p className="text-[11px] text-slate-400">Save to customer directory & CRM</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <MdClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Customer / Client / Project Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Apex Builders / Mr. Tariq"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Phone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0300-1234567"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Owner / Architect"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Company / Tag
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Project Lead"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <MdSave size={15} />
              <span>{loading ? 'Saving...' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default QuickAddCustomerModal;
