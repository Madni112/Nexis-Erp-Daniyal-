import React, { useState, useEffect } from 'react';
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
  MdClose
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useThemeColor } from '../../Context/ThemeColor';

export interface DemandProduct {
  id: string;
  name: string;
  qty: string;
  amount: number;
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

const DEFAULT_LEADS: LeadItem[] = [
  {
    id: 1,
    client: 'Prime Developers & Builders',
    contact: 'Mr. Tariq',
    phone: '0321-9876543',
    items: [
      { id: '1-1', name: 'Commercial Porcelain 60x120', qty: '3,500 sqft', amount: 950000 },
      { id: '1-2', name: 'Master Vanity Mirror Cabinets', qty: '15 sets', amount: 500000 }
    ],
    interest: 'Commercial Porcelain 60x120 (3,500 sqft) + Master Vanity (15 sets)',
    estValue: 1450000,
    stage: 'Quotation Sent',
    createdAt: '10/08/2026',
    notes: 'Urgent requirement for Plaza 4th floor'
  },
  {
    id: 2,
    client: 'Horizon Residency Project',
    contact: 'Engr. Salman',
    phone: '0300-5544332',
    items: [
      { id: '2-1', name: 'High-Gloss Vitrified Tiles 80x80', qty: '6,000 sqft', amount: 2100000 },
      { id: '2-2', name: 'Wall Glazed Tiles 30x60', qty: '2,000 sqft', amount: 700000 }
    ],
    interest: 'High-Gloss Vitrified Tiles 80x80 + Wall Glazed Tiles',
    estValue: 2800000,
    stage: 'Site Inspection',
    createdAt: '10/06/2026'
  },
  {
    id: 3,
    client: 'Modern Villa Renovations',
    contact: 'Mrs. Fatima',
    phone: '0333-1122334',
    items: [
      { id: '3-1', name: 'Rustic Outdoor Pavers 40x40', qty: '1,200 sqft', amount: 380000 },
      { id: '3-2', name: 'Luxury Shower Mixers & Faucets', qty: '8 sets', amount: 240000 }
    ],
    interest: 'Rustic Outdoor Pavers + Shower Mixers',
    estValue: 620000,
    stage: 'Negotiation',
    createdAt: '10/04/2026'
  }
];

const STAGE_OPTIONS: LeadItem['stage'][] = [
  'New Inquiry',
  'Site Inspection',
  'Quotation Sent',
  'Negotiation',
  'Won / Closed',
  'Lost'
];

const Leads: React.FC = () => {
  const { activeColor } = useThemeColor();

  const [leads, setLeads] = useState<LeadItem[]>(() => {
    try {
      const saved = localStorage.getItem('zac_crm_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize existing data to ensure items[] is present
          return parsed.map((item: any) => ({
            ...item,
            items: Array.isArray(item.items) && item.items.length > 0
              ? item.items
              : [{ id: `${item.id}-0`, name: item.interest || 'Tile Demand', qty: '1 lot', amount: item.estValue || 0 }]
          }));
        }
      }
    } catch (_) {}
    return DEFAULT_LEADS;
  });

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

  // Automatically calculate total budget from demand items
  const calculatedTotalBudget = demandItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zac_crm_leads', JSON.stringify(leads));
    } catch (_) {}
  }, [leads]);

  // Add Row to Demand Items
  const handleAddDemandRow = () => {
    setDemandItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random()}`, name: '', qty: '', amount: 0 }
    ]);
  };

  // Remove Row from Demand Items
  const handleRemoveDemandRow = (id: string) => {
    if (demandItems.length === 1) {
      setDemandItems([{ id: `item-${Date.now()}`, name: '', qty: '', amount: 0 }]);
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

  // Submit Lead
  const handleAddLead = (e: React.FormEvent) => {
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

    const newLead: LeadItem = {
      id: Date.now(),
      client: client.trim(),
      contact: contact.trim() || 'Direct Owner',
      phone: phone.trim(),
      items: validItems,
      interest: summaryInterest,
      estValue: calculatedTotalBudget,
      stage,
      createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      notes: notes.trim()
    };

    setLeads([newLead, ...leads]);
    
    // Reset Form
    setClient('');
    setContact('');
    setPhone('');
    setNotes('');
    setStage('New Inquiry');
    setDemandItems([{ id: `item-${Date.now()}`, name: '', qty: '', amount: 0 }]);
    toast.success(`Prospect "${newLead.client}" with ${validItems.length} demand items registered!`);
  };

  // Change Stage
  const handleUpdateStage = (id: number | string, newStage: LeadItem['stage']) => {
    setLeads(prev =>
      prev.map(item => (item.id === id ? { ...item, stage: newStage } : item))
    );
    toast.success(`Stage updated to ${newStage}`);
  };

  // Delete Lead
  const handleDeleteLead = (id: number | string, clientName: string) => {
    if (window.confirm(`Are you sure you want to remove "${clientName}" from CRM pipeline?`)) {
      setLeads(prev => prev.filter(item => item.id !== id));
      toast.success(`Lead removed`);
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
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px] uppercase">
                  Client / Organization / Project *
                </label>
                <input
                  type="text"
                  required
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. Apex Construction / Gulberg Tower / Hassan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
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
                  <button
                    type="button"
                    onClick={handleAddDemandRow}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold text-[11px] inline-flex items-center gap-1 transition"
                  >
                    <MdAdd size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {demandItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold font-mono text-slate-400">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleUpdateDemandRow(item.id, 'name', e.target.value)}
                          placeholder="Product name (e.g. 60x120 Matte Grey Tiles)"
                          className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                        />
                        {demandItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDemandRow(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          >
                            <MdClose size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => handleUpdateDemandRow(item.id, 'qty', e.target.value)}
                            placeholder="Qty (e.g. 3,500 sqft / 20 pcs)"
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => handleUpdateDemandRow(item.id, 'amount', Number(e.target.value))}
                            placeholder="Est. Amount (Rs.)"
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>
                      </div>
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
                className="mt-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-transform hover:scale-101 flex items-center justify-center gap-1.5"
                style={{ backgroundColor: activeColor.primary }}
              >
                <MdAdd size={16} />
                <span>Save Customer Demand ({demandItems.length} Items)</span>
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
                  {filteredLeads.map(l => (
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
                          {/* Itemized WhatsApp Button */}
                          <button
                            onClick={() => handleSendWhatsApp(l)}
                            title="Send WhatsApp Demand Checklist"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 transition"
                          >
                            <FaWhatsapp size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteLead(l.id, l.client)}
                            title="Remove from CRM"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 transition"
                          >
                            <MdDeleteOutline size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No customer demands found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leads;
