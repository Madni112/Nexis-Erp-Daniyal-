import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdBalance, MdFileDownload, MdPrint } from 'react-icons/md';

const TrialBalance: React.FC = () => {
  const accounts = [
    { code: '1001', title: 'Cash in Hand (Counter Float)', type: 'Asset', debit: 9392857, credit: 0 },
    { code: '1002', title: 'Bank Accounts (HBL / Meezan)', type: 'Asset', debit: 8450000, credit: 0 },
    { code: '1003', title: 'Merchandise Inventory Assets', type: 'Asset', debit: 49374026, credit: 0 },
    { code: '1004', title: 'Accounts Receivable (Trade Debtors)', type: 'Asset', debit: 439128, credit: 0 },
    { code: '2001', title: 'Accounts Payable (Trade Creditors)', type: 'Liability', debit: 0, credit: 18450000 },
    { code: '3001', title: 'Owner Capital & Equity', type: 'Equity', debit: 0, credit: 45000000 },
    { code: '4001', title: 'Sales Revenue (Gross)', type: 'Income', debit: 0, credit: 24650000 },
    { code: '5001', title: 'Cost of Goods Sold (COGS)', type: 'Expense', debit: 18200000, credit: 0 },
    { code: '5002', title: 'Showroom Operational Expenses', type: 'Expense', debit: 2243989, credit: 0 }
  ];

  const totalDebit = accounts.reduce((acc, a) => acc + a.debit, 0);
  const totalCredit = accounts.reduce((acc, a) => acc + a.credit, 0);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Trial Balance Statement" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">General Ledger Trial Balance</h2>
            <p className="text-slate-500 text-xs">Double-entry account verification ensuring debit and credit equality across the ledger</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold text-xs"
          >
            Print Statement
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Account Code</th>
                <th className="py-2.5 px-3">Account Title</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Debit Balance (Rs.)</th>
                <th className="py-2.5 px-3 text-right">Credit Balance (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map(a => (
                <tr key={a.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{a.code}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{a.title}</td>
                  <td className="py-2.5 px-3 text-slate-400">{a.type}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {a.debit > 0 ? `Rs. ${a.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {a.credit > 0 ? `Rs. ${a.credit.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-black text-sm bg-slate-50 dark:bg-slate-800/60">
                <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-slate-900 dark:text-white">Total Ledger Balance</td>
                <td className="py-3 px-3 text-right font-mono text-teal-600">Rs. {totalDebit.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-teal-600">Rs. {totalCredit.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
