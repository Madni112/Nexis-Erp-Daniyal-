import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdOutlineCategory, MdAdd, MdEdit, MdDelete, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const AdjustmentTypes: React.FC = () => {
  const [types, setTypes] = useState([
    { id: 1, name: 'Damaged in Warehouse', nature: 'Decrease (-)', account: 'Loss on Damaged Inventory', active: true },
    { id: 2, name: 'Sample Dispensation', nature: 'Decrease (-)', account: 'Marketing & Samples Expense', active: true },
    { id: 3, name: 'Physical Count Surplus', nature: 'Increase (+)', account: 'Inventory Variance Gain', active: true },
    { id: 4, name: 'Expired Material', nature: 'Decrease (-)', account: 'Scrap & Obsolescence Expense', active: true },
    { id: 5, name: 'Supplier Inward Discrepancy', nature: 'Increase (+)', account: 'Supplier Return Clearing', active: true }
  ]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeNature, setNewTypeNature] = useState('Decrease (-)');

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setTypes([...types, {
      id: Date.now(),
      name: newTypeName.trim(),
      nature: newTypeNature,
      account: 'General Inventory Adjustment',
      active: true
    }]);
    setNewTypeName('');
    toast.success('Adjustment Type added successfully!');
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Adjustment Types" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Define New Adjustment Type
          </h3>
          <form onSubmit={handleAddType} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Reason Title</label>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Water Damage / Exhibition Display..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Default Nature</label>
              <select
                value={newTypeNature}
                onChange={(e) => setNewTypeNature(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="Decrease (-)">Decrease Inventory (-)</option>
                <option value="Increase (+)">Increase Inventory (+)</option>
              </select>
            </div>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
            >
              Add Adjustment Reason
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Configured Adjustment Reasons
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Type Name</th>
                <th className="py-2.5 px-3">Nature</th>
                <th className="py-2.5 px-3">Associated Ledger</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {types.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{t.name}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded-md ${t.nature.includes('+') ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
                      {t.nature}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{t.account}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Active</span>
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

export default AdjustmentTypes;
