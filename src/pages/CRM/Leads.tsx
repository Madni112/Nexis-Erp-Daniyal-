import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import {
  MdPeopleOutline,
  MdAdd,
  MdPhone,
  MdDeleteOutline,
  MdSearch,
  MdFilterList,
  MdTrendingUp,
  MdAttachMoney,
  MdCheckCircle,
  MdLayers,
  MdClose,
  MdPersonAdd,
  MdRequestQuote,
  MdInventory2
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useThemeColor } from '../../Context/ThemeColor';
import { supabase } from '../../Context/supabaseClient';
import CustomerCombobox, { CustomerComboboxItem } from '../../components/CustomerCombobox';
import ProductCombobox, { ProductComboboxItem } from '../../components/ProductCombobox';
import QuickAddProductModal, { CreatedProductResult } from '../../components/QuickAddProductModal';
import QuickAddCustomerModal from '../../components/QuickAddCustomerModal';

export interface DemandProduct {
  id: string;
  name: string;
  qty: string;
  amount: number;
  boxes?: number | string;
  loose?: number | string;
  isTile?: boolean;
  pcsPerBox?: number;
}

export interface LeadItem {
  id: number | string;
  client: string;
  contact: string;
  phone: string;
  items: DemandProduct[];
  interest: string; // summary string for quick search
  estValue: number;
  stage: 'New Inquiry' | 'Site Inspection' | 'Quotation Sent' | 'Negotiation' | 'Won / Closed' | 'Lost';
  createdAt: string;
  notes?: string;
}

