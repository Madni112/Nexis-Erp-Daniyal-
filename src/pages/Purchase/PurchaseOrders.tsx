import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdShoppingCart, MdAdd, MdCheckCircle, MdFactCheck } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const PurchaseOrders: React.FC = () => {
  const [poList, setPoList] = useState([
    { id: 1, poNo: 'PO-2026-041', vendor: 'Master Tiles & Ceramics Mills', date: '2026-10-08', totalUnits: 1200, amount: 2840000, status: 'Goods In Transit (GRN Pending)', paymentTerms: '30 Days Net' },
    { id: 2, poNo: 'PO-2026-040', vendor: 'Shabbir Tiles (Stile)', date: '2026-10-05', totalUnits: 800, amount: 1950000, status: 'Received Full', paymentTerms: 'Advance 50%' },
    { id: 3, poNo: 'PO-2026-039', vendor: 'Euro Porcelain Importers', date: '2026-10-02', totalUnits: 600, amount: 1680000, status: 'Received Full', paymentTerms: 'LC At Sight' }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Purchase Orders (PO)" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Supplier Purchase Orders Register</h2>
            <p className="text-slate-500 text-xs">Generate purchase orders, monitor supplier shipment statuses and match against GRNs</p>
          </div>
          <button
            onClick={() => toast.success('New PO generated')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
          >
            + Create Purchase Order
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">PO #</th>
                <th className="py-2.5 px-3">Supplier / Mill</th>
                <th className="py-2.5 px-3">PO Date</th>
                <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                <th className="py-2.5 px-3 text-right">PO Total (Rs.)</th>
                <th className="py-2.5 px-3 text-center">GRN Status</th>
                <th className="py-2.5 px-3 text-center">Payment Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {poList.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{p.poNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{p.vendor}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{p.date}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{p.totalUnits}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {p.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px]">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{p.paymentTerms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
