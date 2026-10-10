import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdReceiptLong, MdAdd, MdCheckCircle, MdLocalShipping, MdInventory } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const SalesOrders: React.FC = () => {
  const [orders, setOrders] = useState([
    { id: 1, orderNo: 'SO-2026-110', customer: 'Prime Builders & Co', date: '2026-10-09', itemsCount: 4, totalQty: 450, totalAmount: 890000, fulfillment: 'Processing', paymentStatus: 'Advance Received' },
    { id: 2, orderNo: 'SO-2026-109', customer: 'Crown Sanitary Mart', date: '2026-10-08', itemsCount: 2, totalQty: 200, totalAmount: 420000, fulfillment: 'Ready to Dispatch', paymentStatus: 'Full Payment' },
    { id: 3, orderNo: 'SO-2026-108', customer: 'National Ceramics Store', date: '2026-10-07', itemsCount: 6, totalQty: 900, totalAmount: 1750000, fulfillment: 'Dispatched (DC-204)', paymentStatus: 'Credit Term' }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Sales Orders (SO)" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Sales Orders Register</h2>
            <p className="text-slate-500 text-xs">Track client purchase commitments, advance receipts and warehouse dispatch statuses</p>
          </div>
          <button
            onClick={() => toast.success('New Sales Order generator initialized')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
          >
            + Create Sales Order
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Order Date</th>
                <th className="py-2.5 px-3 text-center">Total Units</th>
                <th className="py-2.5 px-3 text-right">Order Value (Rs.)</th>
                <th className="py-2.5 px-3 text-center">Fulfillment</th>
                <th className="py-2.5 px-3 text-center">Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{o.orderNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{o.customer}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{o.date}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{o.totalQty}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                    Rs. {o.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px]">
                      {o.fulfillment}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{o.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOrders;
