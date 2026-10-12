import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import {
  MdRequestQuote,
  MdAdd,
  MdSearch,
  MdDeleteOutline,
  MdCheckCircle,
  MdClose,
  MdAttachMoney,
  MdTrendingUp,
  MdLayers,
  MdPlaylistAdd
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useThemeColor } from '../../Context/ThemeColor';
import { supabase } from '../../Context/supabaseClient';
import CustomerCombobox from '../../components/CustomerCombobox';
import ProductCombobox, { ProductComboboxItem } from '../../components/ProductCombobox';
import QuickAddProductModal, { CreatedProductResult } from '../../components/QuickAddProductModal';

export interface QuotationItem {
  id: string;
  name: string;
  qty: string | number;
  rate: number;
  total: number;
}

export interface Quotation {
  id: number | string;
  quoteNo: string;
  customer: string;
  phone?: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'Pending Review' | 'Approved' | 'Converted to Invoice' | 'Rejected';
  items?: QuotationItem[];
  notes?: string;
}

const STATUS_OPTIONS: Quotation['status'][] = [
  'Pending Review',
  'Approved',
  'Converted to Invoice',
  'Rejected'
];

const Quotations: React.FC = () => {
  const { activeColor } = useThemeColor();
  const location = useLocation();

  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(() => (location.state?.highlightQuoteNo || ''));
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formQuoteNo, setFormQuoteNo] = useState<string>('');
  const [formCustomer, setFormCustomer] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formValidUntil, setFormValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [formStatus, setFormStatus] = useState<Quotation['status']>('Pending Review');
  const [formNotes, setFormNotes] = useState<string>('');
  const [lineItems, setLineItems] = useState<QuotationItem[]>([
    { id: 'item-1', name: '', qty: 1, rate: 0, total: 0 }
  ]);

  const [customerDirectory, setCustomerDirectory] = useState<{ name: string; phone: string; source: string }[]>([]);
  const [productDirectory, setProductDirectory] = useState<ProductComboboxItem[]>([]);

  // Quick Add Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productModalLineId, setProductModalLineId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState<string>('');

  // Fetch quotations from Supabase
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_quotations')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching quotations:', error);
        toast.error('Failed to load quotations from Supabase');
        return;
      }

      if (data) {
        const mapped: Quotation[] = data.map((row: any) => ({
          id: row.id,
          quoteNo: row.quote_no || `QT-${row.id}`,
          customer: row.customer || '',
          phone: row.notes?.match(/Phone:\s*([^\n;]+)/)?.[1] || '',
          date: row.date || '',
          validUntil: row.valid_until || '',
          amount: Number(row.amount) || 0,
          status: row.status || 'Pending Review',
          items: Array.isArray(row.items) ? row.items : [],
          notes: row.notes || ''
        }));
        setQuotes(mapped);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error loading quotations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers and leads directory for auto-complete suggestions
  const fetchDirectory = async () => {
    try {
      const [cRes, lRes, pRes] = await Promise.all([
        supabase.from('customers').select('*').limit(200),
        supabase.from('crm_leads').select('client, contact, phone').limit(200),
        supabase.from('products').select('id, product_name, retail_price, category, uom').order('product_name', { ascending: true }).limit(500)
      ]);

      const custMap = new Map<string, { name: string; phone: string; source: string }>();

      if (cRes.data) {
        cRes.data.forEach((c: any) => {
          const name = (c.customerName || c.customername || c.name || '').trim();
          const rawPhone = (c.primaryPhone || c.phone || '').trim();
          const phone = rawPhone && rawPhone.toLowerCase() !== 'n/a' && rawPhone.toLowerCase() !== 'nill' ? rawPhone : '';
          if (name && !custMap.has(name.toLowerCase())) {
            custMap.set(name.toLowerCase(), {
              id: c.id,
              name,
              phone,
              source: 'Registered Customer'
            });
          }
        });
      }

      if (lRes.data) {
        lRes.data.forEach((l: any) => {
          const name = (l.client || l.contact || '').trim();
          const phone = (l.phone || '').trim();
          if (name && !custMap.has(name.toLowerCase())) {
            custMap.set(name.toLowerCase(), {
              name,
              phone,
              source: 'CRM Lead'
            });
          }
        });
      }

      setCustomerDirectory(Array.from(custMap.values()));

      // Products directory (active products table only)
      const prodMap = new Map<string, ProductComboboxItem>();
      if (pRes.data) {
        pRes.data.forEach((p: any) => {
          const name = (p.product_name || '').trim();
          const rate = Number(p.retail_price) || 0;
          if (name && !prodMap.has(name.toLowerCase())) {
            prodMap.set(name.toLowerCase(), {
              id: p.id,
              name,
              rate,
              category: p.category || '',
              uom: p.uom || ''
            });
          }
        });
      }
      setProductDirectory(Array.from(prodMap.values()));
    } catch (err) {
      console.error('Error fetching directory:', err);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchDirectory();
  }, []);

  // Open Create Modal & generate next quote number
  const handleOpenModal = () => {
    const currentYear = new Date().getFullYear();
    const nextSeq = String(quotes.length + 1).padStart(3, '0');
    setFormQuoteNo(`QT-${currentYear}-${nextSeq}`);
    setFormCustomer('');
    setFormPhone('');
    setFormDate(new Date().toISOString().split('T')[0]);
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 15);
    setFormValidUntil(validDate.toISOString().split('T')[0]);
    setFormStatus('Pending Review');
    setFormNotes('');
    setLineItems([{ id: `item-${Date.now()}`, name: '', qty: 1, rate: 0, total: 0 }]);
    setIsModalOpen(true);
  };

  // Auto-fill phone if selecting known customer or lead, query DB if not cached
  const handleCustomerSelect = async (name: string, passedPhone?: string) => {
    setFormCustomer(name);
    if (!name.trim()) {
      setFormPhone('');
      return;
    }

    if (passedPhone && passedPhone.trim()) {
      setFormPhone(passedPhone.trim());
      return;
    }

    // Try finding in directory
    const matched = customerDirectory.find(
      c => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (matched && matched.phone && matched.phone.trim()) {
      setFormPhone(matched.phone.trim());
      return;
    }

    // Try fetching from customers database
    try {
      const { data } = await supabase
        .from('customers')
        .select('phone, primaryPhone')
        .or(`customerName.ilike.${name.trim()},customername.ilike.${name.trim()}`)
        .limit(1);

      if (data && data[0]) {
        const dbPhone = (data[0].primaryPhone || data[0].phone || '').trim();
        if (dbPhone && dbPhone.toLowerCase() !== 'n/a' && dbPhone.toLowerCase() !== 'nill') {
          setFormPhone(dbPhone);
          return;
        }
      }

      // Also check leads table if not found in customers
      const { data: leadData } = await supabase
        .from('crm_leads')
        .select('phone')
        .or(`client.ilike.${name.trim()},contact.ilike.${name.trim()}`)
        .limit(1);

      if (leadData && leadData[0] && leadData[0].phone) {
        setFormPhone(leadData[0].phone.trim());
      }
    } catch (err) {
      console.warn('Error querying customer contact:', err);
    }
  };

  // Sync phone change back to customer record in database
  const updateOrSaveCustomerContact = async (customerName: string, phone: string) => {
    const cleanName = customerName.trim();
    const cleanPhone = phone.trim();
    if (!cleanName || !cleanPhone) return;

    try {
      // Check if customer exists in customers table
      const { data: matched } = await supabase
        .from('customers')
        .select('id, customerName, customername, primaryPhone, phone')
        .or(`customerName.ilike.${cleanName},customername.ilike.${cleanName}`)
        .limit(1);

      if (matched && matched.length > 0) {
        const cust = matched[0];
        if (cust.primaryPhone !== cleanPhone || cust.phone !== cleanPhone) {
          const { error } = await supabase
            .from('customers')
            .update({
              primaryPhone: cleanPhone,
              phone: cleanPhone
            })
            .eq('id', cust.id);

          if (!error) {
            toast.success(`Updated ${cleanName}'s contact to ${cleanPhone}`, { duration: 2500 });
            setCustomerDirectory(prev =>
              prev.map(c =>
                c.name.toLowerCase() === cleanName.toLowerCase()
                  ? { ...c, phone: cleanPhone }
                  : c
              )
            );
          }
        }
      } else {
        // Also check if they are in crm_leads
        const { data: matchedLeads } = await supabase
          .from('crm_leads')
          .select('id, client, phone')
          .or(`client.ilike.${cleanName},contact.ilike.${cleanName}`)
          .limit(1);

        if (matchedLeads && matchedLeads.length > 0) {
          await supabase
            .from('crm_leads')
            .update({ phone: cleanPhone })
            .eq('id', matchedLeads[0].id);
        }

        // Register customer with this phone
        const payload: any = {
          customerName: cleanName,
          customername: cleanName,
          primaryPhone: cleanPhone,
          phone: cleanPhone,
          company: 'CRM / Walk-in'
        };
        const { data: created, error } = await supabase
          .from('customers')
          .insert([payload])
          .select();

        if (!error && created && created[0]) {
          toast.success(`Saved contact ${cleanPhone} for "${cleanName}"`, { duration: 2500 });
          setCustomerDirectory(prev => [
            {
              id: created[0].id,
              name: cleanName,
              phone: cleanPhone,
              source: 'Registered Customer'
            },
            ...prev
          ]);
        }
      }
    } catch (err) {
      console.warn('Error syncing customer contact:', err);
    }
  };

  // Line item builders
  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random()}`, name: '', qty: 1, rate: 0, total: 0 }
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) {
      setLineItems([{ id: `item-${Date.now()}`, name: '', qty: 1, rate: 0, total: 0 }]);
      return;
    }
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof QuotationItem, value: any) => {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // Auto-populate price if matched from products catalog
        if (field === 'name') {
          const matchedProd = productDirectory.find(
            p => p.name.toLowerCase() === String(value).trim().toLowerCase()
          );
          if (matchedProd && matchedProd.rate > 0) {
            updated.rate = matchedProd.rate;
            updated.total = (Number(updated.qty) || 1) * matchedProd.rate;
          }
        }

        if (field === 'qty' || field === 'rate') {
          const qty = Number(field === 'qty' ? value : updated.qty) || 0;
          const rate = Number(field === 'rate' ? value : updated.rate) || 0;
          updated.total = qty * rate;
        }
        return updated;
      })
    );
  };

  const calculatedTotal = lineItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);

  // Open Quick Add Product Modal from combobox
  const handleOpenAddProductModal = (lineId: string, initialName: string) => {
    setProductModalLineId(lineId);
    setNewProductName(initialName);
    setIsProductModalOpen(true);
  };

  // Called when QuickAddProductModal successfully creates a product in Supabase
  const handleProductCreated = (createdItem: CreatedProductResult) => {
    // 1. Update product directory for autocomplete
    const newComboboxItem: ProductComboboxItem = {
      id: createdItem.id,
      name: createdItem.name,
      rate: createdItem.rate,
      category: createdItem.category,
      uom: createdItem.uom
    };
    setProductDirectory(prev => [newComboboxItem, ...prev]);

    // 2. Auto-assign to triggering line item and compute row total
    if (productModalLineId) {
      setLineItems(prev =>
        prev.map(item => {
          if (item.id === productModalLineId) {
            const qty = Number(item.qty) || 1;
            return {
              ...item,
              name: createdItem.name,
              rate: createdItem.rate,
              total: qty * createdItem.rate
            };
          }
          return item;
        })
      );
    }
  };

  // Submit New Quotation to Supabase
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer.trim()) {
      toast.error('Customer or Project name is required');
      return;
    }

    const validItems = lineItems
      .filter(i => i.name.trim() !== '')
      .map(i => ({
        id: i.id,
        name: i.name.trim(),
        qty: Number(i.qty) || 1,
        rate: Number(i.rate) || 0,
        total: Number(i.total) || 0
      }));

    const finalAmount = validItems.length > 0 ? calculatedTotal : Number(calculatedTotal) || 0;

    try {
      setSubmitting(true);
      const notesFormatted = [
        formPhone.trim() ? `Phone: ${formPhone.trim()}` : '',
        formNotes.trim()
      ].filter(Boolean).join('\n');

      const payload = {
        quote_no: formQuoteNo.trim(),
        customer: formCustomer.trim(),
        date: formDate,
        valid_until: formValidUntil,
        amount: finalAmount,
        status: formStatus,
        items: validItems,
        notes: notesFormatted
      };

      const { data, error } = await supabase
        .from('crm_quotations')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error inserting quotation:', error);
        toast.error('Failed to save to Supabase: ' + error.message);
        return;
      }

      // Sync or save phone in customer record
      if (formCustomer.trim() && formPhone.trim()) {
        await updateOrSaveCustomerContact(formCustomer.trim(), formPhone.trim());
      }

      if (data && data.length > 0) {
        const row = data[0];
        const newQuote: Quotation = {
          id: row.id,
          quoteNo: row.quote_no,
          customer: row.customer,
          phone: formPhone.trim(),
          date: row.date,
          validUntil: row.valid_until,
          amount: Number(row.amount) || 0,
          status: row.status,
          items: row.items || [],
          notes: row.notes || ''
        };
        setQuotes(prev => [newQuote, ...prev]);
      }

      setIsModalOpen(false);
      toast.success(`Quotation "${formQuoteNo}" saved to Supabase!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save quotation');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status in Supabase
  const handleUpdateStatus = async (id: number | string, newStatus: Quotation['status']) => {
    setQuotes(prev =>
      prev.map(q => (q.id === id ? { ...q, status: newStatus } : q))
    );

    try {
      const { error } = await supabase
        .from('crm_quotations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status in Supabase');
        fetchQuotes();
        return;
      }
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      fetchQuotes();
    }
  };

  // Delete Quotation from Supabase
  const handleDeleteQuotation = async (id: number | string, quoteNo: string) => {
    if (!window.confirm(`Are you sure you want to delete quotation ${quoteNo}?`)) {
      return;
    }

    setQuotes(prev => prev.filter(q => q.id !== id));

    try {
      const { error } = await supabase
        .from('crm_quotations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quotation:', error);
        toast.error('Failed to delete quotation from Supabase');
        fetchQuotes();
        return;
      }
      toast.success(`Quotation ${quoteNo} deleted`);
    } catch (err) {
      console.error(err);
      fetchQuotes();
    }
  };

  // Share Quotation via WhatsApp
  const handleSendWhatsApp = (q: Quotation) => {
    const rawPhone = String(q.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? `92${rawPhone.slice(1)}` : rawPhone;

    const itemsSummary = q.items && q.items.length > 0
      ? q.items.map((it, idx) => `  ${idx + 1}. ${it.name} - Qty: ${it.qty} @ Rs. ${it.rate.toLocaleString()} = Rs. ${it.total.toLocaleString()}`).join('\n')
      : `  • Total Quoted Amount: Rs. ${q.amount.toLocaleString()}`;

    const msg = `Dear ${q.customer},\nGreetings from NHT Enterprises!\n\nHere are the details for Quotation *${q.quoteNo}* dated ${q.date} (Valid until ${q.validUntil}):\n\n${itemsSummary}\n\n*Total Quotation Value:* Rs. ${q.amount.toLocaleString()}\n*Status:* ${q.status}\n\nPlease let us know if you have any questions or require revisions.\n\nBest regards,\nNHT Enterprises Sales Team\nHotline: +92 322 3805981`;

    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success(`Opening WhatsApp for quotation ${q.quoteNo}`);
  };

  // Filtered Quotes
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch =
      q.quoteNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'All' || q.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalQuotedValue = quotes.reduce((acc, q) => acc + (q.amount || 0), 0);
  const approvedValue = quotes.filter(q => q.status === 'Approved' || q.status === 'Converted to Invoice').reduce((acc, q) => acc + (q.amount || 0), 0);
  const pendingCount = quotes.filter(q => q.status === 'Pending Review').length;
  const convertedCount = quotes.filter(q => q.status === 'Converted to Invoice').length;

  const getStatusBadgeClass = (status: Quotation['status']) => {
    switch (status) {
      case 'Pending Review':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Converted to Invoice':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
      <Breadcrumb pageName="Sales Quotations & Estimates" />

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Quotations</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{quotes.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <MdRequestQuote size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Review</span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <MdLayers size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Quoted Value</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              Rs. {totalQuotedValue.toLocaleString()}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MdAttachMoney size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Approved & Converted</span>
            <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5 font-mono">
              Rs. {approvedValue.toLocaleString()}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <MdCheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Quotations & Estimates</h2>
            <p className="text-slate-500 text-xs">Generate proforma quotations, price proposals and track customer approvals</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <MdSearch size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search quote or client..."
                className="pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-full sm:w-48 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Create Button */}
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
              style={{ backgroundColor: activeColor.primary }}
            >
              <MdAdd size={16} />
              <span>+ Create New Quotation</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Quote #</th>
                <th className="py-2.5 px-3">Customer / Project</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Validity</th>
                <th className="py-2.5 px-3 text-right">Quoted Amount (Rs.)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading quotations from Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MdRequestQuote size={32} className="text-slate-300 dark:text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Quotations Found</span>
                      <span className="text-[11px] text-slate-400 max-w-sm">
                        {searchTerm || selectedStatusFilter !== 'All'
                          ? 'No quotations match your current filter.'
                          : 'Your database table (crm_quotations) is connected and ready. Click "+ Create New Quotation" to create your first quotation.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">{q.quoteNo}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{q.customer}</div>
                      {q.phone && <div className="text-[10px] text-slate-400 font-mono">{q.phone}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{q.date}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{q.validUntil}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {q.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateStatus(q.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] border cursor-pointer focus:outline-none ${getStatusBadgeClass(q.status)}`}
                      >
                        {STATUS_OPTIONS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSendWhatsApp(q)}
                          title="Share Quotation on WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 transition"
                        >
                          <FaWhatsapp size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuotation(q.id, q.quoteNo)}
                          title="Delete Quotation"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 transition"
                        >
                          <MdDeleteOutline size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Quotation Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MdRequestQuote size={18} className="text-teal-600" />
                  <span>Generate Customer Quotation & Estimate</span>
                </h3>
                <p className="text-[11px] text-slate-400">Save quotation to Supabase and send to client</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <MdClose size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveQuotation} className="p-5 overflow-y-auto flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Quote #</label>
                  <input
                    type="text"
                    value={formQuoteNo}
                    onChange={(e) => setFormQuoteNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-gray-500 text-xs font-bold">Customer / Project *</label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {customerDirectory.length > 0 ? `${customerDirectory.length} in Directory` : ''}
                    </span>
                  </div>
                  <CustomerCombobox
                    value={formCustomer}
                    phone={formPhone}
                    options={customerDirectory}
                    required
                    placeholder="Search or enter customer..."
                    onCustomerCreated={(newCust) => {
                      setCustomerDirectory(prev => [newCust, ...prev]);
                    }}
                    onChange={(name, phone) => {
                      handleCustomerSelect(name, phone);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">WhatsApp / Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    onBlur={() => {
                      if (formCustomer.trim() && formPhone.trim()) {
                        updateOrSaveCustomerContact(formCustomer.trim(), formPhone.trim());
                      }
                    }}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Validity (Until)</label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Itemized Line Items */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Quotation Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <MdAdd size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <div className="col-span-5">
                        <ProductCombobox
                          value={item.name}
                          options={productDirectory}
                          placeholder={`Item #${idx + 1} (catalog or custom)`}
                          onChange={(name, rate) => {
                            setLineItems(prev =>
                              prev.map(li => {
                                if (li.id !== item.id) return li;
                                const updated = { ...li, name };
                                if (rate !== undefined && rate > 0) {
                                  updated.rate = rate;
                                } else {
                                  const matched = productDirectory.find(
                                    p => p.name.toLowerCase() === name.trim().toLowerCase()
                                  );
                                  if (matched && matched.rate > 0) {
                                    updated.rate = matched.rate;
                                  }
                                }
                                const q = Number(updated.qty) || 1;
                                updated.total = q * (Number(updated.rate) || 0);
                                return updated;
                              })
                            );
                          }}
                          onRequestAddProduct={(typedName) => {
                            handleOpenAddProductModal(item.id, typedName);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.qty || ''}
                          onChange={(e) => handleUpdateLineItem(item.id, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center focus:outline-none font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={(e) => handleUpdateLineItem(item.id, 'rate', e.target.value)}
                          placeholder="Rate"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-right focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-emerald-600">
                        Rs. {(item.total || 0).toLocaleString()}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <MdClose size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase text-[11px]">Total Estimated Amount</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {calculatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Notes / Terms</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Payment terms, delivery schedule, validity terms..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                  style={{ backgroundColor: activeColor.primary }}
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Save Quotation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isProductModalOpen}
        initialProductName={newProductName}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={handleProductCreated}
      />
    </div>
  );
};

export default Quotations;
