import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdWhatsapp, MdSearch, MdOutlineReceipt, MdPhone, MdCheckCircle, MdPeople, MdReceiptLong, MdAttachMoney, MdRefresh } from 'react-icons/md';
import { toast } from 'react-hot-toast';

interface InvoiceDueItem {
  id: string | number;
  invoiceNo: string;
  customerName: string;
  phone: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  agingDays: number;
}

interface CustomerDueSummary {
  id: string | number;
  customerName: string;
  phone: string;
  city: string;
  unsettledInvoicesCount: number;
  totalInvoicedDue: number;
  openingBalance: number;
  netReceivableDue: number;
}

const CustomerDueList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  const [invoiceDues, setInvoiceDues] = useState<InvoiceDueItem[]>([]);
  const [customerDues, setCustomerDues] = useState<CustomerDueSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDuesData();
  }, []);

  const fetchDuesData = async () => {
    setLoading(true);
    try {
      // Fetch invoices, customers, financial vouchers, and sales returns in parallel
      const [invRes, custRes, vchRes, retRes] = await Promise.all([
        supabase.from('sales_invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*'),
        supabase.from('financial_vouchers').select('*'),
        supabase.from('sales_returns').select('*')
      ]);

      const invoices = invRes.data || [];
      const customers = custRes.data || [];
      const vouchers = vchRes.data || [];
      const returns = retRes.data || [];

      // Create lookup map for customers by name (normalized)
      const customerMap = new Map<string, any>();
      customers.forEach(c => {
        const nameKey = (c.customerName || c.customername || '').trim().toLowerCase();
        if (nameKey) customerMap.set(nameKey, c);
      });

      // Calculate invoice dues
      const computedInvoices: InvoiceDueItem[] = [];
      const customerInvoiceDuesMap = new Map<string, { count: number; dueTotal: number }>();

      invoices.forEach(inv => {
        const invNo = inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`;
        const custName = (inv.customer_name || 'Walk-in Customer').trim();
        const custKey = custName.toLowerCase();
        const matchedCust = customerMap.get(custKey);

        const phone = matchedCust?.phone || matchedCust?.primaryPhone || inv.customer_phone || inv.phone || '';
        const invDate = inv.sale_date || inv.invoice_date || String(inv.created_at || '').split('T')[0] || '';

        const total = Number(inv.total_amount || 0);
        const cashPaid = Number(inv.cash_amount_paid || 0);
        const bankPaid = Number(inv.bank_amount || 0);

        // Sum subsequent receipt vouchers for this invoice
        const matchedVouchers = vouchers.filter((v: any) => {
          const vType = String(v.voucher_type || '').toLowerCase();
          const origRef = String(v.original_invoice_no || '').trim().toLowerCase();
          return (vType.includes('receipt') || origRef) && (origRef === invNo.toLowerCase() || origRef === String(inv.id));
        });
        const vouchersPaid = matchedVouchers.reduce((sum, v) => sum + Number(v.amount || v.total_amount || 0), 0);

        // Sum sales returns for this invoice
        const matchedReturns = returns.filter((r: any) => {
          const origRef = String(r.original_invoice_no || r.invoice_no || '').trim().toLowerCase();
          return origRef === invNo.toLowerCase() || origRef === String(inv.id);
        });
        const returnsCredited = matchedReturns.reduce((sum, r) => sum + Number(r.total_amount || r.total_net_amount || 0), 0);

        const totalPaidSoFar = cashPaid + bankPaid + vouchersPaid + returnsCredited;
        const netDue = Math.max(0, total - totalPaidSoFar);

        // Aging in days
        let agingDays = 0;
        if (invDate) {
          const diffMs = Date.now() - new Date(invDate).getTime();
          agingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }

        if (netDue > 1 && inv.receipt_status !== 'SETTLED') {
          computedInvoices.push({
            id: inv.id,
            invoiceNo: invNo,
            customerName: custName,
            phone: phone,
            invoiceDate: invDate,
            totalAmount: total,
            paidAmount: totalPaidSoFar,
            dueAmount: netDue,
            agingDays
          });

          // Aggregate per customer
          const existing = customerInvoiceDuesMap.get(custKey) || { count: 0, dueTotal: 0 };
          customerInvoiceDuesMap.set(custKey, {
            count: existing.count + 1,
            dueTotal: existing.dueTotal + netDue
          });
        }
      });

      setInvoiceDues(computedInvoices);

      // Compute Customer-wise ledger receivables
      const computedCustomerSummaries: CustomerDueSummary[] = [];
      customers.forEach(c => {
        const name = c.customerName || c.customername || 'Unnamed';
        const nameKey = name.trim().toLowerCase();
        const invAgg = customerInvoiceDuesMap.get(nameKey) || { count: 0, dueTotal: 0 };
        const openingBal = Number(c.balance || c.opening_balance || 0);
        const netTotalDue = invAgg.dueTotal + openingBal;

        if (netTotalDue > 1 || invAgg.count > 0) {
          computedCustomerSummaries.push({
            id: c.id,
            customerName: name,
            phone: c.phone || c.primaryPhone || '',
            city: c.city || c.province || 'N/A',
            unsettledInvoicesCount: invAgg.count,
            totalInvoicedDue: invAgg.dueTotal,
            openingBalance: openingBal,
            netReceivableDue: netTotalDue
          });
        }
      });

      // Sort by highest due balance first
      computedCustomerSummaries.sort((a, b) => b.netReceivableDue - a.netReceivableDue);
      setCustomerDues(computedCustomerSummaries);

    } catch (e: any) {
      console.error('Customer Due List fetch error:', e);
      toast.error('Failed to load dues data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppReminder = (customerName: string, phone: string, amount: number, invNo?: string) => {
    const rawPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      toast.error(`No valid phone number registered for ${customerName}. Please update customer profile.`);
      return;
    }
    const cleanPhone = rawPhone.startsWith('0') ? `92${rawPhone.slice(1)}` : rawPhone;
    
    let msg = `Dear ${customerName},\nThis is a polite payment reminder regarding your outstanding balance of Rs. ${amount.toLocaleString()}`;
    if (invNo) {
      msg += ` against Invoice #${invNo}`;
    }
    msg += `.\nKindly arrange settlement at your earliest convenience.\n\nThank you for your business.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success(`WhatsApp reminder generated for ${customerName}`);
  };

  // Filtered views
  const filteredInvoices = useMemo(() => {
    return invoiceDues.filter(d =>
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm)
    );
  }, [invoiceDues, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customerDues.filter(c =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerDues, searchTerm]);

  // Aggregate Metrics
  const totalReceivables = useMemo(() => {
    return customerDues.reduce((sum, c) => sum + c.netReceivableDue, 0) || invoiceDues.reduce((sum, i) => sum + i.dueAmount, 0);
  }, [customerDues, invoiceDues]);

  const totalUnsettledInvoices = invoiceDues.length;
  const totalDueCustomers = customerDues.length;

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-5 text-slate-800 dark:text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Breadcrumb pageName="Customer Due List (CRM)" />
        <button
          onClick={fetchDuesData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
        >
          <MdRefresh className={loading ? 'animate-spin' : ''} size={16} />
          Refresh Dues
        </button>
      </div>

      {/* TOP METRIC CARDS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <MdAttachMoney size={26} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding Due</p>
            <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              Rs. {totalReceivables.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <MdReceiptLong size={26} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unsettled Invoices</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totalUnsettledInvoices} <span className="text-xs font-normal text-slate-400">Bills Pending</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MdPeople size={26} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Customers With Balances</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totalDueCustomers} <span className="text-xs font-normal text-slate-400">Receivable Accounts</span>
            </p>
          </div>
        </div>
      </div>

      {/* MAIN DATA CONTAINER */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        {/* HEADER CONTROLS & TABS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <MdOutlineReceipt size={16} />
              By Invoices ({invoiceDues.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'customers'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <MdPeople size={16} />
              By Customer Account ({customerDues.length})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'invoices' ? "Search invoice #, customer name, phone..." : "Search customer name, phone, city..."}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* TAB 1: INVOICE-WISE DUES */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            {filteredInvoices.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <MdCheckCircle size={32} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Sales Invoices Are Settled</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm">
                  {searchTerm ? "No invoices matched your search filter." : "There are currently no sales invoices with outstanding pending balances."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Aging</th>
                    <th className="py-2.5 px-3 text-right">Total (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Paid (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Due Balance (Rs.)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{row.invoiceNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.customerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{row.phone || <span className="text-slate-300">N/A</span>}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.invoiceDate}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.agingDays > 30 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {row.agingDays}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">Rs. {row.totalAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">Rs. {row.paidAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        Rs. {row.dueAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleSendWhatsAppReminder(row.customerName, row.phone, row.dueAmount, row.invoiceNo)}
                          disabled={!row.phone}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            row.phone
                              ? 'bg-[#25D366]/15 hover:bg-[#25D366] text-[#0F5132] hover:text-white border-[#25D366]/30'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <MdWhatsapp size={14} /> Send Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: CUSTOMER-WISE RECEIVABLE LEDGER SUMMARY */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            {filteredCustomers.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <MdCheckCircle size={32} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Customer Accounts Are Clear</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm">
                  {searchTerm ? "No customers matched your search query." : "There are currently no customer accounts with outstanding ledger receivable balances."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Location / Region</th>
                    <th className="py-2.5 px-3 text-center">Unsettled Bills</th>
                    <th className="py-2.5 px-3 text-right">Invoiced Dues (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Account Balance (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Net Receivable (Rs.)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{cust.customerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{cust.phone || <span className="text-slate-300">N/A</span>}</td>
                      <td className="py-2.5 px-3 text-slate-400">{cust.city}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cust.unsettledInvoicesCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {cust.unsettledInvoicesCount} Invoices
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">Rs. {cust.totalInvoicedDue.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">Rs. {cust.openingBalance.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        Rs. {cust.netReceivableDue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleSendWhatsAppReminder(cust.customerName, cust.phone, cust.netReceivableDue)}
                          disabled={!cust.phone}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            cust.phone
                              ? 'bg-[#25D366]/15 hover:bg-[#25D366] text-[#0F5132] hover:text-white border-[#25D366]/30'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <MdWhatsapp size={14} /> Send Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDueList;
