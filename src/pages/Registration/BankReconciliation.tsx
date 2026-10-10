import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdAccountBalance, MdCheckCircle, MdCompareArrows } from 'react-icons/md';

const BankReconciliation: React.FC = () => {
  const [bank, setBank] = useState('Habib Bank Limited (HBL) - Main Current A/C');
  const bookBalance = 8450000;
  const statementBalance = 8720000;
  const uncreditedCheques = 450000;
  const unpresentedCheques = 180000;

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Bank Reconciliation Statement (BRS)" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Bank Account Reconciliation Statement</h2>
            <p className="text-slate-500 text-xs">Match ledger book balances against bank statements, unpresented cheques & clearing funds</p>
          </div>
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
          >
            <option value="Habib Bank Limited (HBL) - Main Current A/C">Habib Bank Limited (HBL) - Main Current</option>
            <option value="Meezan Islamic Corporate Account">Meezan Islamic Corporate Account</option>
            <option value="Bank Alfalah Commercial Account">Bank Alfalah Commercial Account</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">General Ledger Balance</span>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">Rs. {bookBalance.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
            <span className="text-[10px] font-bold text-teal-600 uppercase">Bank Statement Balance</span>
            <div className="text-lg font-black font-mono text-teal-700 dark:text-teal-400 mt-1">Rs. {statementBalance.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Uncredited Deposits (+)</span>
            <div className="text-lg font-black font-mono text-amber-700 dark:text-amber-400 mt-1">Rs. {uncreditedCheques.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Unpresented Cheques (-)</span>
            <div className="text-lg font-black font-mono text-rose-700 dark:text-rose-400 mt-1">Rs. {unpresentedCheques.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliation;
