import React, { useMemo, useState } from 'react';
import { Banknote, Eye, Pencil, Trash2, X } from 'lucide-react';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import { isoDay } from '../../utils/dateRange';
import {
  deleteLoan, EmployeeLoan, getLoans, monthNamed, saveLoan, updateLoan
} from '../../services/hr.service';
import {
  Area, Check, DateWindow, DeleteConfirm, Field, FormFooter, IconAction, ListToolbar, NumCell, Pick,
  RegisterStat, SearchBox, SearchPick, SortHeader, SortState, StatStrip, StatusPills, TabStrip,
  TableEmpty, Text
} from '../Masters/masterUi';
import { useHub } from '../Setup/useHub';

const money = (n: number) => Math.round(Number(n || 0)).toLocaleString();

export const calcEndMonth = (startMonthStr?: string, monthsCount: number = 1): string => {
  if (!startMonthStr) return '';
  const count = Math.max(1, Number(monthsCount) || 1);
  const [yearStr, monthStr] = startMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return startMonthStr;
  const d = new Date(year, month - 1 + (count - 1), 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const blank = (months: string[]): Partial<EmployeeLoan> => ({
  employeeId: 0, kind: 'Advance', purpose: '', sanctionedOn: isoDay(),
  amount: 0, installments: 1, installmentAmount: 0, startMonth: months[0] ?? isoDay().slice(0, 7),
  paidOutOf: 'Cash', accountId: null, cashAmount: 0, bankId: null, bankAmount: 0, chequeNo: '',
  remarks: '', status: 'Active'
});

const STATUS_TONE: Record<string, string> = {
  Active: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  Closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  Cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
};

/**
 * Month-Wise Schedule & Statement Breakdown Modal
 */
const LoanDetailsModal: React.FC<{
  loan: EmployeeLoan | null;
  onClose: () => void;
}> = ({ loan, onClose }) => {
  if (!loan) return null;

  const isAdv = (loan.kind || '').toLowerCase().includes('adv');
  const totalAmt = Number(loan.amount || 0);
  const recoveredAmt = Number(loan.deducted || loan.recoveredAmount || 0);
  const balanceAmt = Number(loan.balance || 0);
  const totalInstallments = Math.max(1, Number(loan.installments || 1));
  const perMonthAmt = Number(loan.installmentAmount || Math.round(totalAmt / totalInstallments));

  // Generate month-wise schedule accounting for skipped/grace months
  const skippedSet = new Set(loan.skippedMonths || []);
  const historyMap = new Map((loan.deductionHistory || []).map(h => [h.month, h.amount]));

  const schedule: {
    index: number;
    monthCode: string;
    monthName: string;
    expected: number;
    actualPaid: number;
    remainingBalance: number;
    isPaid: boolean;
    isPartial: boolean;
    isSkipped: boolean;
  }[] = [];

  let currentMonth = loan.startMonth || isoDay().slice(0, 7);
  let installmentCount = 0;
  let runningRecovered = 0;
  let safetyLoop = 0;

  while (installmentCount < totalInstallments && safetyLoop < 48) {
    safetyLoop++;
    const isSkipped = skippedSet.has(currentMonth);

    if (isSkipped) {
      schedule.push({
        index: schedule.length + 1,
        monthCode: currentMonth,
        monthName: monthNamed(currentMonth),
        expected: 0,
        actualPaid: 0,
        remainingBalance: Math.max(0, totalAmt - runningRecovered),
        isPaid: false,
        isPartial: false,
        isSkipped: true
      });
      // Move to next month without consuming an installment
      currentMonth = calcEndMonth(currentMonth, 2);
      continue;
    }

    installmentCount++;
    const expected = installmentCount === totalInstallments ? (totalAmt - perMonthAmt * (totalInstallments - 1)) : perMonthAmt;
    
    let actualPaid = 0;
    if (historyMap.has(currentMonth)) {
      actualPaid = historyMap.get(currentMonth) || 0;
    } else {
      const prevExpected = (installmentCount - 1) * perMonthAmt;
      if (recoveredAmt >= prevExpected + expected) {
        actualPaid = expected;
      } else if (recoveredAmt > prevExpected) {
        actualPaid = recoveredAmt - prevExpected;
      }
    }

    runningRecovered += actualPaid;
    const remainingBalance = Math.max(0, totalAmt - runningRecovered);
    const isPaid = actualPaid >= expected && expected > 0;
    const isPartial = actualPaid > 0 && actualPaid < expected;

    schedule.push({
      index: schedule.length + 1,
      monthCode: currentMonth,
      monthName: monthNamed(currentMonth),
      expected,
      actualPaid,
      remainingBalance,
      isPaid,
      isPartial,
      isSkipped: false
    });

    currentMonth = calcEndMonth(currentMonth, 2);
  }

  const lastScheduleMonth = schedule.length > 0 ? schedule[schedule.length - 1].monthCode : loan.startMonth;
  const skippedCount = schedule.filter(s => s.isSkipped).length;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isAdv ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'}`}>
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-black dark:text-white">
                  {loan.number} — {loan.employeeName}
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[loan.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {loan.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {loan.employeeCode} · {loan.department || 'General'} · Journal: <span className="font-mono font-medium text-black dark:text-white">{loan.journalNumber || '—'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-meta-4 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20">
              <span className="text-[11px] text-gray-400 block font-medium">Total Sanctioned</span>
              <span className="text-sm font-bold font-mono text-black dark:text-white mt-0.5 block">
                Rs. {money(totalAmt)}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20">
              <span className="text-[11px] text-teal-700 dark:text-teal-400 block font-medium">Total Recovered (Cut)</span>
              <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5 block">
                Rs. {money(recoveredAmt)}
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${balanceAmt > 0 ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20' : 'border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20'}`}>
              <span className={`text-[11px] font-medium block ${balanceAmt > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400'}`}>
                Remaining Balance
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${balanceAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-black dark:text-white'}`}>
                Rs. {money(balanceAmt)}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20">
              <span className="text-[11px] text-gray-400 block font-medium">
                {isAdv ? 'Recovery Type' : 'Monthly Installment'}
              </span>
              <span className="text-sm font-bold font-mono text-black dark:text-white mt-0.5 block">
                {isAdv ? 'Lump Sum (100%)' : `Rs. ${money(perMonthAmt)} / mo`}
              </span>
            </div>
          </div>

          {/* Sanction & Payout Details */}
          <div className="p-3.5 rounded-lg border border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/10 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <span className="text-gray-400">Sanctioned Date: </span>
                <span className="font-semibold text-black dark:text-white font-mono">{loan.sanctionedOn}</span>
              </div>
              <div>
                <span className="text-gray-400">Recovery Period: </span>
                <span className="font-semibold text-black dark:text-white font-mono">
                  {monthNamed(loan.startMonth)} {lastScheduleMonth !== loan.startMonth ? `→ ${monthNamed(lastScheduleMonth)} (${totalInstallments} mo${skippedCount > 0 ? ` + ${skippedCount} grace` : ''})` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Paid Out Of: </span>
                <span className="font-semibold text-black dark:text-white">
                  {loan.paidOutOf === 'Split' ? (
                    <span className="text-amber-700 dark:text-amber-400">
                      💳 Split (Cash: Rs. {money(loan.cashAmount || 0)} · Bank: Rs. {money(loan.bankAmount || 0)})
                    </span>
                  ) : (loan.paidOutOf === 'Bank' || loan.bankName || loan.bankId) ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      🏦 {loan.bankName || 'Bank'} {loan.chequeNo ? `(Ref: ${loan.chequeNo})` : ''}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      💵 {loan.accountName || 'Cash in Hand (Cash Box)'}
                    </span>
                  )}
                </span>
              </div>
            </div>
            {(loan.purpose || loan.remarks) && (
              <div className="pt-2 border-t border-stroke/70 dark:border-strokedark/70 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">
                {loan.purpose && <div><span className="font-medium text-black dark:text-white">Purpose:</span> {loan.purpose}</div>}
                {loan.remarks && <div><span className="font-medium text-black dark:text-white">Remarks:</span> {loan.remarks}</div>}
              </div>
            )}
          </div>

          {/* Month-Wise Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white mb-2.5 flex items-center justify-between">
              <span>📅 Month-Wise Repayment & Salary Deduction Ledger</span>
              <span className="text-[11px] font-normal text-gray-400">
                {loan.installmentsPaid || 0} of {totalInstallments} installments recovered {skippedCount > 0 ? `(${skippedCount} skipped)` : ''}
              </span>
            </h4>

            <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
              <table className="w-full table-auto text-left text-xs">
                <thead className="bg-gray-100 dark:bg-meta-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-12">#</th>
                    <th className="py-2.5 px-3 font-semibold">Salary Month</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Expected Cut</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actual Recovered</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Balance After</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark text-black dark:text-white font-mono">
                  {schedule.map(item => (
                    <tr key={item.index} className={`hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors ${item.isSkipped ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''}`}>
                      <td className="py-2.5 px-3 text-center text-gray-400">{item.index}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-black dark:text-white">
                        {item.monthName} <span className="text-[10px] text-gray-400 font-mono">({item.monthCode})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.isSkipped ? <span className="text-gray-400 font-sans italic">Rs. 0 (Skipped)</span> : `Rs. ${money(item.expected)}`}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${item.actualPaid > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`}>
                        Rs. {money(item.actualPaid)}
                      </td>
                      <td className={`py-2.5 px-3 text-right ${item.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                        Rs. {money(item.remainingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {item.isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                            ⏸️ Grace Month
                          </span>
                        ) : item.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                            ✓ Deducted
                          </span>
                        ) : item.isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                            ⚠️ Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-meta-4 dark:text-gray-300 text-[10px] font-medium">
                            ⏳ Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const TABS = ['Advance', 'Loan'];

export const LoansPage: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const hub = useHub(() => getLoans(tenantSlug, branchId), [tenantSlug, branchId]);
  const [tab, setTab] = useState<'Advance' | 'Loan'>('Advance');
  const [search, setSearch] = useState('');
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortState | null>({ key: 'sanctionedOn', dir: 'desc' });
  const [draft, setDraft] = useState<Partial<EmployeeLoan> | null>(null);
  const [viewRecord, setViewRecord] = useState<EmployeeLoan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const editable = can('hr-loans:edit');
  const rows = hub.value?.data ?? [];
  const months = hub.value?.months ?? [];

  const inWindow = useMemo(() => rows.filter(l =>
    (!fromDate || l.sanctionedOn >= fromDate) && (!toDate || l.sanctionedOn <= toDate) &&
    (!search.trim() || `${l.number} ${l.employeeName} ${l.employeeCode} ${l.purpose} ${l.kind}`
      .toLowerCase().includes(search.trim().toLowerCase()))),
  [rows, fromDate, toDate, search]);

  const inTab = useMemo(() => {
    if (tab === 'Advance') return inWindow.filter(l => (l.kind || '').toLowerCase().includes('adv'));
    return inWindow.filter(l => (l.kind || '').toLowerCase().includes('loan'));
  }, [inWindow, tab]);

  const visible = useMemo(() => {
    const list = status ? inTab.filter(l => l.status === status) : inTab;
    if (!sort) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a: any, b: any) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [inTab, status, sort]);

  const onSort = (k: string) => setSort(s => (s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));

  const shown = useMemo(() => ({
    amount: visible.reduce((s, l) => s + l.amount, 0),
    recovered: visible.reduce((s, l) => s + l.deducted, 0),
    balance: visible.reduce((s, l) => s + l.balance, 0)
  }), [visible]);
  const holders = new Set(visible.filter(l => l.balance > 0).map(l => l.employeeId)).size;

  const stats: RegisterStat[] = [
    {
      label: 'Records',
      value: status ? `${visible.length} of ${inTab.length}` : String(inTab.length),
      title: `${tab} matching active search filters`
    },
    { label: 'Sanctioned', value: `Rs. ${money(shown.amount)}`, title: `Total ${tab.toLowerCase()} amount sanctioned` },
    { label: 'Recovered', value: `Rs. ${money(shown.recovered)}`, tone: 'ok', title: 'Total recovered from payroll' },
    {
      label: 'Outstanding',
      value: `Rs. ${money(shown.balance)}`,
      tone: shown.balance ? 'warn' : undefined,
      title: `${holders} employee(s) hold outstanding ${tab.toLowerCase()} balance`
    }
  ];

  const statusCounts = [
    { value: '', label: 'All', count: inTab.length },
    ...(hub.value?.statuses ?? []).map(s => ({ value: s, label: s, count: inTab.filter(l => l.status === s).length }))
  ];

  const activeFilters = [
    search && `search “${search}”`,
    status && `status ${status}`,
    (fromDate || toDate) && `sanctioned ${fromDate || 'the beginning'} → ${toDate || 'today'}`
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setStatus('');
    setFromDate('');
    setToDate('');
    if (search) { setSearch(''); setSearchEpoch(n => n + 1); }
  };

  const isAdvance = draft?.kind === 'Advance';
  const selectedEmp = useMemo(() => {
    return (hub.value?.employees ?? []).find(e => e.id === draft?.employeeId);
  }, [hub.value?.employees, draft?.employeeId]);

  const empSalary = Number(selectedEmp?.gross || selectedEmp?.basicSalary || selectedEmp?.net || 0);
  const maxAdvanceAllowed = empSalary > 0 ? Math.round(empSalary * 0.5) : 0;
  const isNegativeAmount = draft?.amount !== undefined && draft?.amount !== null && Number(draft.amount) < 0;
  const isOverAdvanceLimit = isAdvance && empSalary > 0 && Number(draft?.amount || 0) > maxAdvanceAllowed;

  const minMonthsForLoan = useMemo(() => {
    const amt = Number(draft?.amount || 0);
    if (!isAdvance && amt > 0 && empSalary > 0) {
      return Math.max(1, Math.ceil(amt / empSalary));
    }
    return 1;
  }, [isAdvance, draft?.amount, empSalary]);

  const isUnderMinMonths = !isAdvance && empSalary > 0 && Number(draft?.amount || 0) > 0 && Number(draft?.installments || 0) > 0 && Number(draft?.installments || 0) < minMonthsForLoan;

  const currentMonthCode = draft?.sanctionedOn ? draft.sanctionedOn.slice(0, 7) : (months[0] ?? isoDay().slice(0, 7));
  const nextMonthCode = useMemo(() => {
    const mIndex = months.indexOf(currentMonthCode);
    if (mIndex >= 0 && mIndex + 1 < months.length) return months[mIndex + 1];
    const d = new Date(currentMonthCode + '-01');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  }, [currentMonthCode, months]);
  const isThisMonthRecovery = (draft?.startMonth || currentMonthCode) === currentMonthCode;

  const loanStartMonth = draft?.startMonth || currentMonthCode;
  const loanEndMonth = calcEndMonth(loanStartMonth, Number(draft?.installments || 1));

  const perMonth = draft && Number(draft.installments) > 0
    ? Math.round((Number(draft.amount) || 0) / Number(draft.installments)) : 0;

  const submit = async () => {
    if (!draft) return;
    if (!draft.employeeId) { setError('Choose the employee'); return; }
    if (!draft.id && !(Number(draft.amount) > 0)) { setError('Enter a valid sanctioned amount (greater than 0)'); return; }
    if (Number(draft.amount || 0) <= 0) { setError('Sanctioned amount must be greater than zero'); return; }
    if (isAdvance && empSalary > 0 && Number(draft.amount || 0) > maxAdvanceAllowed) {
      setError(`Advance amount (Rs. ${money(Number(draft.amount))}) cannot exceed the 50% limit of Rs. ${money(maxAdvanceAllowed)} (Monthly Salary: Rs. ${money(empSalary)}).`);
      return;
    }
    if (!isAdvance && empSalary > 0 && Number(draft.installments || 0) < minMonthsForLoan) {
      setError(`Loan recovery duration must be at least ${minMonthsForLoan} months for an employee with Rs. ${money(empSalary)} monthly salary.`);
      return;
    }
    if (!isAdvance && empSalary > 0 && (Number(draft.installmentAmount) || perMonth) > empSalary) {
      setError(`Monthly installment (Rs. ${money(Number(draft.installmentAmount) || perMonth)}) cannot exceed employee's monthly salary of Rs. ${money(empSalary)}. Minimum ${minMonthsForLoan} months required.`);
      return;
    }

    if (draft.paidOutOf === 'Split') {
      const totalAmt = Number(draft.amount || 0);
      const cashAmt = Number(draft.cashAmount || 0);
      const bankAmt = Number(draft.bankAmount || 0);
      if (cashAmt <= 0 && bankAmt <= 0) {
        setError('Please enter cash and bank amounts for the split payout.');
        return;
      }
      if (cashAmt + bankAmt !== totalAmt) {
        setError(`Split allocation total (Rs. ${money(cashAmt + bankAmt)}) must equal the total sanctioned amount (Rs. ${money(totalAmt)}).`);
        return;
      }
      if (!draft.accountId && cashAmt > 0) {
        setError('Please select a cash drawer for the cash portion.');
        return;
      }
      if (!draft.bankId && bankAmt > 0) {
        setError('Please select a bank account for the bank portion.');
        return;
      }
    }

    setSaving(true); setError(''); setNotice('');
    try {
      const payload: Partial<EmployeeLoan> = {
        ...draft,
        installments: isAdvance ? 1 : Math.max(1, Number(draft.installments) || 1),
        installmentAmount: isAdvance ? Number(draft.amount || 0) : (Number(draft.installmentAmount) || perMonth)
      };

      if (draft.id) {
        const out = await updateLoan(tenantSlug, branchId, draft.id, payload);
        setNotice(`${out.number} has been updated — Rs. ${money(out.balance)} still owed.`);
      } else {
        const created = await saveLoan(tenantSlug, branchId, payload);
        setNotice(`${created.number} — Rs. ${money(created.amount)} sanctioned to ${created.employeeName}.`);
      }
      hub.reload();
      setDraft(null);
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  };

  const remove = async (l: EmployeeLoan) => {
    setError(''); setNotice(''); setConfirmId(null);
    try {
      await deleteLoan(tenantSlug, branchId, l.id);
      setNotice(`${l.number} has been deleted and its issuing journal taken back.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  const setStatusOf = async (l: EmployeeLoan, next: EmployeeLoan['status']) => {
    setError(''); setNotice('');
    try {
      const out = await updateLoan(tenantSlug, branchId, l.id, { status: next });
      setNotice(`${out.number} is ${out.status.toLowerCase()}.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  const set = (patch: Partial<EmployeeLoan>) => setDraft(d => (d ? { ...d, ...patch } : d));

  return (
    <div className="space-y-6">
      {/* Header & Stats Card */}
      <div className="rounded-sm border border-stroke bg-white p-5 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              Loans &amp; Salary Advances
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage employee salary advances and multi-month loan sanctions, installment schedules, and payroll recoveries.
            </p>
          </div>
          <ListToolbar
            addLabel={tab === 'Advance' ? 'SANCTION ADVANCE' : 'SANCTION LOAN'}
            onAdd={() => {
              setDraft({
                ...blank(months),
                kind: tab === 'Advance' ? 'Advance' : 'Loan',
                installments: tab === 'Advance' ? 1 : 12
              });
              setError('');
              setNotice('');
            }}
          />
        </div>

        {/* Stats Strip */}
        <div className="pt-4 pb-1">
          <StatStrip stats={stats} />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3.5 pt-4 border-t border-stroke dark:border-strokedark">
          <SearchBox
            key={searchEpoch}
            placeholder={tab === 'Advance' ? 'Search advances by voucher #, staff, or purpose' : 'Search loans by voucher #, staff, or purpose'}
            onSearch={setSearch}
          />
          <StatusPills value={status} onChange={setStatus} counts={statusCounts} />
          <DateWindow from={fromDate} to={toDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />
        </div>
      </div>

      {/* Notifications */}
      {(error || hub.error || notice) && (
        <div className={`text-xs font-semibold rounded-md px-4 py-3 flex items-center justify-between shadow-sm ${
          error || hub.error ? 'text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300' : 'text-green-800 bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900 dark:text-green-300'}`}>
          <span>{error || hub.error || notice}</span>
          <button type="button" onClick={() => { setError(''); setNotice(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Sanction / Edit Loan Form */}
      {draft && (
        <div className="rounded-sm border border-stroke bg-white p-5 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-base font-bold text-black dark:text-white mb-5 pb-3 border-b border-stroke dark:border-strokedark">
            {draft.id ? `Edit ${draft.number} - ${draft.employeeName}` : 'Sanction a Loan or Advance'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* Employee Picker */}
            <Field label="Employee" required className="lg:col-span-2">
              <SearchPick
                options={(hub.value?.employees ?? []).map(e => ({ id: e.id, label: e.name, sub: e.code }))}
                valueId={draft.employeeId || null}
                valueLabel={draft.employeeName}
                onPick={o => {
                  const amt = Number(draft.amount || 0);
                  const inst = Number(draft.installments || 12);
                  const perM = !isAdvance && inst > 0 ? Math.round(amt / inst) : amt;
                  set({
                    employeeId: o?.id ?? 0,
                    employeeName: o?.label ?? '',
                    installmentAmount: isAdvance ? amt : perM
                  });
                }}
                placeholder="Search staff by name or code..." />
            </Field>

            {/* Kind (Advance / Loan) */}
            <Field label="Kind" required hint={isAdvance ? "Advance: 100% recovered from next salary" : "Loan: Recovered over monthly installments"}>
              <Pick value={draft.kind ?? 'Advance'} onChange={e => {
                const k = e.target.value;
                const isAdv = k === 'Advance';
                const amt = Number(draft.amount || 0);
                const inst = isAdv ? 1 : Number(draft.installments || 12);
                const perM = isAdv ? amt : (inst > 0 ? Math.round(amt / inst) : 0);
                set({
                  kind: k,
                  installments: inst,
                  installmentAmount: perM
                });
              }} disabled={!editable}>
                {(hub.value?.kinds ?? ['Advance', 'Loan']).map(k => <option key={k} value={k}>{k}</option>)}
              </Pick>
            </Field>

            {/* Employee Salary Overview Strip */}
            {selectedEmp && (
              <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-gray-400 block text-[11px] font-medium">Monthly Gross Salary</span>
                    <span className="font-bold font-mono text-black dark:text-white text-sm">
                      {empSalary > 0 ? `Rs. ${money(empSalary)}` : 'Not configured'}
                    </span>
                  </div>
                  {isAdvance && empSalary > 0 && (
                    <div className="border-l border-stroke dark:border-strokedark pl-4">
                      <span className="text-gray-400 block text-[11px] font-medium">Advance Policy Limit (50%)</span>
                      <span className="font-bold font-mono text-teal-600 dark:text-teal-400 text-sm">
                        Max Rs. {money(maxAdvanceAllowed)}
                      </span>
                    </div>
                  )}
                  {!isAdvance && empSalary > 0 && Number(draft.amount || 0) > 0 && (
                    <div className="border-l border-stroke dark:border-strokedark pl-4">
                      <span className="text-gray-400 block text-[11px] font-medium">Minimum Required Duration</span>
                      <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                        {minMonthsForLoan} Months (Max Rs. {money(empSalary)}/mo)
                      </span>
                    </div>
                  )}
                </div>

                {isAdvance && empSalary > 0 && !draft.id && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-400 text-[11px]">Quick Amount:</span>
                    <button
                      type="button"
                      onClick={() => set({ amount: Math.round(empSalary * 0.25), installmentAmount: Math.round(empSalary * 0.25) })}
                      className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-mono text-[11px] font-bold hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                    >
                      25% (Rs. {money(Math.round(empSalary * 0.25))})
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ amount: maxAdvanceAllowed, installmentAmount: maxAdvanceAllowed })}
                      className="px-2.5 py-1 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition shadow-2xs cursor-pointer"
                    >
                      50% Max (Rs. {money(maxAdvanceAllowed)})
                    </button>
                  </div>
                )}

                {!isAdvance && empSalary > 0 && !draft.id && Number(draft.amount || 0) > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-400 text-[11px]">Quick Duration:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = Number(draft.amount || 0);
                        set({ installments: minMonthsForLoan, installmentAmount: Math.round(amt / minMonthsForLoan) });
                      }}
                      className="px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                    >
                      Min ({minMonthsForLoan} mo · Rs. {money(Math.round((draft.amount || 0) / minMonthsForLoan))}/mo)
                    </button>
                    {minMonthsForLoan <= 12 && (
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(draft.amount || 0);
                          set({ installments: 12, installmentAmount: Math.round(amt / 12) });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-mono text-[11px] font-bold hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                      >
                        12 mo (Rs. {money(Math.round((draft.amount || 0) / 12))}/mo)
                      </button>
                    )}
                    {minMonthsForLoan <= 24 && (
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(draft.amount || 0);
                          set({ installments: 24, installmentAmount: Math.round(amt / 24) });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-mono text-[11px] font-bold hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                      >
                        24 mo (Rs. {money(Math.round((draft.amount || 0) / 24))}/mo)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sanctioned Date */}
            <Field label="Sanctioned On" required>
              <Text type="date" value={draft.sanctionedOn ?? ''} onChange={e => set({ sanctionedOn: e.target.value })} disabled={!editable} />
            </Field>

            {/* Amount */}
            <Field
              label="Sanctioned Amount (Rs.)"
              required
              error={isNegativeAmount ? 'Amount must be greater than zero' : isOverAdvanceLimit ? `Exceeds 50% salary limit (Rs. ${money(maxAdvanceAllowed)})` : undefined}
            >
              <Text
                type="number"
                min="1"
                max={isAdvance && empSalary > 0 ? maxAdvanceAllowed : undefined}
                value={draft.amount !== undefined && draft.amount !== null ? draft.amount : ''}
                placeholder={isAdvance && empSalary > 0 ? `Max Rs. ${money(maxAdvanceAllowed)}` : 'e.g. 50000'}
                onKeyDown={e => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    set({ amount: '' as any, installmentAmount: 0 });
                    return;
                  }
                  const amt = Math.max(0, Number(val) || 0);
                  const inst = Number(draft.installments || 12);
                  const perM = !isAdvance && inst > 0 ? Math.round(amt / inst) : amt;
                  set({
                    amount: amt,
                    installmentAmount: perM
                  });
                }}
                disabled={!editable || !!draft.id}
              />
            </Field>

            {/* If Loan: Show Installments & Monthly Amount */}
            {!isAdvance ? (
              <>
                <Field
                  label="Recovered Over (months)"
                  required
                  hint={!isUnderMinMonths && empSalary > 0 && minMonthsForLoan > 1 ? `Min ${minMonthsForLoan} months required` : 'Number of monthly installments'}
                  error={isUnderMinMonths ? `Minimum ${minMonthsForLoan} months required (Max Rs. ${money(empSalary)}/mo salary)` : undefined}
                >
                  <Text
                    type="number"
                    min="1"
                    value={draft.installments !== undefined && draft.installments !== null ? draft.installments : ''}
                    placeholder={String(minMonthsForLoan || 12)}
                    onKeyDown={e => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={e => {
                      const userVal = e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1);
                      const amt = Number(draft.amount || 0);
                      const valNum = Number(userVal) || 0;
                      set({
                        installments: userVal as any,
                        installmentAmount: valNum > 0 ? Math.round(amt / valNum) : 0
                      });
                    }}
                    disabled={!editable || !!draft.id}
                  />
                </Field>
                <Field
                  label="Monthly Installment (Rs.)"
                  hint={draft.id ? 'May not exceed outstanding balance.' : `Auto split: Rs. ${money(perMonth)} / mo`}
                  error={empSalary > 0 && (Number(draft.installmentAmount || perMonth) > empSalary) ? `Exceeds monthly salary (Rs. ${money(empSalary)})` : undefined}
                >
                  <Text
                    type="number"
                    min="0"
                    max={empSalary > 0 ? empSalary : undefined}
                    value={draft.installmentAmount || ''}
                    placeholder={String(perMonth)}
                    onKeyDown={e => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={e => set({ installmentAmount: Math.max(0, Number(e.target.value) || 0) })}
                    disabled={!editable}
                  />
                </Field>
              </>
            ) : (
              <div className="lg:col-span-2 flex items-center p-3.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 self-center mt-2">
                <p className="text-xs text-teal-800 dark:text-teal-300 font-medium">
                  <span className="font-bold">Lump Sum Salary Advance:</span> Full amount of <span className="font-bold font-mono">Rs. {money(draft.amount || 0)}</span> will be deducted once on the selected recovery month.
                </p>
              </div>
            )}

            {/* Recovery Starts Month */}
            <Field
              label="Recovery Month"
              required
              hint={!isAdvance
                ? `Repayment Schedule: ${monthNamed(loanStartMonth)} → ${monthNamed(loanEndMonth)} (${Number(draft.installments || 1)} months)`
                : 'The salary month advance is recovered in full'
              }
            >
              <Pick value={draft.startMonth ?? ''} onChange={e => set({ startMonth: e.target.value })} disabled={!editable}>
                {months.map(m => <option key={m} value={m}>{monthNamed(m)}</option>)}
              </Pick>
            </Field>

            {/* If Loan: Checkbox Option for Cut installment from this month's salary */}
            {!isAdvance && (
              <div className="lg:col-span-4 p-3 rounded-lg bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Check
                    checked={isThisMonthRecovery}
                    onChange={(checked: boolean) => {
                      set({ startMonth: checked ? currentMonthCode : nextMonthCode });
                    }}
                    label="Cut installment from this month's salary"
                    disabled={!editable}
                  />
                </div>
                <div className="text-xs font-medium">
                  {isThisMonthRecovery ? (
                    <span className="text-teal-700 dark:text-teal-400">
                      ✓ Starts in <strong>{monthNamed(currentMonthCode)}</strong> · Completes in <strong>{monthNamed(calcEndMonth(currentMonthCode, Number(draft.installments || 1)))}</strong> ({Number(draft.installments || 1)} installments)
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      ⏳ Starts in <strong>{monthNamed(loanStartMonth)}</strong> · Completes in <strong>{monthNamed(loanEndMonth)}</strong> ({Number(draft.installments || 1)} installments)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Paid Out Of (Mode) */}
            <Field label="Paid Out Of" required hint="Cash drawer, bank account, or split between both">
              <Pick
                value={draft.paidOutOf || (draft.bankId || draft.bankName ? 'Bank' : 'Cash')}
                onChange={e => {
                  const mode = e.target.value as 'Cash' | 'Bank' | 'Split';
                  const defaultBank = (hub.value?.banks ?? [])[0];
                  const defaultCash = (hub.value?.cashAccounts ?? [])[0];
                  const totalAmt = Number(draft.amount || 0);

                  if (mode === 'Split') {
                    const halfCash = Math.floor(totalAmt / 2);
                    const halfBank = totalAmt - halfCash;
                    set({
                      paidOutOf: 'Split',
                      accountId: draft.accountId ?? (defaultCash?.id || null),
                      accountName: defaultCash ? `${defaultCash.account_code ? `${defaultCash.account_code} - ` : ''}${defaultCash.account_title}` : 'Cash in Hand',
                      cashAmount: draft.cashAmount !== undefined && draft.cashAmount > 0 ? draft.cashAmount : halfCash,
                      bankId: draft.bankId ?? (defaultBank?.id || null),
                      bankName: defaultBank?.bankName || '',
                      bankAmount: draft.bankAmount !== undefined && draft.bankAmount > 0 ? draft.bankAmount : halfBank
                    });
                  } else if (mode === 'Bank') {
                    set({
                      paidOutOf: 'Bank',
                      bankId: defaultBank?.id || null,
                      bankName: defaultBank?.bankName || '',
                      bankAmount: totalAmt,
                      cashAmount: 0,
                      accountId: null,
                      accountName: defaultBank ? `${defaultBank.bankName} (${defaultBank.accountNumber || defaultBank.accountTitle || ''})` : 'Bank'
                    });
                  } else {
                    set({
                      paidOutOf: 'Cash',
                      bankId: null,
                      bankName: '',
                      bankAmount: 0,
                      cashAmount: totalAmt,
                      accountId: defaultCash?.id || null,
                      accountName: defaultCash ? `${defaultCash.account_code ? `${defaultCash.account_code} - ` : ''}${defaultCash.account_title}` : 'Cash in Hand'
                    });
                  }
                }}
                disabled={!editable}
              >
                <option value="Cash">💵 Cash in Hand</option>
                <option value="Bank">🏦 Bank Account / Transfer</option>
                <option value="Split">💳 Split (Cash + Bank)</option>
              </Pick>
            </Field>

            {/* If Single Cash: Show Cash Drawer Selector */}
            {(!draft.paidOutOf || draft.paidOutOf === 'Cash') && !draft.bankId && !draft.bankName && (
              <Field label="Select Cash Drawer" required className="lg:col-span-2" hint="Cash drawer ledger to debit/credit">
                <Pick
                  value={String(draft.accountId ?? ((hub.value?.cashAccounts ?? [])[0]?.id || ''))}
                  onChange={e => {
                    const cId = Number(e.target.value);
                    const c = (hub.value?.cashAccounts ?? []).find(x => x.id === cId);
                    set({
                      accountId: cId || null,
                      accountName: c ? `${c.account_code ? `${c.account_code} - ` : ''}${c.account_title}` : 'Cash in Hand'
                    });
                  }}
                  disabled={!editable}
                >
                  {(hub.value?.cashAccounts ?? []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.account_code ? `${c.account_code} — ` : ''}{c.account_title}
                    </option>
                  ))}
                </Pick>
              </Field>
            )}

            {/* If Single Bank: Show Bank Account Selector & Cheque Ref */}
            {draft.paidOutOf === 'Bank' && (
              <>
                <Field label="Select Bank Account" required className="lg:col-span-2">
                  <Pick
                    value={String(draft.bankId ?? ((hub.value?.banks ?? [])[0]?.id || ''))}
                    onChange={e => {
                      const bId = Number(e.target.value);
                      const b = (hub.value?.banks ?? []).find(x => x.id === bId);
                      set({
                        bankId: bId || null,
                        bankName: b?.bankName || '',
                        accountName: b ? `${b.bankName} (${b.accountNumber || b.accountTitle})` : 'Bank'
                      });
                    }}
                    disabled={!editable}
                  >
                    {(hub.value?.banks ?? []).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} — {b.accountNumber ? `${b.accountNumber} (${b.accountTitle || ''})` : b.accountTitle}
                      </option>
                    ))}
                  </Pick>
                </Field>

                <Field label="Cheque / Transaction Ref #" hint="Optional transaction or cheque #">
                  <Text
                    value={draft.chequeNo ?? ''}
                    onChange={e => set({ chequeNo: e.target.value })}
                    placeholder="e.g. CHQ-99120 or TXN-5541"
                    disabled={!editable}
                  />
                </Field>
              </>
            )}

            {/* If Split: Render Cash + Bank Breakdown Panel */}
            {draft.paidOutOf === 'Split' && (() => {
              const totalAmt = Number(draft.amount || 0);
              const cashAmt = Number(draft.cashAmount || 0);
              const bankAmt = Number(draft.bankAmount || 0);
              const sum = cashAmt + bankAmt;
              const diff = totalAmt - sum;
              const isMatch = totalAmt > 0 && diff === 0;

              return (
                <div className="lg:col-span-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/70 dark:border-amber-800/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        💳 Split Disbursement Breakdown (Cash + Bank)
                      </span>
                      {isMatch ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                          ✓ Balanced: Rs. {money(totalAmt)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                          ⚠️ {diff > 0 ? `Rs. ${money(diff)} Remaining to Allocate` : `Rs. ${money(Math.abs(diff))} Over Allocated`}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const halfCash = Math.floor(totalAmt / 2);
                        const halfBank = totalAmt - halfCash;
                        set({ cashAmount: halfCash, bankAmount: halfBank });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>⚡ Split 50 / 50</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cash Portion */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                          💵 Cash Portion
                        </span>
                        <span className="text-xs font-mono font-bold text-black dark:text-white">
                          Rs. {money(draft.cashAmount || 0)}
                        </span>
                      </div>

                      <Field label="Cash Amount (Rs.)" required>
                        <Text
                          type="number"
                          min="0"
                          value={draft.cashAmount !== undefined && draft.cashAmount !== null ? draft.cashAmount : ''}
                          placeholder="e.g. 10000"
                          onChange={e => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            set({ cashAmount: val });
                          }}
                          disabled={!editable}
                        />
                      </Field>

                      <Field label="Select Cash Drawer" required>
                        <Pick
                          value={String(draft.accountId ?? ((hub.value?.cashAccounts ?? [])[0]?.id || ''))}
                          onChange={e => {
                            const cId = Number(e.target.value);
                            const c = (hub.value?.cashAccounts ?? []).find(x => x.id === cId);
                            set({
                              accountId: cId || null,
                              accountName: c ? `${c.account_code ? `${c.account_code} - ` : ''}${c.account_title}` : 'Cash in Hand'
                            });
                          }}
                          disabled={!editable}
                        >
                          {(hub.value?.cashAccounts ?? []).map(c => (
                            <option key={c.id} value={c.id}>
                              {c.account_code ? `${c.account_code} — ` : ''}{c.account_title}
                            </option>
                          ))}
                        </Pick>
                      </Field>
                    </div>

                    {/* Bank Portion */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                          🏦 Bank Portion
                        </span>
                        <span className="text-xs font-mono font-bold text-black dark:text-white">
                          Rs. {money(draft.bankAmount || 0)}
                        </span>
                      </div>

                      <Field label="Bank Amount (Rs.)" required>
                        <Text
                          type="number"
                          min="0"
                          value={draft.bankAmount !== undefined && draft.bankAmount !== null ? draft.bankAmount : ''}
                          placeholder="e.g. 10000"
                          onChange={e => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            set({ bankAmount: val });
                          }}
                          disabled={!editable}
                        />
                      </Field>

                      <Field label="Select Bank Account" required>
                        <Pick
                          value={String(draft.bankId ?? ((hub.value?.banks ?? [])[0]?.id || ''))}
                          onChange={e => {
                            const bId = Number(e.target.value);
                            const b = (hub.value?.banks ?? []).find(x => x.id === bId);
                            set({
                              bankId: bId || null,
                              bankName: b?.bankName || '',
                              accountName: b ? `${b.bankName} (${b.accountNumber || b.accountTitle})` : 'Bank'
                            });
                          }}
                          disabled={!editable}
                        >
                          {(hub.value?.banks ?? []).map(b => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} — {b.accountNumber ? `${b.accountNumber} (${b.accountTitle || ''})` : b.accountTitle}
                            </option>
                          ))}
                        </Pick>
                      </Field>

                      <Field label="Cheque / Transaction Ref #" hint="Optional transaction or cheque #">
                        <Text
                          value={draft.chequeNo ?? ''}
                          onChange={e => set({ chequeNo: e.target.value })}
                          placeholder="e.g. CHQ-99120 or TXN-5541"
                          disabled={!editable}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Purpose */}
            <Field label="Purpose" className="lg:col-span-4">
              <Text value={draft.purpose ?? ''} onChange={e => set({ purpose: e.target.value })} placeholder="e.g. Medical, emergency, festival advance" disabled={!editable} />
            </Field>

            {/* Remarks */}
            <Field label="Remarks" className="lg:col-span-4">
              <Area rows={2} value={draft.remarks ?? ''} onChange={e => set({ remarks: e.target.value })} disabled={!editable} />
            </Field>

            {!!draft.id && draft.status !== 'Cancelled' && (
              <div className="flex items-center gap-4 lg:col-span-4 pt-2">
                <Check checked={draft.status === 'Active'} onChange={v => set({ status: v ? 'Active' : 'Closed' })}
                  label="Still being recovered" disabled={!editable || (draft.balance ?? 0) <= 0} />
                <span className="text-xs text-gray-500 font-mono">
                  {money(draft.deducted ?? 0)} recovered · {money(draft.balance ?? 0)} remaining ·
                  {' '}{draft.left ?? 0} installment(s) left
                </span>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
            <FormFooter onSave={submit} onClose={() => setDraft(null)} saving={saving} disabled={!editable}
              saveLabel={draft.id ? 'SAVE' : 'SANCTION AND POST'} />
          </div>
        </div>
      )}

      {/* Main Records Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {/* Tab Navigation (Below Sanction a Loan/Advance Form, Directly Above List Table) */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stroke dark:border-strokedark">
          <TabStrip
            tabs={TABS}
            active={tab}
            onChange={(t: string) => {
              setTab(t as 'Advance' | 'Loan');
              setError('');
              setNotice('');
            }}
          />
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-left text-sm text-black dark:text-white">
            <thead className="sticky top-0 z-10 bg-gray-2 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
              <tr>
                <SortHeader label="Voucher #" sortKey="number" sort={sort} onSort={onSort} />
                <SortHeader label="Employee" sortKey="employeeName" sort={sort} onSort={onSort} />
                <SortHeader label="Kind" sortKey="kind" sort={sort} onSort={onSort} />
                <SortHeader label="Sanctioned On" sortKey="sanctionedOn" sort={sort} onSort={onSort} />
                <SortHeader label="Amount" sortKey="amount" sort={sort} onSort={onSort} />
                <SortHeader label="Installment" sortKey="installmentAmount" sort={sort} onSort={onSort} />
                <th className="py-3 px-4 font-semibold text-black dark:text-white">Recovery</th>
                <SortHeader label="Recovered" sortKey="deducted" sort={sort} onSort={onSort} />
                <SortHeader label="Balance" sortKey="balance" sort={sort} onSort={onSort} />
                <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
                <th className="py-3 px-4 font-semibold text-black dark:text-white">Journal</th>
                <th className="py-3 px-4 font-semibold text-right text-black dark:text-white w-36">Action</th>
              </tr>
            </thead>
            <tbody>
              {hub.loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-stroke dark:border-strokedark">
                  <td colSpan={12} className="p-4">
                    <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" style={{ width: `${100 - i * 8}%` }} />
                  </td>
                </tr>
              ))}
              {!hub.loading && !visible.length && (
                <TableEmpty colSpan={12} noun="loan and advance records" filters={activeFilters} cleared={clearAll}
                  addLabel={rows.length ? undefined : 'SANCTION LOAN / ADVANCE'}
                  onAdd={() => { setDraft(blank(months)); setError(''); setNotice(''); }} />
              )}
              {!hub.loading && visible.map(l => (
                <tr key={l.id} className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium">{l.number}</td>
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-black dark:text-white">{l.employeeName}</span>
                    <span className="block text-[11px] text-gray-400">{l.employeeCode} · {l.department || '—'}</span>
                    {l.purpose && <span className="block text-[11px] text-gray-400 italic">{l.purpose}</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${l.kind === 'Advance' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'}`}>
                      {l.kind}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">{l.sanctionedOn}</td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className="font-semibold text-black dark:text-white block">{money(l.amount)}</span>
                    {l.paidOutOf === 'Split' ? (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-sans font-semibold">
                        💳 Split (C: {money(l.cashAmount || 0)} + B: {money(l.bankAmount || 0)})
                      </span>
                    ) : (l.paidOutOf === 'Bank' || l.bankName || l.bankId) ? (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-sans">
                        🏦 Bank
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">
                        💵 Cash
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className="font-semibold text-black dark:text-white">{money(l.installmentAmount)}</span>
                    <span className="block text-[10px] text-gray-400">from {l.startMonth}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((l.installmentsPaid / Math.max(1, l.installments)) * 100))}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block">
                      {l.installmentsPaid} of {l.installments} mo ({l.startMonth} → {calcEndMonth(l.startMonth, l.installments)})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-600 dark:text-teal-400">{money(l.deducted)}</td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold ${l.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{money(l.balance)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${STATUS_TONE[l.status] ?? 'bg-gray-100 text-gray-500'}`}>{l.status}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">{l.journalNumber || <span className="text-gray-300">-</span>}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <IconAction
                        title={`View ${l.kind} statement & monthly schedule`}
                        tone="default"
                        onClick={() => setViewRecord(l)}
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </IconAction>
                      <IconAction title="Edit this record" tone="primary" disabled={!editable}
                        onClick={() => { setDraft({ ...l }); setError(''); setNotice(''); }}><Pencil className="w-4 h-4" /></IconAction>
                      {l.status === 'Active' && l.deducted === 0 && editable && (
                        <button type="button" onClick={() => setStatusOf(l, 'Cancelled')} title="Cancel and reverse issuing journal"
                          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
                          Cancel
                        </button>
                      )}
                      {confirmId === l.id ? (
                        <DeleteConfirm onConfirm={() => remove(l)} onCancel={() => setConfirmId(null)}
                          confirmLabel="Delete" keepLabel={`Keep ${l.number}`} />
                      ) : (
                        <IconAction title={l.deducted > 0 ? 'Has recoveries booked — cancel it instead' : 'Delete record'}
                          tone="danger" disabled={!editable || l.deducted > 0} onClick={() => setConfirmId(l.id)}><Trash2 className="w-4 h-4" /></IconAction>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {!!visible.length && !hub.loading && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-meta-4/40 font-bold border-t border-stroke dark:border-strokedark">
                  <td colSpan={4} className="py-3 px-4 text-black dark:text-white">Total ({visible.length})</td>
                  <td className="py-3 px-4 text-right tabular-nums text-black dark:text-white font-mono">{money(shown.amount)}</td>
                  <td colSpan={2} className="py-3 px-4 text-xs text-gray-400">
                    {holders ? `${holders} staff member(s) hold balance` : 'All cleared'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-teal-600 dark:text-teal-400 font-mono">{money(shown.recovered)}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-amber-600 dark:text-amber-400 font-mono">{money(shown.balance)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Month-Wise Breakdown & Statement Modal */}
      <LoanDetailsModal
        loan={viewRecord}
        onClose={() => setViewRecord(null)}
      />
    </div>
  );
};

export default LoansPage;
