import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdWhatsapp, MdSearch, MdOutlineReceipt, MdPhone, MdSend, MdHistory, MdFilterList } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const CustomerDueList: React.FC = () => {
  const [dueInvoices, setDueInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('sales_invoices').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) {
        const dues = data
          .map(inv => {
            const total = Number(inv.total_amount || 0);
            const paid = Number(inv.cash_amount_paid || inv.paid_amount || 0);
            const outstanding = Math.max(0, total - paid);
            return {
              id: inv.id,
              invoiceNo: inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`,
              customerName: inv.customer_name || 'Walk-in Customer',
              phone: inv.customer_phone || inv.phone || '03001234567',
              invoiceDate: inv.sale_date || inv.invoice_date || String(inv.created_at || '').split('T')[0],
              totalAmount: total,
              paidAmount: paid,
              dueAmount: outstanding
            };
          })
          .filter(d => d.dueAmount > 1);

        setDueInvoices(dues);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppReminder = (row: any) => {
    const rawPhone = String(row.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? `92${rawPhone.slice(1)}` : rawPhone;
    const msg = `Dear ${row.customerName},\nThis is a friendly reminder regarding your pending invoice ${row.invoiceNo} dated ${row.invoiceDate}. Outstanding balance is Rs. ${row.dueAmount.toLocaleString()}.\nKindly arrange settlement at your earliest convenience.\n\nThank you,\nNHT Enterprises Accounts Team`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success(`WhatsApp reminder generated for ${row.customerName}`);
  };

  const filtered = dueInvoices.filter(d =>
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Customer Due List (CRM)" />

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Due List & WhatsApp Recovery Hub</h2>
            <p className="text-slate-500 text-xs">Instantly send customer balance reminders via WhatsApp and track receivables</p>
          </div>

          <div className="relative w-full md:w-72">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name or invoice #..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Invoice Date</th>
                <th className="py-2.5 px-3 text-right">Total (Rs.)</th>
                <th className="py-2.5 px-3 text-right">Due Balance (Rs.)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{row.invoiceNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.customerName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{row.phone}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.invoiceDate}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">Rs. {row.totalAmount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    Rs. {row.dueAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleSendWhatsAppReminder(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#0F5132] hover:text-white font-bold transition text-xs border border-[#25D366]/30"
                    >
                      <MdWhatsapp size={14} /> Send Reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDueList;
