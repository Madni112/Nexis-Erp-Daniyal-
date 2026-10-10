import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdLocalShipping, MdPhone, MdPerson, MdCheckCircle } from 'react-icons/md';

const DriversDirectory: React.FC = () => {
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'Muhammad Aslam', phone: '0300-7766554', vehicleNo: 'LES-2024 (Mazda Truck)', licenseNo: 'LHR-984321', route: 'Lahore Showroom - Multan Depot', active: true },
    { id: 2, name: 'Tariq Mehmood', phone: '0321-3344556', vehicleNo: 'KHI-8890 (Shahzore Pickup)', licenseNo: 'KHI-443210', route: 'Central Warehouse - Local Delivery', active: true },
    { id: 3, name: 'Rashid Ali', phone: '0333-5566778', vehicleNo: 'FSD-1122 (Hino Medium)', licenseNo: 'FSD-776543', route: 'Mill Inward Transportation', active: true }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Drivers & Freight Directory" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Logistics Drivers & Fleet Directory</h2>
          <p className="text-slate-500 text-xs">Manage delivery fleet drivers, assigned truck plates, contact numbers and shipping routes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Driver Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Assigned Vehicle</th>
                <th className="py-2.5 px-3">License #</th>
                <th className="py-2.5 px-3">Primary Route</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {drivers.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{d.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{d.phone}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{d.vehicleNo}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{d.licenseNo}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{d.route}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Active</span>
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

export default DriversDirectory;
