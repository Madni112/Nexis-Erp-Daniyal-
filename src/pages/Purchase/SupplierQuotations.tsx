import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdRequestPage, MdAdd, MdCompareArrows, MdCheckCircle } from 'react-icons/md';

const SupplierQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState([
    { id: 1, reqNo: 'RFQ-2026-015', vendor: 'Master Ceramic Industries', itemCategory: 'Porcelain Tiles 60x60', offeredRate: 'Rs. 1,450 / box', leadTime: '5 Days', status: 'Accepted for PO' },
    { id: 2, reqNo: 'RFQ-2026-016', vendor: 'Sonex Sanitaryware', itemCategory: 'Luxury Bath Fittings', offeredRate: 'Rs. 4,200 / set', leadTime: '3 Days', status: 'Comparing Quotes' },
    { id: 3, reqNo: 'RFQ-2026-017', vendor: 'Crown Adhesive Chemicals', itemCategory: 'Tile Bond 20kg', offeredRate: 'Rs. 620 / bag', leadTime: '1 Day', status: 'Approved' }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Supplier Quotations & RFQs" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Supplier Price Quotations & Rate Comparison</h2>
          <p className="text-slate-500 text-xs">Compare supplier price bids, commercial freight terms, and delivery lead times</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">RFQ / Bid #</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">Category / Material</th>
                <th className="py-2.5 px-3 text-right">Offered Rate</th>
                <th className="py-2.5 px-3 text-center">Lead Time</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{q.reqNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{q.vendor}</td>
                  <td className="py-2.5 px-3 text-slate-500">{q.itemCategory}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{q.offeredRate}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400">{q.leadTime}</td>
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

export default SupplierQuotations;
