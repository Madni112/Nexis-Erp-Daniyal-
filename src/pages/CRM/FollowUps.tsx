import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdSchedule, MdCheckCircle, MdPhone, MdPerson, MdCalendarToday } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const FollowUps: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 1, customer: 'Al-Haram Builders', contact: '0300-8877665', reason: 'Tile sample feedback & pricing discount', dueDate: 'Today, 4:00 PM', assignedTo: 'Sales Team', priority: 'High' },
    { id: 2, customer: 'Crescent Heights', contact: '0321-4433221', reason: 'Payment collection follow-up for Inv #1042', dueDate: 'Tomorrow', assignedTo: 'Recovery Officer', priority: 'Urgent' },
    { id: 3, customer: 'Metro Developers', contact: '0333-9988776', reason: 'Commercial site measurement verification', dueDate: 'Oct 12, 2026', assignedTo: 'Field Engineer', priority: 'Normal' }
  ]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="CRM Follow-ups & Activities" />
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Client Follow-up Schedule</h2>
            <p className="text-slate-500 text-xs">Track sales calls, sample feedbacks, site inspections and recovery reminders</p>
          </div>
          <button
            onClick={() => toast.success('New follow-up task scheduled')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
          >
            + Add Follow-up Task
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Follow-up Objective</th>
                <th className="py-2.5 px-3">Due Schedule</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3 text-center">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{t.customer}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{t.contact}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{t.reason}</td>
                  <td className="py-2.5 px-3 font-mono text-teal-600 font-bold">{t.dueDate}</td>
                  <td className="py-2.5 px-3 text-slate-500">{t.assignedTo}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${t.priority === 'Urgent' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'}`}>
                      {t.priority}
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

export default FollowUps;
