import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import {
  MdQrCodeScanner,
  MdOutlineWarehouse,
  MdCheckCircle,
  MdArrowUpward,
  MdArrowDownward,
  MdSearch,
  MdRefresh,
  MdPrint,
  MdInventory2
} from 'react-icons/md';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { toast } from 'react-hot-toast';

const WarehouseTerminal: React.FC = () => {
  const [scanInput, setScanInput] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('Main Showroom / A-39');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('products').select('*').limit(50);
      if (data) setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const query = scanInput.trim().toLowerCase();
    const match = products.find(
      (p) =>
        String(p.sku || '').toLowerCase() === query ||
        String(p.product_name || '').toLowerCase().includes(query) ||
        String(p.barcode || '').toLowerCase() === query
    );

    const scanRecord = {
      id: Date.now(),
      code: scanInput,
      name: match ? match.product_name : `Scanned Item #${scanInput}`,
      category: match?.category || 'General Stock',
      qty: 1,
      time: new Date().toLocaleTimeString(),
      status: match ? 'Matched' : 'Unindexed'
    };

    setRecentScans([scanRecord, ...recentScans.slice(0, 19)]);
    setScanInput('');
    if (match) {
      toast.success(`Scanned: ${match.product_name}`);
    } else {
      toast('Item logged to terminal buffer', { icon: '📦' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Warehouse Terminal" />

      {/* Terminal Control Bar */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl">
              <MdOutlineWarehouse />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Warehouse Live Terminal</h2>
              <p className="text-slate-500 text-xs">High-speed barcode scanner & inward/outward dispatch queue</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="Main Showroom / A-39">Main Showroom (A-39)</option>
              <option value="Central Warehouse (SHOP)">Central Warehouse (SHOP)</option>
              <option value="Transit Dispatch Bay">Transit Dispatch Bay</option>
            </select>

            <button
              onClick={fetchProducts}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold transition text-xs"
            >
              <MdRefresh size={16} /> Sync Stock
            </button>
          </div>

        </div>

        {/* Barcode Scanner Input */}
        <form onSubmit={handleScanSubmit} className="mt-5">
          <div className="relative">
            <MdQrCodeScanner className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 text-xl" />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan Barcode / SKU / Serial Number or type product name and press Enter..."
              autoFocus
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl border-2 border-teal-500/40 focus:border-teal-600 focus:outline-none bg-teal-50/20 dark:bg-teal-950/20 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
            >
              Log Scan
            </button>
          </div>
        </form>
      </div>

      {/* Terminal Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Scanned Buffer */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                <MdCheckCircle size={14} />
              </span>
              Active Session Scans
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold font-mono text-[11px]">
              {recentScans.length} Items Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Item / Description</th>
                  <th className="py-2.5 px-3">Barcode/SKU</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{scan.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{scan.code}</td>
                      <td className="py-2.5 px-3 text-slate-400">{scan.time}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px]">
                          {scan.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No scans in current session. Point barcode reader at an item to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Inventory Look-up */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MdInventory2 className="text-teal-600 text-base" /> Quick Inventory Catalog
            </h3>
            <span className="text-xs text-slate-400 font-mono">{products.length} Products</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {products.slice(0, 15).map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between hover:border-teal-500/40 transition"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">{prod.product_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    SKU: {prod.sku || 'N/A'} • Cat: {prod.category || 'General'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                    {Number(prod.stock_quantity ?? prod.total_units ?? 0)} Units
                  </div>
                  <div className="text-[10px] text-slate-400">Rs. {Number(prod.retail_price ?? prod.unit_price ?? 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WarehouseTerminal;
