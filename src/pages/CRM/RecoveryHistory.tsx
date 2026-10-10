import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdHistory, MdAttachMoney, MdCheckCircle } from 'react-icons/md';

const RecoveryHistory: React.FC = () => {
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('customer_recoveries').select('*').limit(50).then(({ data }) => {
      if (data && data.length > 0) {
        setRecoveries(data);
      } else {
        setRecoveries([
          { id: 1, recovery_no: 'REC-092', customer_name: 'Al-Madina Traders', recovery_date: '2026-10-09', payment_mode: 'Cash Counter', net_collected_amount: 145000, receiver: 'Salesman A' },
          { id: 2, recovery_no: 'REC-091', customer_name: 'Bismillah Sanitary', recovery_date: '2026-10-08', payment_mode: 'Online Bank Transfer', net_collected_amount: 280000, receiver: 'Accounts Desk' },
          { id: 3, recovery_no: 'REC-090', customer_name: 'Metro Ceramic Store', recovery_date: '2026-10-07', payment_mode: 'Cheque / Clearing', net_collected_amount: 95000, receiver: 'Field Officer' }
        ]);
      }
    });
  }, []);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Customer Recovery History" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Payment Recovery Journal</h2>
          <p className="text-slate-500 text-xs">Chronological log of customer debt collections, payment receipts & settlement channels</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Receipt / Ref #</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Collection Date</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Collected By</th>
                <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recoveries.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{r.recovery_no || `REC-${r.id}`}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{r.customer_name || 'Customer'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.recovery_date || 'Recent'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.payment_mode || 'Cash'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.receiver || 'Accounts'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-teal-600">
                    Rs. {Number(r.net_collected_amount || r.amount || 0).toLocaleString()}
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

export default RecoveryHistory;
