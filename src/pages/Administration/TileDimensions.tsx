import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdStraighten, MdAdd, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const TileDimensions: React.FC = () => {
  const [dimensions, setDimensions] = useState([
    { id: 1, sizeName: '60 x 60 cm', sqftPerBox: 15.5, pcsPerBox: 4, thickness: '9 mm', active: true },
    { id: 2, sizeName: '60 x 120 cm', sqftPerBox: 15.5, pcsPerBox: 2, thickness: '10 mm', active: true },
    { id: 3, sizeName: '30 x 60 cm', sqftPerBox: 15.5, pcsPerBox: 8, thickness: '8 mm', active: true },
    { id: 4, sizeName: '80 x 80 cm', sqftPerBox: 20.66, pcsPerBox: 3, thickness: '10.5 mm', active: true },
    { id: 5, sizeName: '120 x 240 cm (Slab)', sqftPerBox: 31.0, pcsPerBox: 1, thickness: '12 mm', active: true }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Tile Dimensions & Box Matrix" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tile Dimension Standard Master</h2>
            <p className="text-slate-500 text-xs">Standard tile dimensions, SQFT coverage per box, pieces per carton & thickness specs</p>
          </div>
          <button
            onClick={() => toast.success('Add tile dimension dialog')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
          >
            + Add Tile Size
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Size Matrix</th>
                <th className="py-2.5 px-3 text-center">Sqft / Box</th>
                <th className="py-2.5 px-3 text-center">Pcs / Box</th>
                <th className="py-2.5 px-3">Thickness</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dimensions.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white font-mono text-sm">{d.sizeName}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-600">{d.sqftPerBox} SQFT</td>
                  <td className="py-2.5 px-3 text-center font-mono">{d.pcsPerBox} Pieces</td>
                  <td className="py-2.5 px-3 text-slate-500">{d.thickness}</td>
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

export default TileDimensions;
