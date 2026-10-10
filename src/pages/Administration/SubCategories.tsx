import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdCategory, MdAdd, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const SubCategories: React.FC = () => {
  const [subCats, setSubCats] = useState([
    { id: 1, parentCategory: 'Porcelain Tiles', subName: 'Full Body Glazed Porcelain', code: 'POR-FBG', active: true },
    { id: 2, parentCategory: 'Porcelain Tiles', subName: 'Matte Finish Outdoor Paver', code: 'POR-MOP', active: true },
    { id: 3, parentCategory: 'Ceramic Wall Tiles', subName: 'Glossy Kitchen Subway Tiles', code: 'CER-SUB', active: true },
    { id: 4, parentCategory: 'Sanitary Ware', subName: 'Wall-Hung Smart Commodes', code: 'SAN-WHC', active: true }
  ]);
  const [parent, setParent] = useState('Porcelain Tiles');
  const [subName, setSubName] = useState('');
  const [code, setCode] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    setSubCats([...subCats, { id: Date.now(), parentCategory: parent, subName: subName.trim(), code: code || 'SUB-001', active: true }]);
    setSubName('');
    setCode('');
    toast.success('Sub-category created successfully!');
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Sub-Categories Matrix" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Create Sub-Category
          </h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Parent Category</label>
              <select
                value={parent}
                onChange={(e) => setParent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="Porcelain Tiles">Porcelain Tiles</option>
                <option value="Ceramic Wall Tiles">Ceramic Wall Tiles</option>
                <option value="Sanitary Ware">Sanitary Ware</option>
                <option value="Adhesives & Grout">Adhesives & Grout</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Sub-Category Name</label>
              <input
                type="text"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Hexagon Mosaic..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1 text-[11px] uppercase">Short Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. HEX-MOS"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
            >
              Save Sub-Category
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Defined Sub-Categories
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Parent Group</th>
                <th className="py-2.5 px-3">Sub-Category</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subCats.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-500">{s.parentCategory}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{s.subName}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{s.code}</td>
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

export default SubCategories;
