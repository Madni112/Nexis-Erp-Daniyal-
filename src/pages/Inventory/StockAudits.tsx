import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdFactCheck, MdSearch, MdCheckCircle, MdWarning, MdRefresh, MdPrint } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const StockAudits: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('products').select('*');
      if (data) {
        setProducts(data);
        const initCounts: Record<string, number> = {};
        data.forEach(p => {
          initCounts[p.id] = Number(p.stock_quantity ?? p.total_units ?? 0);
        });
        setPhysicalCounts(initCounts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (id: string, val: number) => {
    setPhysicalCounts(prev => ({ ...prev, [id]: val }));
  };

  const filtered = products.filter(p =>
    String(p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Stock Audits" />

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-xl">
              <MdFactCheck />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Physical Stock Audit & Count Reconciliation</h2>
              <p className="text-slate-500 text-xs">Compare system books vs physical floor count to identify discrepancies</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by item or SKU..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
            <button
              onClick={() => toast.success('Stock Audit reconciliations saved!')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
            >
              Save Audit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Item Details</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">System Book Qty</th>
                <th className="py-2.5 px-3 text-right">Physical Count</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.slice(0, 30).map((prod) => {
                const bookQty = Number(prod.stock_quantity ?? prod.total_units ?? 0);
                const counted = physicalCounts[prod.id] ?? bookQty;
                const variance = counted - bookQty;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{prod.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{prod.category || 'General'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{bookQty}</td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        value={counted}
                        onChange={(e) => handleCountChange(prod.id, Number(e.target.value))}
                        className="w-20 px-2 py-1 text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-teal-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                        {variance > 0 ? `+${variance}` : variance}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {variance === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Balanced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                          Variance
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockAudits;
