import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdPauseCircleFilled, MdPlayArrow, MdDelete, MdShoppingBag } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const PosHoldOrders: React.FC = () => {
  const [holds, setHolds] = useState([
    { id: 1, holdNo: 'HOLD-041', customer: 'Mr. Kamran (Showroom)', time: '10:45 AM', itemsCount: 3, amount: 48500, counter: 'Counter 01', note: 'Customer stepped out for cash' },
    { id: 2, holdNo: 'HOLD-040', customer: 'Tile Contractor Rashid', time: '09:30 AM', itemsCount: 6, amount: 112000, counter: 'Counter 02', note: 'Awaiting size re-confirmation from site' }
  ]);

  const handleResume = (h: any) => {
    toast.success(`Resumed Hold Order ${h.holdNo} to active POS Cart`);
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="POS Hold Orders Queue" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Suspended / Parked POS Counter Carts</h2>
          <p className="text-slate-500 text-xs">Resume held customer shopping carts directly into POS billing register</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Hold #</th>
                <th className="py-2.5 px-3">Customer / Buyer</th>
                <th className="py-2.5 px-3">Parked Time</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Hold Amount (Rs.)</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {holds.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{h.holdNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{h.customer}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{h.time}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{h.itemsCount}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                    Rs. {h.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 italic">{h.note}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleResume(h)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                    >
                      <MdPlayArrow size={14} /> Resume Cart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PosHoldOrders;
