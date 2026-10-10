import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdReceiptLong, MdAdd, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const JournalVouchers: React.FC = () => {
  const [jvList, setJvList] = useState([
    { id: 1, jvNo: 'JV-2026-031', date: '2026-10-09', debitAccount: 'Electricity & Utility Expense', creditAccount: 'Accrued Expenses Payable', amount: 84000, narration: 'Monthly showroom power bill accrual', status: 'Posted' },
    { id: 2, jvNo: 'JV-2026-030', date: '2026-10-07', debitAccount: 'Depreciation on Showroom Fixtures', creditAccount: 'Accumulated Depreciation', amount: 35000, narration: 'Quarterly equipment depreciation entry', status: 'Posted' },
    { id: 3, jvNo: 'JV-2026-029', date: '2026-10-04', debitAccount: 'Owner Equity Withdrawals', creditAccount: 'Petty Cash Desk', amount: 150000, narration: 'Director personal drawing settlement', status: 'Posted' }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="General Journal Vouchers (JV)" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">General Journal Accounting Vouchers</h2>
            <p className="text-slate-500 text-xs">Post non-cash adjusting entries, depreciation, accrued expenses & inter-account transfers</p>
          </div>
          <button
            onClick={() => toast.success('New JV modal opened')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
          >
            + Create Journal Voucher
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">JV #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Debit Head</th>
                <th className="py-2.5 px-3">Credit Head</th>
                <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                <th className="py-2.5 px-3">Narration</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jvList.map(j => (
                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{j.jvNo}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{j.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{j.debitAccount}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">{j.creditAccount}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                    Rs. {j.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{j.narration}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      {j.status}
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

export default JournalVouchers;