const STAGE_OPTIONS: LeadItem['stage'][] = [
  'New Inquiry',
  'Site Inspection',
  'Quotation Sent',
  'Negotiation',
  'Won / Closed',
  'Lost'
];

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const { activeColor } = useThemeColor();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [convertingId, setConvertingId] = useState<number | string | null>(null);

  // Client Info State
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<LeadItem['stage']>('New Inquiry');
  const [notes, setNotes] = useState('');

  // Multi-Product Items State
  const [demandItems, setDemandItems] = useState<DemandProduct[]>([
    { id: 'item-1', name: '', qty: '', amount: 0 }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');

  // Directories state
  const [customerDirectory, setCustomerDirectory] = useState<CustomerComboboxItem[]>([]);
  const [productDirectory, setProductDirectory] = useState<ProductComboboxItem[]>([]);

  // Quick Add Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productModalLineId, setProductModalLineId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState<string>('');

  // Automatically calculate total budget from demand items
  const calculatedTotalBudget = demandItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Fetch leads from Supabase crm_leads table
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to load leads from Supabase');
        return;
      }

      if (data) {
        const mapped: LeadItem[] = data.map((row: any) => ({
          id: row.id,
          client: row.client || '',
          contact: row.contact || '',
          phone: row.phone || '',
          items: Array.isArray(row.items) ? row.items : [],
          interest: row.interest || '',
          estValue: Number(row.est_value) || 0,
          stage: row.stage || 'New Inquiry',
          notes: row.notes || '',
          createdAt: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
            : ''
        }));
        setLeads(mapped);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error loading CRM leads');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers & products directories for auto-complete suggestions
  const fetchDirectory = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('customers').select('*').limit(250),
        supabase
          .from('products')
          .select('id, product_name, retail_price, category, sub_category, scenario_name, item_type, uom, pieces_per_box, pcs_per_box, pieces_per_packing')
          .order('product_name', { ascending: true })
          .limit(500)
      ]);

      const custMap = new Map<string, CustomerComboboxItem>();
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
      setCustomerDirectory(Array.from(custMap.values()));

      // Products directory from inventory catalog
      const prodMap = new Map<string, ProductComboboxItem>();
      if (pRes.data) {
        pRes.data.forEach((p: any) => {
          const name = (p.product_name || '').trim();
          const rate = Number(p.retail_price) || 0;
          const rawPcs = Number(p.pieces_per_box ?? p.pcs_per_box ?? p.pieces_per_packing ?? 0);
          if (name && !prodMap.has(name.toLowerCase())) {
            prodMap.set(name.toLowerCase(), {
              id: p.id,
              name,
              rate,
              category: p.category || '',
              sub_category: p.sub_category || '',
              scenario_name: p.scenario_name || '',
              item_type: p.item_type || '',
              uom: p.uom || '',
              pcs_per_box: rawPcs > 0 ? rawPcs : 4
            });
          }
        });
      }
      setProductDirectory(Array.from(prodMap.values()));
    } catch (err) {
      console.error('Error fetching directories:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchDirectory();
  }, []);

  // Sync phone change back to customer record in database
  const updateOrSaveCustomerContact = async (customerName: string, phoneToSync: string) => {
    const cleanName = customerName.trim();
    const cleanPhone = phoneToSync.trim();
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
            toast.success(`Updated ${cleanName}'s phone in customer database`, { duration: 2500 });
            setCustomerDirectory(prev =>
              prev.map(c =>
                c.name.toLowerCase() === cleanName.toLowerCase()
                  ? { ...c, phone: cleanPhone }
                  : c
              )
            );
          }
        }
      }
    } catch (err) {
      console.warn('Error syncing customer contact:', err);
    }
  };

  // Add Row to Demand Items
  const handleAddDemandRow = () => {
    setDemandItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random()}`, name: '', qty: '', amount: 0, boxes: '', loose: '', isTile: false }
    ]);
  };

  // Remove Row from Demand Items
  const handleRemoveDemandRow = (id: string) => {
    if (demandItems.length === 1) {
      setDemandItems([{ id: `item-${Date.now()}`, name: '', qty: '', amount: 0, boxes: '', loose: '', isTile: false }]);
      return;
    }
    setDemandItems(prev => prev.filter(i => i.id !== id));
  };

  // Update specific item field
  const handleUpdateDemandRow = (id: string, field: keyof DemandProduct, value: any) => {
    setDemandItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Check if product is a Tile based on metadata or name
  const checkIfTile = (name: string, matched?: ProductComboboxItem) => {
    if (matched) {
      const text = `${matched.category || ''} ${matched.sub_category || ''} ${matched.scenario_name || ''} ${matched.item_type || ''} ${matched.uom || ''}`.toLowerCase();
      if (text.includes('tile') || text.includes('box') || text.includes('sqm') || text.includes('sqft')) {
        return true;
      }
    }
    const lower = (name || '').toLowerCase();
    return lower.includes('tile') || lower.includes('tiles') || lower.includes('porcelain') || lower.includes('ceramic') || lower.includes('granite') || lower.includes('marble');
  };

  // Handle Box + Loose Pcs changes
  const handleTileQtyChange = (itemId: string, newBoxes: string, newLoose: string) => {
    setDemandItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const bNum = newBoxes === '' ? 0 : Math.max(0, parseInt(newBoxes, 10) || 0);
        const lNum = newLoose === '' ? 0 : Math.max(0, parseInt(newLoose, 10) || 0);

        const matched = productDirectory.find(
          p => p.name.toLowerCase() === it.name.trim().toLowerCase()
        );
        const pcsPerBox = it.pcsPerBox || matched?.pcs_per_box || 4;

        let qtyStr = '';
        if (bNum > 0 && lNum > 0) {
          qtyStr = `${bNum} Box${bNum !== 1 ? 'es' : ''} + ${lNum} Loose Pc${lNum !== 1 ? 's' : ''}`;
        } else if (bNum > 0) {
          qtyStr = `${bNum} Box${bNum !== 1 ? 'es' : ''}`;
        } else if (lNum > 0) {
          qtyStr = `${lNum} Loose Pc${lNum !== 1 ? 's' : ''}`;
        } else {
          qtyStr = '';
        }

        const eqBoxes = bNum + (lNum / pcsPerBox);
        let newAmount = it.amount;
        if (matched && matched.rate > 0) {
          newAmount = Math.round(eqBoxes * matched.rate);
        }

        return {
          ...it,
          boxes: newBoxes,
          loose: newLoose,
          qty: qtyStr,
          amount: newAmount,
          pcsPerBox
        };
      })
    );
  };

  // Toggle Tile mode manually
  const handleToggleTile = (itemId: string) => {
    setDemandItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const nextTile = !it.isTile;
        if (nextTile) {
          const parsed = parseInt(it.qty, 10) || 0;
          const boxes = it.boxes !== undefined && it.boxes !== '' ? it.boxes : (parsed > 0 ? String(parsed) : '');
          const loose = it.loose !== undefined ? it.loose : '';
          const matched = productDirectory.find(
            p => p.name.toLowerCase() === it.name.trim().toLowerCase()
          );
          const pcsPerBox = it.pcsPerBox || matched?.pcs_per_box || 4;
          const bNum = parseInt(String(boxes), 10) || 0;
          const lNum = parseInt(String(loose), 10) || 0;
          let qtyStr = it.qty;
          if (bNum > 0 || lNum > 0) {
            qtyStr = bNum > 0 && lNum > 0 ? `${bNum} Box${bNum !== 1 ? 'es' : ''} + ${lNum} Loose Pcs` : (bNum > 0 ? `${bNum} Boxes` : `${lNum} Loose Pcs`);
          }
          return {
            ...it,
            isTile: true,
            boxes,
            loose,
            qty: qtyStr,
            pcsPerBox
          };
        } else {
          return {
            ...it,
            isTile: false
          };
        }
      })
    );
  };

  // Handle Qty input change with auto-calculation if item has catalog rate
  const handleQtyChange = (itemId: string, newQty: string) => {
    handleUpdateDemandRow(itemId, 'qty', newQty);
    const item = demandItems.find(i => i.id === itemId);
    if (item && item.name) {
      const matched = productDirectory.find(
        p => p.name.toLowerCase() === item.name.trim().toLowerCase()
      );
      if (matched && matched.rate > 0) {
        const parsed = parseFloat(newQty) || 1;
        handleUpdateDemandRow(itemId, 'amount', Math.round(parsed * matched.rate));
      }
    }
  };

  // Open Quick Add Product Modal from combobox
  const handleOpenAddProductModal = (lineId: string | null, initialName: string) => {
    setProductModalLineId(lineId);
    setNewProductName(initialName);
    setIsProductModalOpen(true);
  };

  // Called when QuickAddProductModal successfully creates a product in Supabase
  const handleProductCreated = (createdItem: CreatedProductResult) => {
    const newComboboxItem: ProductComboboxItem = {
      id: createdItem.id,
      name: createdItem.name,
      rate: createdItem.rate,
      category: createdItem.category,
      uom: createdItem.uom
    };
    setProductDirectory(prev => [newComboboxItem, ...prev]);

    if (productModalLineId) {
      const curItem = demandItems.find(i => i.id === productModalLineId);
      const parsedQty = parseFloat(curItem?.qty || '1') || 1;
      setDemandItems(prev =>
        prev.map(item =>
          item.id === productModalLineId
            ? {
                ...item,
                name: createdItem.name,
                amount: Math.round(parsedQty * createdItem.rate)
              }
            : item
        )
      );
    }
  };

  // Submit Lead to Supabase
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      toast.error('Client or Project name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone or WhatsApp number is required');
      return;
    }

    // Clean up empty item rows
    const validItems = demandItems
      .filter(i => i.name.trim() !== '')
      .map(i => ({
        ...i,
        name: i.name.trim(),
        qty: i.qty.trim() || '1 lot',
        amount: Number(i.amount) || 0
      }));

    if (validItems.length === 0) {
      toast.error('Please enter at least one product demand');
      return;
    }

    const summaryInterest = validItems.map(i => `${i.qty ? `${i.qty} ` : ''}${i.name}`).join(' • ');

    try {
      setSubmitting(true);

      // Auto-sync customer phone to customers table
      await updateOrSaveCustomerContact(client.trim(), phone.trim());

      const payload = {
        client: client.trim(),
        contact: contact.trim() || 'Direct Owner',
        phone: phone.trim(),
        items: validItems,
        interest: summaryInterest,
        est_value: calculatedTotalBudget,
        stage,
        notes: notes.trim()
      };

      const { data, error } = await supabase
        .from('crm_leads')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error inserting lead:', error);
        toast.error('Failed to save to Supabase: ' + error.message);
        return;
      }

      if (data && data.length > 0) {
        const row = data[0];
        const newLead: LeadItem = {
          id: row.id,
          client: row.client || '',
          contact: row.contact || '',
          phone: row.phone || '',
          items: Array.isArray(row.items) ? row.items : [],
          interest: row.interest || '',
          estValue: Number(row.est_value) || 0,
          stage: row.stage || 'New Inquiry',
          notes: row.notes || '',
          createdAt: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
            : new Date().toLocaleDateString('en-US')
        };
        setLeads(prev => [newLead, ...prev]);
      }

      // Reset Form
      setClient('');
      setContact('');
      setPhone('');
      setNotes('');
      setStage('New Inquiry');
      setDemandItems([{ id: `item-${Date.now()}`, name: '', qty: '', amount: 0 }]);
      toast.success(`Prospect "${client.trim()}" saved to Supabase!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save demand');
    } finally {
      setSubmitting(false);
    }
  };

  // Change Stage in Supabase
  const handleUpdateStage = async (id: number | string, newStage: LeadItem['stage']) => {
    // Optimistic UI update
    setLeads(prev =>
      prev.map(item => (item.id === id ? { ...item, stage: newStage } : item))
    );

    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating stage:', error);
        toast.error('Failed to update stage in Supabase');
        fetchLeads();
        return;
      }
      toast.success(`Stage updated to ${newStage}`);
    } catch (err) {
      console.error(err);
      fetchLeads();
    }
  };

  // 1-Click Convert Lead to Formal Quotation
  const handleConvertToQuotation = async (lead: LeadItem) => {
    try {
      setConvertingId(lead.id);
      const currentYear = new Date().getFullYear();

      // Fetch sequence
      const { data: latestQuotes } = await supabase
        .from('crm_quotations')
        .select('id, quote_no')
        .order('id', { ascending: false })
        .limit(1);

      const lastId = latestQuotes && latestQuotes[0] ? Number(latestQuotes[0].id) : 0;
      const nextSeq = String(lastId + 1).padStart(3, '0');
      const quoteNo = `QT-${currentYear}-${nextSeq}`;

      const today = new Date().toISOString().split('T')[0];
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 15);
      const validUntil = validUntilDate.toISOString().split('T')[0];

      const quotationItems = (lead.items && lead.items.length > 0 ? lead.items : [
        { id: 'item-1', name: lead.interest || 'Demanded Product', qty: '1', amount: lead.estValue }
      ]).map((it, idx) => {
        const parsedQty = parseFloat(it.qty) || 1;
        const rate = Number(it.amount) > 0 ? Math.round(Number(it.amount) / parsedQty) : 0;
        return {
          id: `item-${Date.now()}-${idx}`,
          name: it.name,
          qty: parsedQty,
          rate: rate,
          total: Number(it.amount) || 0
        };
      });

      const payload = {
        quote_no: quoteNo,
        customer: lead.client,
        date: today,
        valid_until: validUntil,
        amount: lead.estValue || quotationItems.reduce((acc, q) => acc + q.total, 0),
        status: 'Pending Review',
        items: quotationItems,
        notes: `Converted from CRM Lead #${lead.id} (${lead.contact}). Phone: ${lead.phone}${lead.notes ? ` | Notes: ${lead.notes}` : ''}`
      };

      const { error: quoteError } = await supabase
        .from('crm_quotations')
        .insert([payload]);

      if (quoteError) {
        console.error('Error inserting quotation:', quoteError);
        toast.error('Failed to create quotation: ' + quoteError.message);
        return;
      }

      // Update lead stage in Supabase
      await handleUpdateStage(lead.id, 'Quotation Sent');

      toast.success(`Quotation ${quoteNo} generated for ${lead.client}!`, { duration: 3000 });

      // Navigate to Quotations page
      navigate('/crm/quotations', {
        state: {
          highlightQuoteNo: quoteNo,
          fromLead: lead
        }
      });
    } catch (err: any) {
      console.error('Error converting to quotation:', err);
      toast.error('Failed to convert lead to quotation');
    } finally {
      setConvertingId(null);
    }
  };

  // Delete Lead in Supabase
  const handleDeleteLead = async (id: number | string, clientName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${clientName}" from CRM pipeline?`)) {
      return;
    }

    setLeads(prev => prev.filter(item => item.id !== id));

    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to remove from Supabase');
        fetchLeads();
        return;
      }
      toast.success(`Lead removed from Supabase`);
    } catch (err) {
      console.error(err);
      fetchLeads();
    }
  };

  // WhatsApp Message Generator with itemized bullet checklist
  const handleSendWhatsApp = (lead: LeadItem) => {
    const rawPhone = String(lead.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? `92${rawPhone.slice(1)}` : rawPhone;

    // Build bullet list of demanded items
    const itemsList = lead.items && lead.items.length > 0
      ? lead.items
          .map((i, idx) => `  ${idx + 1}. ${i.name} (${i.qty || 'Req'})${i.amount > 0 ? ` - Est: Rs. ${i.amount.toLocaleString()}` : ''}`)
          .join('\n')
      : `  • ${lead.interest}`;

    const msg = `Dear ${lead.contact || lead.client},\nGreetings from NHT Enterprises!\n\nRegarding your stock demand for the following items:\n${itemsList}\n\n${
      lead.estValue > 0 ? `Total Estimated Budget: Rs. ${lead.estValue.toLocaleString()}\n` : ''
    }Current Status: ${lead.stage}\n\nOur procurement & catalog team has received your demand. Please let us know if you need physical tile samples, site measurement, or an official proforma invoice.\n\nBest regards,\nNHT Enterprises CRM Team\nHotline: +92 322 3805981`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success(`Opening WhatsApp inquiry for ${lead.client}`);
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.interest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.items && l.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStage = selectedStageFilter === 'All' || l.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  // KPI Metrics
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.estValue || 0), 0);
  const totalProductsDemanded = leads.reduce((acc, l) => acc + (l.items?.length || 1), 0);
  const activeLeadsCount = leads.filter(l => l.stage !== 'Won / Closed' && l.stage !== 'Lost').length;
  const wonLeadsCount = leads.filter(l => l.stage === 'Won / Closed').length;

  const getStageBadgeClass = (s: LeadItem['stage']) => {
    switch (s) {
      case 'New Inquiry':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Site Inspection':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Quotation Sent':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Negotiation':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Won / Closed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Lost':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
      <Breadcrumb pageName="Leads & Demand Management (CRM)" />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Prospects</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{activeLeadsCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <MdPeopleOutline size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Demanded Products</span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{totalProductsDemanded} Items</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <MdLayers size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Demand Value</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              Rs. {totalPipelineValue.toLocaleString()}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MdAttachMoney size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Deals Won & Converted</span>
            <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5">{wonLeadsCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <MdCheckCircle size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Multi-Product Demand Intake */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Capture Customer Demand / Lead
                </h3>
                <p className="text-[10px] text-slate-400">Record customer pre-orders & requested out-of-stock items</p>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                Multi-Item
              </span>
            </div>

            <form onSubmit={handleAddLead} className="flex flex-col gap-3.5">
              {/* Client Info */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-gray-500 text-xs font-bold uppercase">
                    Client / Organization / Project *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      <MdPersonAdd size={13} />
                      <span>+ Add Customer</span>
                    </button>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {customerDirectory.length > 0 ? `${customerDirectory.length} in Directory` : ''}
                    </span>
                  </div>
                </div>
                <CustomerCombobox
                  value={client}
                  phone={phone}
                  options={customerDirectory}
                  required
                  placeholder="e.g. Apex Construction / Gulberg Tower / Hassan"
                  onCustomerCreated={(newCust) => {
                    setCustomerDirectory(prev => [newCust, ...prev]);
                    setClient(newCust.name);
                    if (newCust.phone) setPhone(newCust.phone);
                  }}
                  onChange={(clientName, clientPhone) => {
                    setClient(clientName);
                    if (clientPhone) {
                      setPhone(clientPhone);
                    } else {
                      const match = customerDirectory.find(
                        c => c.name.toLowerCase() === clientName.trim().toLowerCase()
                      );
                      if (match && match.phone) setPhone(match.phone);
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px] uppercase">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Owner / Architect"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px] uppercase">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => {
                      if (client.trim() && phone.trim()) {
                        updateOrSaveCustomerContact(client.trim(), phone.trim());
                      }
                    }}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Product Demands Builder */}
              <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <MdLayers className="text-primary" />
                    <span>Requested Demand Items ({demandItems.length})</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenAddProductModal(null, '')}
                      className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <MdInventory2 size={13} />
                      <span>+ Add Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDemandRow}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <MdAdd size={14} />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 overflow-visible">
                  {demandItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2 relative overflow-visible"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold font-mono text-slate-400">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleTile(item.id)}
                            title={item.isTile ? "Tile with loose pieces active (click to switch to regular qty)" : "Click to enable Boxes & Loose pieces"}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              item.isTile
                                ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                            }`}
                          >
                            <span>Tile</span>
                            {item.isTile && <span className="text-[9px] opacity-75">✓</span>}
                          </button>
                        </div>
                        <div className="flex-1">
                          <ProductCombobox
                            value={item.name}
                            options={productDirectory}
                            required
                            placeholder="Select inventory product or type custom demand..."
                            customLabel={(val) => `+ Use "${val}" for this demand`}
                            onChange={(name, rate) => {
                              const matched = productDirectory.find(
                                p => p.name.toLowerCase() === name.trim().toLowerCase()
                              );
                              const isTileItem = checkIfTile(name, matched);
                              const pcsPerBox = matched?.pcs_per_box && matched.pcs_per_box > 0 ? matched.pcs_per_box : 4;

                              setDemandItems(prev =>
                                prev.map(it => {
                                  if (it.id !== item.id) return it;
                                  const updated: DemandProduct = {
                                    ...it,
                                    name,
                                    isTile: isTileItem,
                                    pcsPerBox
                                  };
                                  if (isTileItem) {
                                    const b = Number(updated.boxes || 0);
                                    const l = Number(updated.loose || 0);
                                    const eq = b + (l / pcsPerBox);
                                    if (rate !== undefined && rate > 0) {
                                      updated.amount = Math.round((eq > 0 ? eq : 1) * rate);
                                    }
                                  } else {
                                    if (rate !== undefined && rate > 0) {
                                      const parsedQty = parseFloat(updated.qty) || 1;
                                      updated.amount = Math.round(parsedQty * rate);
                                    }
                                  }
                                  return updated;
                                })
                              );
                            }}
                            onRequestAddProduct={(typedName) => {
                              handleOpenAddProductModal(item.id, typedName);
                            }}
                          />
                        </div>
                        {demandItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDemandRow(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            title="Remove item"
                          >
                            <MdDeleteOutline size={16} />
                          </button>
                        )}
                      </div>

                      {item.isTile ? (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                Boxes (Ctn)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={item.boxes ?? ''}
                                onChange={(e) => handleTileQtyChange(item.id, e.target.value, String(item.loose ?? ''))}
                                placeholder="0"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:border-teal-500 focus:outline-none"
                              />
                            </div>

                            <div className="col-span-4">
                              <label className="block text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400 mb-0.5 flex items-center justify-between">
                                <span>Loose Pcs</span>
                                <span className="text-[9px] text-slate-400 font-normal">({item.pcsPerBox || 4}/bx)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={item.loose ?? ''}
                                onChange={(e) => handleTileQtyChange(item.id, String(item.boxes ?? ''), e.target.value)}
                                placeholder="0"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/30 text-xs font-mono font-bold text-teal-700 dark:text-teal-300 focus:border-teal-500 focus:outline-none"
                              />
                            </div>

                            <div className="col-span-4">
                              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                Est. Amount (Rs.)
                              </label>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => handleUpdateDemandRow(item.id, 'amount', Number(e.target.value))}
                                placeholder="Est. Amount"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:border-teal-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Summary line */}
                          <div className="flex items-center justify-between px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                            <span>
                              Demand: <strong className="text-teal-700 dark:text-teal-300 font-bold">{item.qty || '0 Box'}</strong>
                            </span>
                            {((parseInt(String(item.boxes || 0), 10) * (item.pcsPerBox || 4)) + parseInt(String(item.loose || 0), 10)) > 0 && (
                              <span className="text-slate-500 dark:text-slate-400">
                                = {(parseInt(String(item.boxes || 0), 10) * (item.pcsPerBox || 4)) + parseInt(String(item.loose || 0), 10)} Total Tiles
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div>
                            <input
                              type="text"
                              value={item.qty}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              placeholder="Qty (e.g. 3,500 sqft / 20 pcs)"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={item.amount || ''}
                              onChange={(e) => handleUpdateDemandRow(item.id, 'amount', Number(e.target.value))}
                              placeholder="Est. Amount (Rs.)"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Stage Selection */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Estimated Budget</span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Rs. {calculatedTotalBudget.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px] uppercase">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {STAGE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-transform hover:scale-101 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: activeColor.primary }}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <MdAdd size={16} />
                    <span>Save Customer Demand ({demandItems.length} Items)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Active Demands & Pipeline Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Demands & Quotation Follow-ups</h3>
                <p className="text-[10px] text-slate-400">Track requested inventory items, send WhatsApp checklist & update stages</p>
              </div>

              {/* Search & Stage Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MdSearch size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search client or item..."
                    className="pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-36 sm:w-44 focus:outline-none"
                  />
                </div>
                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
                >
                  <option value="All">All Stages</option>
                  {STAGE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Client & Demanded Products</th>
                    <th className="py-2.5 px-2">Contact</th>
                    <th className="py-2.5 px-2 text-right">Est. Value (Rs.)</th>
                    <th className="py-2.5 px-2 text-center">Pipeline Stage</th>
                    <th className="py-2.5 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">Loading demands from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Customer Demands Found</span>
                          <span className="text-[11px] text-slate-400 max-w-sm">
                            {searchTerm || selectedStageFilter !== 'All'
                              ? 'No records match your active search filter.'
                              : 'Your database table (crm_leads) is currently empty. Use the form on the left to capture customer pre-orders and demands.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        
                        {/* Client & Product Item Tags */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{l.client}</div>
                          
                          {/* Demanded Products List */}
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {l.items && l.items.length > 0 ? (
                              l.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700"
                                >
                                  <span className="font-bold text-primary">{it.qty || 'Req'}:</span>
                                  <span>{it.name}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">{l.interest}</span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-2">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{l.contact}</div>
                          <div className="font-mono text-[10px] text-slate-400">{l.phone}</div>
                        </td>

                        {/* Est. Value */}
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {(l.estValue || 0).toLocaleString()}
                        </td>

                        {/* Stage Selector */}
                        <td className="py-3 px-2 text-center">
                          <select
                            value={l.stage}
                            onChange={(e) => handleUpdateStage(l.id, e.target.value as any)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer focus:outline-none ${getStageBadgeClass(l.stage)}`}
                          >
                            {STAGE_OPTIONS.map(stg => (
                              <option key={stg} value={stg}>{stg}</option>
                            ))}
                          </select>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 1-Click Convert to Quotation */}
                            <button
                              onClick={() => handleConvertToQuotation(l)}
                              disabled={convertingId === l.id}
                              title="1-Click Convert Lead to Formal Quotation"
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 transition cursor-pointer disabled:opacity-50"
                            >
                              {convertingId === l.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <MdRequestQuote size={15} />
                              )}
                            </button>

                            {/* Itemized WhatsApp Button */}
                            <button
                              onClick={() => handleSendWhatsApp(l)}
                              title="Send WhatsApp Demand Checklist"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 transition cursor-pointer"
                            >
                              <FaWhatsapp size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteLead(l.id, l.client)}
                              title="Remove from CRM"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 transition cursor-pointer"
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
        </div>
      </div>

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isProductModalOpen}
        initialProductName={newProductName}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductModalLineId(null);
          setNewProductName('');
        }}
        onSuccess={handleProductCreated}
      />

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={isCustomerModalOpen}
        initialCustomerName={client}
        initialPhone={phone}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(newCustomer) => {
          setCustomerDirectory(prev => [newCustomer, ...prev]);
          setClient(newCustomer.name);
          if (newCustomer.phone) setPhone(newCustomer.phone);
        }}
      />
    </div>
  );
};

export default Leads;
