import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdReceipt, MdPrint, MdFileDownload } from 'react-icons/md';

const VendorLedger: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState('Master Tiles Mills Ltd');
  const ledgerEntries = [
    { date: '2026-10-01', ref: 'OPN-V01', description: 'Opening Payable Balance', debit: 0, credit: 1540000, balance: 1540000 },
    { date: '2026-10-03', ref: 'PUR-801', description: 'Supplier Purchase Order #PO-041', debit: 0, credit: 890000, balance: 2430000 },
    { date: '2026-10-06', ref: 'VCH-312', description: 'Bank Payment via HBL (Online)', debit: 1000000, credit: 0, balance: 1430000 },
    { date: '2026-10-08', ref: 'PR-014', description: 'Purchase Return (Debit Note)', debit: 45000, credit: 0, balance: 1385000 }
  ];

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Vendor Financial Ledger" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Supplier Payable Account Statement</h2>
            <p className="text-slate-500 text-xs">Detailed supplier credit ledger, procurement charges, and bank payout history</p>
          </div>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
          >
            <option value="Master Tiles Mills Ltd">Master Tiles Mills Ltd</option>
            <option value="Shabbir Tiles (Stile)">Shabbir Tiles (Stile)</option>
            <option value="Euro Porcelain Importers">Euro Porcelain Importers</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher / Doc #</th>
                <th className="py-2.5 px-3">Transaction Description</th>
                <th className="py-2.5 px-3 text-right">Debit Paid (-)</th>
                <th className="py-2.5 px-3 text-right">Credit Billed (+)</th>
                <th className="py-2.5 px-3 text-right">Net Payable Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ledgerEntries.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{row.date}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{row.ref}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{row.description}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">{row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white font-bold">{row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                    Rs. {row.balance.toLocaleString()}
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

export default VendorLedger;
