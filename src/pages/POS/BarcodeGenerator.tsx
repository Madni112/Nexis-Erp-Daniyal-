import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdQrCode2, MdPrint, MdFormatShapes } from 'react-icons/md';

const BarcodeGenerator: React.FC = () => {
  const [sku, setSku] = useState('POR-6060-MAT');
  const [productTitle, setProductTitle] = useState('Full Body Porcelain 60x60 Matte Grey');
  const [price, setPrice] = useState('1450');
  const [copies, setCopies] = useState(12);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Barcode & Label Generator" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Barcode Sticker Parameters
          </h3>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Item SKU / Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Product Name on Label</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Retail Price (Rs.)</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Print Copies</label>
                <input
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(Number(e.target.value || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <MdPrint size={16} /> Print Barcode Labels
            </button>
          </div>
        </div>

        {/* Live Sticker Preview */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
            Thermal Sticker Preview (50mm x 30mm)
          </span>
          <div className="w-64 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white text-slate-900 text-center shadow-md flex flex-col items-center select-none">
            <div className="font-extrabold text-[12px] uppercase tracking-wider">XENITH CERAMICS</div>
            <div className="text-[10px] font-semibold text-slate-600 truncate max-w-[200px] mt-0.5">{productTitle}</div>
            
            {/* Barcode Lines Graphic */}
            <div className="my-2 py-1 px-4 bg-slate-100 rounded flex flex-col items-center">
              <div className="h-10 w-44 flex items-center justify-center gap-1 overflow-hidden">
                {[2,1,3,1,2,3,1,2,1,3,2,1,2,3,1,2,1,3,1,2,3].map((w, i) => (
                  <div key={i} className="h-8 bg-black" style={{ width: `${w * 2}px` }} />
                ))}
              </div>
              <div className="font-mono text-[10px] tracking-widest font-bold mt-0.5">{sku}</div>
            </div>

            <div className="font-black text-sm font-mono mt-1 text-slate-900">
              MRP: Rs. {Number(price || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
