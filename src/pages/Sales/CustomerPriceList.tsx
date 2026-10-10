import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdPriceCheck, MdAdd, MdSearch, MdEdit, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const CustomerPriceList: React.FC = () => {
  const [priceTiers, setPriceTiers] = useState([
    { id: 1, tierName: 'Wholesale Tier A (Dealers)', discountPct: 15, appliesTo: 'Authorized Distributors', minVolume: 500, active: true },
    { id: 2, tierName: 'Builder / Contractor Rate', discountPct: 10, appliesTo: 'Construction Firms', minVolume: 200, active: true },
    { id: 3, tierName: 'Walk-in Retail Rate', discountPct: 0, appliesTo: 'Direct Showroom Buyers', minVolume: 1, active: true }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Customer Price Lists & Tiers" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Pricing Policies & Tier Matrix</h2>
            <p className="text-slate-500 text-xs">Configure category-wise dealer rates, contractor discounts and minimum volume rules</p>
          </div>
          <button
            onClick={() => toast.success('Add price tier dialog opened')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
          >
            + Create Price Tier
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Tier Name</th>
                <th className="py-2.5 px-3 text-center">Discount %</th>
                <th className="py-2.5 px-3">Target Customer Group</th>
                <th className="py-2.5 px-3 text-center">Min Order Volume</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {priceTiers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{t.tierName}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-600">{t.discountPct}% Off</td>
                  <td className="py-2.5 px-3 text-slate-500">{t.appliesTo}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{t.minVolume} Units</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      Active
                    </span>
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

export default CustomerPriceList;
