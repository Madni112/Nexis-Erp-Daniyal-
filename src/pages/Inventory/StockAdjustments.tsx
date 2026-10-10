import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdAdd, MdFilterList, MdCheck, MdSwapVert, MdWarning, MdHistory } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const StockAdjustments: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('Damaged / Broken');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentAction, setAdjustmentAction] = useState<'decrease' | 'increase'>('decrease');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<any[]>([
    { id: 1, date: 'Today', product: 'Ceramic Floor Tile 60x60', type: 'Damaged / Transit', qty: -4, user: 'Warehouse Manager', status: 'Approved' },
    { id: 2, date: 'Yesterday', product: 'Porcelain Wall Tile Matte', type: 'Physical Count Surplus', qty: +12, user: 'Auditor', status: 'Approved' },
    { id: 3, date: 'Oct 07, 2026', product: 'Grout Sealant 5kg', type: 'Sample Dispensation', qty: -2, user: 'Showroom Incharge', status: 'Approved' }
  ]);

  useEffect(() => {
    supabase.from('products').select('*').limit(100).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustmentQty) {
      toast.error('Please select product and adjustment quantity');
      return;
    }

    const prodObj = products.find(p => String(p.id) === String(selectedProduct));
    const qtyNum = Number(adjustmentQty);
    const finalQty = adjustmentAction === 'decrease' ? -Math.abs(qtyNum) : Math.abs(qtyNum);

    const newRecord = {
      id: Date.now(),
      date: 'Just now',
      product: prodObj?.product_name || 'Selected Item',
      type: adjustmentType,
      qty: finalQty,
      user: 'Administrator',
      status: 'Approved'
    };

    setHistory([newRecord, ...history]);
    setSelectedProduct('');
    setAdjustmentQty('');
    setNotes('');
    toast.success('Stock adjustment voucher logged successfully!');
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Stock Adjustments" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Create Adjustment */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="p-1 rounded-md bg-teal-50 text-teal-600 font-bold">
              <MdSwapVert size={18} />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Stock Adjustment</h3>
          </div>

          <form onSubmit={handleCreateAdjustment} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Select Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              >
                <option value="">-- Choose Item from Inventory --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.product_name} ({p.sku || 'No SKU'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Action</label>
                <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction('decrease')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${adjustmentAction === 'decrease' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    Decrease (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction('increase')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${adjustmentAction === 'increase' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    Increase (+)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Adjustment Qty</label>
                <input
                  type="number"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  placeholder="Units"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Adjustment Reason / Type</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              >
                <option value="Damaged / Broken">Damaged / Broken in Warehouse</option>
                <option value="Physical Count Variance">Physical Count Variance (Audit)</option>
                <option value="Sample Dispensation">Marketing / Client Sample</option>
                <option value="Expired / Obsolete">Expired / Obsolete Material</option>
                <option value="Supplier Return Discrepancy">Supplier Return Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Internal Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Audit notes or inspection report number..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition text-xs"
            >
              Post Stock Adjustment
            </button>
          </form>
        </div>

        {/* Right Table: Adjustment Journal */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MdHistory className="text-teal-600 text-base" /> Stock Adjustment Audit Ledger
            </h3>
            <span className="text-xs text-slate-400">{history.length} Transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Adjustment Reason</th>
                  <th className="py-2.5 px-3 text-center">Variance</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{h.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{h.product}</td>
                    <td className="py-2.5 px-3 text-slate-500">{h.type}</td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono">
                      <span className={`px-2 py-0.5 rounded-full ${h.qty > 0 ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
                        {h.qty > 0 ? `+${h.qty}` : h.qty}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StockAdjustments;
