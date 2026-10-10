import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdTrendingUp, MdSchedule, MdCheckCircle, MdBarChart, MdCalendarToday } from 'react-icons/md';

const ScheduledValuations: React.FC = () => {
  const valuations = [
    { period: 'October 2026 (Mid-Month)', valuationMethod: 'Weighted Average Cost (AVCO)', totalSKUs: 142, totalUnits: 18450, valuationAmount: 49374026, status: 'Calculated Live', date: '2026-10-09' },
    { period: 'September 2026 (Month-End)', valuationMethod: 'FIFO (First-In, First-Out)', totalSKUs: 138, totalUnits: 16820, valuationAmount: 46848643, status: 'Closed & Audited', date: '2026-09-30' },
    { period: 'August 2026 (Month-End)', valuationMethod: 'FIFO (First-In, First-Out)', totalSKUs: 132, totalUnits: 15400, valuationAmount: 42190800, status: 'Closed & Audited', date: '2026-08-31' }
  ];

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Scheduled Valuations" />

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Inventory Valuations</h2>
            <p className="text-slate-500 text-xs">Periodic accounting asset valuations using Weighted Average Cost and FIFO rules</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition">
            Run On-Demand Valuation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Valuation Period</th>
                <th className="py-2.5 px-3">Costing Method</th>
                <th className="py-2.5 px-3 text-center">Active SKUs</th>
                <th className="py-2.5 px-3 text-right">Physical Units</th>
                <th className="py-2.5 px-3 text-right">Asset Valuation (Rs.)</th>
                <th className="py-2.5 px-3 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {valuations.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{v.period}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{v.valuationMethod}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold">{v.totalSKUs}</td>
                  <td className="py-3 px-3 text-right font-mono">{v.totalUnits.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-teal-600 dark:text-teal-400 text-sm">
                    Rs. {v.valuationAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      {v.status}
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

export default ScheduledValuations;
