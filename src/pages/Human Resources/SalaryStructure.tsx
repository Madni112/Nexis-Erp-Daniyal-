import React, { useMemo, useState } from 'react';
import { BadgeCheck, RotateCcw, Save, Sliders, Trash2, X } from 'lucide-react';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import {
  getStructure, getStructures, resetStructure, SalaryStructureView, saveStructure,
  StructureLine
} from '../../services/hr.service';
import {
  Area, ExportPair, Field, IconAction, NumCell, Pick, RegisterStat, SearchBox,
  SortHeader, SortState, StatStrip, StatusPills, TableEmpty, Text
} from '../Masters/masterUi';
import { useHub } from '../Setup/useHub';
import { ExportColumn, footerRow } from '../../utils/exportTable';

const money = (n: number) => Math.round(Number(n || 0)).toLocaleString();
const rd = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// A percentage head is only ever agreed as a rate — the money falls out of the basic pay
// it sits on, so changing the basic has to re-cut every rate line on the scheme.
const amountOf = (line: StructureLine, basic: number) => {
  if (line.basis === 'Basic %') return rd(basic * line.rate / 100);
  if (line.basis === 'Gross %') return rd(basic * line.rate / 100);
  return rd(line.amount);
};

interface Edit {
  employeeId: number;
  code: string;
  name: string;
  department: string;
  designation: string;
  grade: string;
  basic: number;
  revisedOn: string;
  notes: string;
  lines: StructureLine[];
  history?: SalaryStructureView['history'];
}

