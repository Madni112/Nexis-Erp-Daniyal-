import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdRequestQuote, MdAdd, MdSearch, MdPrint, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const Quotations: React.FC = () => {
  const [quotes, setQuotes] = useState([
    { id: 1, quoteNo: 'QT-2026-081', customer: 'Grand Horizon Mall', date: '2026-10-08', amount: 3450000, validUntil: '2026-10-25', status: 'Pending Review' },
    { id: 2, quoteNo: 'QT-2026-080', customer: 'Al-Madina Housing Scheme', date: '2026-10-06', amount: 1890000, validUntil: '2026-10-20', status: 'Approved' },
    { id: 3, quoteNo: 'QT-2026-079', customer: 'Skyline Architects', date: '2026-10-04', amount: 920000, validUntil: '2026-10-18', status: 'Converted to Invoice' }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Sales Quotations & Estimates" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Quotations & Estimates</h2>
            <p className="text-slate-500 text-xs">Generate proforma quotations, price proposals and track customer approvals</p>
          </div>
          <button
            onClick={() => toast.success('New quotation generator ready')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
          >
            + Create New Quotation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Quote #</th>
                <th className="py-2.5 px-3">Customer / Project</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Validity</th>
                <th className="py-2.5 px-3 text-right">Quoted Amount (Rs.)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{q.quoteNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{q.customer}</td>
                  <td className="py-2.5 px-3 text-slate-400">{q.date}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{q.validUntil}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {q.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px]">
                      {q.status}
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

export default Quotations;
