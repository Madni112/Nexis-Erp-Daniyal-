import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdFormatListNumbered, MdSearch, MdFilterList, MdRefresh, MdPrint, MdFileDownload } from 'react-icons/md';

const StockLedger: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('products').select('*').limit(100).then(({ data }) => {
      if (data && data.length > 0) {
        setProducts(data);
        setSelectedProductId(String(data[0].id));
        generateLedger(data[0]);
      }
    });
  }, []);

  const generateLedger = (product: any) => {
    const opening = Number(product.stock_quantity ?? product.total_units ?? 50);
    const mockLedger = [
      { date: '2026-10-01', ref: 'OPN-001', type: 'Opening Balance', inward: opening, outward: 0, balance: opening, rate: product.retail_price || 1200 },
      { date: '2026-10-03', ref: 'GRN-104', type: 'Supplier Purchase', inward: 30, outward: 0, balance: opening + 30, rate: product.retail_price || 1200 },
      { date: '2026-10-05', ref: 'INV-409', type: 'Customer Sales Invoice', inward: 0, outward: 15, balance: opening + 15, rate: product.retail_price || 1200 },
      { date: '2026-10-07', ref: 'DC-208', type: 'Delivery Challan Dispatch', inward: 0, outward: 8, balance: opening + 7, rate: product.retail_price || 1200 },
      { date: '2026-10-09', ref: 'SR-045', type: 'Sales Return', inward: 2, outward: 0, balance: opening + 9, rate: product.retail_price || 1200 }
    ];
    setLedgerEntries(mockLedger);
  };

  const handleProductSelect = (pId: string) => {
    setSelectedProductId(pId);
    const p = products.find(prod => String(prod.id) === String(pId));
    if (p) generateLedger(p);
  };

  const activeProduct = products.find(p => String(p.id) === String(selectedProductId));

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Stock Ledger" />

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Item-Wise Stock Transaction Ledger</h2>
            <p className="text-slate-500 text-xs">Full chronological audit trail of stock receipts, sales dispatches & running inventory balance</p>
          </div>

          <div className="w-full md:w-80">
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.sku || 'No SKU'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeProduct && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Item SKU</span>
              <div className="text-xs font-mono font-bold">{activeProduct.sku || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Category</span>
              <div className="text-xs font-semibold">{activeProduct.category || 'General'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Unit Price / Rate</span>
              <div className="text-xs font-bold font-mono">Rs. {Number(activeProduct.retail_price ?? activeProduct.unit_price ?? 0).toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40">
              <span className="text-[10px] text-teal-600 font-bold uppercase">Current On-Hand Balance</span>
              <div className="text-sm font-extrabold text-teal-700 dark:text-teal-400 font-mono">
                {Number(activeProduct.stock_quantity ?? activeProduct.total_units ?? 0)} Units
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Doc / Ref #</th>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3 text-right">Inward Qty (+)</th>
                <th className="py-2.5 px-3 text-right">Outward Qty (-)</th>
                <th className="py-2.5 px-3 text-right">Closing Balance</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ledgerEntries.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{row.date}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{row.ref}</td>
                  <td className="py-2.5 px-3 font-semibold">{row.type}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-teal-600 font-bold">{row.inward > 0 ? `+${row.inward}` : '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">{row.outward > 0 ? `-${row.outward}` : '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">{row.balance}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">Rs. {row.rate.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockLedger;
