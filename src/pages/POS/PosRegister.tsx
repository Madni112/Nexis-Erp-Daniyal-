import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdAccountBalanceWallet, MdLockClock, MdCheckCircle, MdReceiptLong, MdAttachMoney } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const PosRegister: React.FC = () => {
  const [openingCash, setOpeningCash] = useState('15000');
  const [registerStatus, setRegisterStatus] = useState<'open' | 'closed'>('open');
  const [todaySalesCash, setTodaySalesCash] = useState(148500);
  const [todayReturnsCash, setTodayReturnsCash] = useState(4200);

  const expectedClosing = Number(openingCash || 0) + todaySalesCash - todayReturnsCash;

  const handleCloseRegister = () => {
    setRegisterStatus('closed');
    toast.success('POS Register Shift successfully reconciled and closed!');
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="POS Shift Register & Day End" />

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-xl">
              <MdAccountBalanceWallet />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily POS Cash Drawer Register</h2>
              <p className="text-slate-500 text-xs">Shift reconciliation, opening float, cash collections and day-end audit</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full font-bold text-xs uppercase ${registerStatus === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            Shift Status: {registerStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Opening Float Cash</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">Rs. {Number(openingCash).toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Cash Collections</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">+Rs. {todaySalesCash.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
            <span className="text-[10px] font-bold text-teal-600 uppercase">Calculated Drawer Cash</span>
            <div className="text-xl font-black text-teal-700 dark:text-teal-400 font-mono mt-1">Rs. {expectedClosing.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCloseRegister}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
          >
            Close Register Shift & Lock Drawer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosRegister;