export const SalaryStructurePage: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const hub = useHub(() => getStructures(tenantSlug, branchId), [tenantSlug, branchId]);
  const [search, setSearch] = useState('');
  // SearchBox keeps its own text; remounting it is how the clear-all empties the box too.
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [agreed, setAgreed] = useState('');
  const [sort, setSort] = useState<SortState | null>({ key: 'code', dir: 'asc' });
  const [edit, setEdit] = useState<Edit | null>(null);
  const [headToAdd, setHeadToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const rows = hub.value?.data ?? [];
  const editable = can('hr-salary-structure:edit');
  const heads = hub.value?.heads ?? [];

  // Everything but the scheme pill: a pill writes its own count, so that count is taken
  // over the rows the search still leaves standing.
  const scoped = useMemo(() => rows.filter(s => !search.trim() ||
    `${s.code} ${s.name} ${s.department} ${s.designation} ${s.grade}`.toLowerCase().includes(search.trim().toLowerCase())),
  [rows, search]);

  const visible = useMemo(() => {
    const list = agreed ? scoped.filter(s => (agreed === 'agreed') === s.saved) : scoped;
    if (!sort) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a: any, b: any) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [scoped, agreed, sort]);

  const onSort = (k: string) => setSort(s => (s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));

  // One set of figures: the chips, the line under the table and the footers of the printed
  // sheet and the workbook all add up these same rows.
  const shown = useMemo(() => ({
    basic: visible.reduce((s, r) => s + r.basic, 0),
    gross: visible.reduce((s, r) => s + r.gross, 0),
    ded: visible.reduce((s, r) => s + r.deductions, 0),
    net: visible.reduce((s, r) => s + r.net, 0)
  }), [visible]);

  const standardCount = visible.filter(s => !s.saved).length;

  const stats: RegisterStat[] = [
    {
      label: 'Schemes',
      value: agreed ? `${visible.length} of ${scoped.length}` : String(scoped.length),
      title: 'Employees the search and the scheme pill leave on screen. Every employee has a scheme: their own, or the standard one'
    },
    { label: 'Gross', value: money(shown.gross), title: `Basic plus the bonus & allowances of every row below, per month. ${standardCount} of them${standardCount === 1 ? ' is' : 's are'} still on the standard scheme` },
    { label: 'Deducted', value: money(shown.ded), tone: shown.ded ? 'warn' : undefined, title: 'Withheld from gross pay across the rows listed — fund, tax and recovery heads' },
    { label: 'Net payable', value: money(shown.net), tone: 'ok', title: 'Gross less deductions, the same figure the Net column and the sheet add up to' }
  ];

  const agreedCounts = [
    { value: '', label: 'All', count: scoped.length },
    { value: 'agreed', label: 'Agreed', count: scoped.filter(s => s.saved).length },
    { value: 'standard', label: 'Standard', count: scoped.filter(s => !s.saved).length }
  ];

  const activeFilters = [
    search && `search “${search}”`,
    agreed && `scheme ${agreed}`
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setAgreed('');
    if (search) { setSearch(''); setSearchEpoch(n => n + 1); }
  };

  const columns: ExportColumn<SalaryStructureView>[] = [
    { label: 'Employee #', value: s => s.code },
    { label: 'Name', value: s => s.name },
    { label: 'Department', value: s => s.department },
    { label: 'Designation', value: s => s.designation },
    { label: 'Grade', value: s => s.grade || '-' },
    { label: 'Basic', value: s => money(s.basic), align: 'right' },
    { label: 'Gross', value: s => money(s.gross), align: 'right' },
    { label: 'Deductions', value: s => money(s.deductions), align: 'right' },
    { label: 'Net', value: s => money(s.net), align: 'right' },
    { label: 'Scheme', value: s => s.saved ? 'Agreed' : 'Standard' },
    { label: 'Revised On', value: s => s.saved ? s.revisedOn : '-' },
    { label: 'Status', value: s => s.isActive ? 'Active' : 'Closed' }
  ];

  const totalsOf = (e: Edit) => {
    const lines = e.lines.map(l => ({ ...l, amount: amountOf(l, e.basic) }));
    const gross = rd(lines.filter(l => l.kind === 'Earning').reduce((s, l) => s + l.amount, e.basic));
    const ded = rd(lines.filter(l => l.kind === 'Deduction').reduce((s, l) => s + l.amount, 0));
    return { gross, ded, net: rd(gross - ded) };
  };

  const open = async (s: SalaryStructureView) => {
    setError(''); setNotice(''); setHeadToAdd('');
    setEdit({
      employeeId: s.employeeId, code: s.code, name: s.name, department: s.department,
      designation: s.designation, grade: s.grade, basic: s.basic, revisedOn: s.revisedOn,
      notes: s.notes, lines: s.lines.map(l => ({ ...l }))
    });
    try {
      const full = await getStructure(tenantSlug, branchId, s.employeeId);
      setEdit(e => (e && e.employeeId === s.employeeId
        ? { ...e, history: full.history, lines: full.lines.map(l => ({ ...l })) } : e));
    } catch (e) { setError((e as Error).message); }
  };

  const addHead = () => {
    const head = heads.find(h => String(h.id) === headToAdd);
    if (!head || !edit) return;
    if (edit.lines.some(l => l.headId === head.id)) { setError(`${head.name} is already on this scheme`); return; }
    const line: StructureLine = {
      headId: head.id, name: head.name, kind: head.kind, basis: head.basis,
      rate: head.rate, amount: head.amount, auto: head.auto
    };
    setEdit({ ...edit, lines: [...edit.lines, line] });
    setHeadToAdd('');
    setError('');
  };

  const setLine = (headId: number, patch: Partial<StructureLine>) =>
    setEdit(e => (e ? { ...e, lines: e.lines.map(l => (l.headId === headId ? { ...l, ...patch } : l)) } : e));

  const submit = async () => {
    if (!edit) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const body = {
        basic: edit.basic, revisedOn: edit.revisedOn, notes: edit.notes,
        lines: edit.lines.map(l => ({ ...l, amount: amountOf(l, edit.basic) }))
      };
      const saved = await saveStructure(tenantSlug, branchId, edit.employeeId, body);
      setNotice(`${saved.name}'s scheme is agreed at Rs. ${money(saved.gross)} gross / Rs. ${money(saved.net)} net.`);
      setEdit(null);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  };

  const reset = async (e: Edit) => {
    setError(''); setNotice('');
    try {
      const back = await resetStructure(tenantSlug, branchId, e.employeeId);
      setNotice(`${back.name} is on the standard scheme again.`);
      setEdit(null);
      hub.reload();
    } catch (err) { setError((err as Error).message); }
  };

  const totals = edit ? totalsOf(edit) : null;
  const earnings = edit?.lines.filter(l => l.kind === 'Earning') ?? [];
  const deductions = edit?.lines.filter(l => l.kind === 'Deduction') ?? [];

  const subtitle = activeFilters.length ? activeFilters.join(' · ') : 'Every scheme on the staff register';

  return (
    <div className="space-y-4">
      <div className="nb-card p-0 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3.5 pb-3.5">
          <div className="min-w-0">
            <h2 className="page-title">Salary Structures</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Each employee is paid on a scheme of their own: a basic figure plus the salary heads that ride on it.
              Whoever has no scheme of their own is paid on the standard one built from the active heads, and the
              moment you agree a figure here the payroll run starts using it. Open a row's scheme button to agree it.
            </p>
            <div className="mt-2"><StatStrip stats={stats} /></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100">
          <SearchBox key={searchEpoch} placeholder="Search by employee #, name, department, designation or grade" onSearch={setSearch} />
          <StatusPills value={agreed} onChange={setAgreed} counts={agreedCounts} />
          <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <ExportPair title="Salary Structures" subtitle={subtitle} filename="salary-structures"
              columns={columns} rows={visible} landscape
              footer={footerRow(columns.length, {
                0: `Total (${visible.length})`, 5: money(shown.basic), 6: money(shown.gross),
                7: money(shown.ded), 8: money(shown.net)
              })} />
          </span>
        </div>
      </div>

      {(error || hub.error || notice) && (
        <div className={`text-xs font-semibold rounded px-3 py-2 flex items-center justify-between ${
          error || hub.error ? 'text-red-600 bg-red-50 border border-red-100' : 'text-green-700 bg-green-50 border border-green-100'}`}>
          <span>{error || hub.error || notice}</span>
          <button type="button" onClick={() => { setError(''); setNotice(''); }}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

        {edit && totals && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="card-title">Salary Scheme - [{edit.code}] {edit.name}</h3>
              <span className="text-[11px] text-gray-500">
                {edit.department} · {edit.designation || '—'} · {edit.grade || 'ungraded'}
              </span>
            </div>
            {!editable && <p className="mb-2 text-[11px] font-semibold text-amber-600">You may view schemes but not change them.</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <Field label="Basic Pay" required>
                <NumCell value={edit.basic} onChange={e => setEdit({ ...edit, basic: Math.max(0, Number(e.target.value)) })} disabled={!editable} />
              </Field>
              <Field label="Agreed From" hint="The month from which this scheme takes effect.">
                <Text type="date" value={edit.revisedOn} onChange={e => setEdit({ ...edit, revisedOn: e.target.value })} disabled={!editable} />
              </Field>
              <Field label="Add a Head">
                <div className="flex items-center gap-1">
                  <Pick value={headToAdd} onChange={e => setHeadToAdd(e.target.value)} disabled={!editable}>
                    <option value="">Choose a salary head...</option>
                    {heads.filter(h => h.isActive).map(h => (
                      <option key={h.id} value={String(h.id)}>
                        {h.kind === 'Earning' ? '+' : '-'} {h.name} ({h.basis}{h.basis === 'Fixed' ? ` ${money(h.amount)}` : ` ${h.rate}%`})
                      </option>
                    ))}
                  </Pick>
                  <button type="button" onClick={addHead} disabled={!editable || !headToAdd} title="Put this head on the scheme"
                    className="h-[30px] w-8 shrink-0 rounded border border-teal-200 bg-teal-50 text-[#25a195] hover:bg-teal-100 disabled:opacity-40 flex items-center justify-center">
                    <Save className="w-3.5 h-3.5 rotate-0" />
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-3 gap-1 items-end">
                <div className="rounded bg-white border border-gray-200 px-2 py-1.5 text-center">
                  <span className="block text-[10px] uppercase text-gray-400">Gross</span>
                  <span className="block text-xs font-bold text-[#25a195]">{money(totals.gross)}</span>
                </div>
                <div className="rounded bg-white border border-gray-200 px-2 py-1.5 text-center">
                  <span className="block text-[10px] uppercase text-gray-400">Deduct</span>
                  <span className="block text-xs font-bold text-amber-600">{money(totals.ded)}</span>
                </div>
                <div className="rounded bg-[#2ec4b6]/10 border border-teal-200 px-2 py-1.5 text-center">
                  <span className="block text-[10px] uppercase text-gray-500">Net</span>
                  <span className="block text-xs font-bold text-gray-800">{money(totals.net)}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded bg-white">
              <table className="splendid-table">
                <thead>
                  <tr>
                    <th>Head</th>
                    <th>Type</th>
                    <th>Basis</th>
                    <th className="w-24">Rate %</th>
                    <th className="w-32">Amount</th>
                    <th className="w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(['Earning', 'Deduction'] as const).map(kind => (
                    <React.Fragment key={kind}>
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="text-[10px] font-bold uppercase text-gray-500">
                          {kind === 'Earning' ? `Bonus & Allowances — paid to the employee` : `Deductions — withheld from pay`}
                        </td>
                      </tr>
                      {(kind === 'Earning' ? earnings : deductions).map(l => (
                        <tr key={l.headId}>
                          <td className="font-medium">
                            {l.name}
                            {l.auto && <span className="ml-1.5 text-[10px] font-bold uppercase text-[#1e88e5] bg-blue-50 px-1.5 py-0.5 rounded">Auto</span>}
                          </td>
                          <td>{l.kind}</td>
                          <td>{l.basis}</td>
                          <td>
                            <NumCell value={l.basis === 'Fixed' ? 0 : l.rate} step="0.01" disabled={!editable || l.basis === 'Fixed' || l.auto}
                              onChange={e => setLine(l.headId, { rate: Number(e.target.value) })} />
                          </td>
                          <td>
                            <NumCell value={amountOf(l, edit.basic)} disabled={!editable || l.basis !== 'Fixed' || l.auto}
                              onChange={e => setLine(l.headId, { amount: Number(e.target.value) })} />
                          </td>
                          <td>
                            <IconAction title={`Take ${l.name} off this scheme`} tone="danger" disabled={!editable}
                              onClick={() => setEdit({ ...edit, lines: edit.lines.filter(x => x.headId !== l.headId) })}>
                              <Trash2 className="w-4 h-4" />
                            </IconAction>
                          </td>
                        </tr>
                      ))}
                      {(kind === 'Earning' ? earnings : deductions).length === 0 && (
                        <tr><td colSpan={6} className="text-center text-gray-300 py-3 text-[11px]">Nothing on this side yet</td></tr>
                      )}
                    </React.Fragment>
                  ))}
                  <tr className="bg-teal-50/40">
                    <td colSpan={3} className="text-right font-bold">Basic {money(edit.basic)}</td>
                    <td />
                    <td className="text-right font-bold">Net {money(totals.net)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
              <Field label="Notes on the Agreement">
                <Area rows={2} value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })}
                  placeholder="Anything the payroll desk should remember about this scheme." disabled={!editable} />
              </Field>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Scheme History</span>
                <ul className="text-[11px] text-gray-600 space-y-0.5">
                  {(edit.history ?? [{ date: edit.revisedOn, note: 'Not agreed yet — on the standard scheme', basic: edit.basic, gross: totals.gross }])
                    .map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <BadgeCheck className="w-3 h-3 text-[#25a195] shrink-0" />
                        <span className="font-medium w-20 shrink-0">{h.date}</span>
                        <span className="flex-1">{h.note}</span>
                        <span className="text-right">basic {money(h.basic)} · gross {money(h.gross)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEdit(null)} className="btn-splendid-warning"><X className="w-3.5 h-3.5" /> Close</button>
                <button type="button" onClick={() => reset(edit)} disabled={!editable || !edit.lines.length}
                  className="btn-splendid-outline" title="Drop the agreed scheme and fall back on the standard one">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Standard
                </button>
                <button type="button" onClick={submit} disabled={saving || !editable} className="btn-splendid-success disabled:opacity-50">
                  {saving ? 'Saving...' : 'AGREE SCHEME'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="nb-card p-0 overflow-hidden">
          <div className="overflow-auto max-h-[64vh] app-scroll">
          <table className="splendid-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <SortHeader label="Employee #" sortKey="code" sort={sort} onSort={onSort} />
                <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
                <SortHeader label="Department" sortKey="department" sort={sort} onSort={onSort} />
                <SortHeader label="Designation" sortKey="designation" sort={sort} onSort={onSort} />
                <SortHeader label="Grade" sortKey="grade" sort={sort} onSort={onSort} />
                <SortHeader label="Basic" sortKey="basic" sort={sort} onSort={onSort} />
                <SortHeader label="Gross" sortKey="gross" sort={sort} onSort={onSort} />
                <SortHeader label="Deductions" sortKey="deductions" sort={sort} onSort={onSort} />
                <SortHeader label="Net" sortKey="net" sort={sort} onSort={onSort} />
                <th>Heads</th>
                <SortHeader label="Scheme" sortKey="saved" sort={sort} onSort={onSort} />
                <th className="w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {hub.loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={12}>
                    <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${100 - i * 8}%` }} />
                  </td>
                </tr>
              ))}
              {!hub.loading && !visible.length && (
                <TableEmpty colSpan={12} noun="salary schemes" filters={activeFilters} cleared={clearAll} />
              )}
              {!hub.loading && visible.map(s => (
                <tr key={s.employeeId} className={edit?.employeeId === s.employeeId ? 'bg-blue-50/60' : ''}>
                  <td className="font-medium">{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.designation || <span className="text-gray-300">-</span>}</td>
                  <td>{s.grade || <span className="text-gray-300">-</span>}</td>
                  <td className="text-right">{money(s.basic)}</td>
                  <td className="text-right font-semibold">{money(s.gross)}</td>
                  <td className="text-right text-amber-600">{money(s.deductions)}</td>
                  <td className="text-right font-semibold text-[#25a195]">{money(s.net)}</td>
                  <td className="text-right">{s.lines.length}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      s.saved ? 'bg-teal-50 text-[#25a195]' : 'bg-gray-100 text-gray-500'}`}
                      title={s.saved ? `Agreed on ${s.revisedOn}` : 'Built from the active salary heads'}>
                      {s.saved ? 'Agreed' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    <IconAction title="Set the salary scheme" tone="primary" disabled={!editable} onClick={() => open(s)}>
                      <Sliders className="w-4 h-4" />
                    </IconAction>
                  </td>
                </tr>
              ))}
            </tbody>
            {!!visible.length && !hub.loading && (
              <tfoot>
                <tr className="bg-gray-50/80">
                  {/* The same figures the chips above write, and the sheet and the workbook close with. */}
                  <td colSpan={5} className="font-black text-gray-800">Total ({visible.length})</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{money(shown.basic)}</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{money(shown.gross)}</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{money(shown.ded)}</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{money(shown.net)}</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{visible.reduce((s, r) => s + r.lines.length, 0)}</td>
                  <td colSpan={2} className="text-[11px] text-gray-500">
                    Monthly, as the schemes below are agreed
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryStructurePage;
