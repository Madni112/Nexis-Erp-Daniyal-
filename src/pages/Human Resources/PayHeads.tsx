import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import {
  deletePayHead, getPayHeads, PayHead, PayHeadKind, savePayHead, updatePayHead
} from '../../services/hr.service';
import {
  Area, Check, DeleteConfirm, ExportPair, Field, FormFooter, IconAction, ListToolbar, NumCell, Pick,
  RegisterStat, SearchBox, SortHeader, SortState, StatStrip, StatusPills, TableEmpty, Text
} from '../Masters/masterUi';
import { useHub } from '../Setup/useHub';
import { ExportColumn, footerRow } from '../../utils/exportTable';

const money = (n: number) => Number(n || 0).toLocaleString();

const blank = (payKind: PayHeadKind, sequence: number): Partial<PayHead> => ({
  name: '', code: '', kind: payKind, basis: 'Fixed', rate: 0, amount: 0, accountId: null,
  auto: false, rule: '', taxable: false, sequence, isActive: true, description: ''
});

// A rate only means something when the head is cut as a slice of pay; a fixed head is
// simply the amount it says it is.
const BASIS_HINT: Record<string, string> = {
  Fixed: 'A flat amount every month.',
  'Basic %': "A share of the employee's basic pay.",
  'Gross %': 'A share of gross pay, calculated after the earnings above it.'
};

const RULES = [
  { value: '', label: 'No rule — normal head' },
  { value: 'PerfectAttendance', label: 'Only when attendance is perfect' },
  { value: 'LoanRecovery', label: 'Recovered from the loan register' },
  { value: 'AdvanceRecovery', label: 'Recovered from an advance' }
];

export const PayHeadsPage: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const hub = useHub(() => getPayHeads(tenantSlug, branchId), [tenantSlug, branchId]);
  const [kind, setKind] = useState('');
  const [liveness, setLiveness] = useState('');
  const [search, setSearch] = useState('');
  // SearchBox keeps its own text; remounting it is how the clear-all empties the box too.
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [sort, setSort] = useState<SortState | null>({ key: 'sequence', dir: 'asc' });
  const [draft, setDraft] = useState<Partial<PayHead> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const rows = hub.value?.data ?? [];
  const editable = can('hr-payheads:edit');

  // Everything but the earning/deduction pills. A pill writes its own count, so that count
  // is taken over the heads the search and the state still leave standing.
  const preKind = useMemo(() => rows.filter(h =>
    (!liveness || (liveness === 'active') === h.isActive) &&
    (!search.trim() || `${h.code} ${h.name} ${h.description} ${h.accountName}`
      .toLowerCase().includes(search.trim().toLowerCase()))),
  [rows, liveness, search]);

  const visible = useMemo(() => {
    const list = kind ? preKind.filter(h => h.kind === kind) : preKind;
    if (!sort) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a: any, b: any) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [preKind, kind, sort]);

  const onSort = (k: string) => setSort(s => (s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));

  // The Amount column prints a figure only for a flat head — a percentage head shows
  // "from rate" — so the headline adds the column exactly as it reads.
  const fixedMonthly = visible.filter(h => h.basis === 'Fixed').reduce((s, h) => s + h.amount, 0);
  const onSchemes = visible.reduce((s, h) => s + h.usedBy, 0);
  const onSheets = visible.reduce((s, h) => s + h.onSheets, 0);
  const stopped = visible.filter(h => !h.isActive).length;

  const stats: RegisterStat[] = [
    {
      label: 'Heads',
      value: kind ? `${visible.length} of ${preKind.length}` : String(preKind.length),
      title: 'Salary heads the search and the state leave on screen'
    },
    {
      label: 'Flat monthly',
      value: money(fixedMonthly),
      title: `The Amount column added up over the ${visible.filter(h => h.basis === 'Fixed').length} fixed head(s) listed. Percentage heads are cut from basic pay on each scheme, so they carry no amount of their own`
    },
    // Every employee reads as a scheme on the Salary Structure screen, but only an agreed one is
    // on the book — counting the standard defaults here would show a head as tied down when a
    // revision can still drop it.
    { label: 'On agreed schemes', value: onSchemes, title: 'Agreed schemes on the book carrying these heads. Employees still on the standard scheme are not counted, since it is derived from these heads and can be revised away' },
    { label: 'On sheets', value: onSheets, title: 'The Sheets column added up: a head counts once for every saved salary sheet that has already paid it out' },
    ...(stopped ? [{ label: 'Stopped', value: stopped, tone: 'warn' as const, title: 'Stopped heads stay on old schemes and sheets but no new scheme can take them' }] : [])
  ];

  const kindCounts = [
    { value: '', label: 'All', count: preKind.length },
    { value: 'Earning', label: 'Bonus & Allowances', count: preKind.filter(h => h.kind === 'Earning').length },
    { value: 'Deduction', label: 'Deductions', count: preKind.filter(h => h.kind === 'Deduction').length }
  ];

  const activeFilters = [
    search && `search “${search}”`,
    kind && `type ${kind === 'Earning' ? 'bonus' : 'deductions'}`,
    liveness && `state ${liveness}`
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setKind('');
    setLiveness('');
    if (search) { setSearch(''); setSearchEpoch(n => n + 1); }
  };

  const columns: ExportColumn<PayHead>[] = [
    { label: 'Code', value: h => h.code || '-' },
    { label: 'Salary Head', value: h => h.name },
    { label: 'Type', value: h => h.kind },
    { label: 'Basis', value: h => h.basis },
    { label: 'Rate %', value: h => h.basis === 'Fixed' ? '-' : String(h.rate), align: 'right' },
    { label: 'Amount', value: h => h.basis === 'Fixed' ? money(h.amount) : '-', align: 'right' },
    { label: 'Ledger Account', value: h => h.accountName || '-' },
    { label: 'Rule', value: h => h.rule || '-' },
    { label: 'Taxable', value: h => h.taxable ? 'Yes' : 'No' },
    { label: 'Order', value: h => String(h.sequence), align: 'right' },
    { label: 'On Agreed Schemes', value: h => String(h.usedBy), align: 'right' },
    { label: 'On Sheets', value: h => String(h.onSheets), align: 'right' },
    { label: 'Status', value: h => h.isActive ? 'Active' : 'Stopped' }
  ];

  const proposeCode = () => {
    const next = rows.reduce((max, h) => Math.max(max, Number(String(h.code).replace(/\D/g, '')) || 0), 0) + 1;
    setDraft(d => (d ? { ...d, code: `PH-${String(next).padStart(3, '0')}` } : d));
  };

  const submit = async (close = true) => {
    if (!draft) return;
    if (!String(draft.name ?? '').trim()) { setError('Head name is required'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      if (draft.id) {
        await updatePayHead(tenantSlug, branchId, draft.id, draft);
        setNotice(`${draft.name} has been updated.`);
      } else {
        const created = await savePayHead(tenantSlug, branchId, draft);
        setNotice(`${created.name} has been added to the paying scheme.`);
      }
      hub.reload();
      if (close) setDraft(null);
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  };

  const remove = async (h: PayHead) => {
    setError(''); setNotice(''); setConfirmId(null);
    try {
      await deletePayHead(tenantSlug, branchId, h.id);
      setNotice(`${h.name} has been deleted.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  const set = (patch: Partial<PayHead>) => setDraft(d => (d ? { ...d, ...patch } : d));
  const accounts = hub.value?.accounts ?? [];
  const subtitle = activeFilters.length ? activeFilters.join(' · ') : 'Every salary head the company pays by';

  return (
    <div className="space-y-4">
      <div className="nb-card p-0 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3.5 pb-3.5">
          <div className="min-w-0">
            <h2 className="page-title">Salary Heads</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              A head is one line of the monthly pay — House Rent Allowance, Provident Fund, Income Tax. Whatever is
              defined here is what the schemes, the payslips and the payroll journal are built from, so an amount
              typed on a scheme only reaches the ledger once it stands on one of these heads.
            </p>
            <div className="mt-2"><StatStrip stats={stats} /></div>
          </div>
          <ListToolbar addLabel="ADD HEAD"
            onAdd={() => { setDraft(blank(kind === 'Deduction' ? 'Deduction' : 'Earning', rows.length + 1)); setError(''); setNotice(''); }} />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100">
          <SearchBox key={searchEpoch} placeholder="Search by code, name, description or ledger account" onSearch={setSearch} />
          <StatusPills value={kind} onChange={setKind} counts={kindCounts} />
          <span className="filter-plate">
            <select aria-label="Filter by state" value={liveness} onChange={e => setLiveness(e.target.value)}>
              <option value="">State</option>
              <option value="active">Active</option>
              <option value="stopped">Stopped</option>
            </select>
            {liveness && (
              <button type="button" title="Show heads in either state" onClick={() => setLiveness('')}
                className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
          <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <ExportPair title="Salary Heads" subtitle={subtitle} filename="salary-heads" columns={columns}
              rows={visible}
              footer={footerRow(columns.length, {
                0: `Total (${visible.length})`, 5: money(fixedMonthly),
                10: String(onSchemes), 11: String(onSheets)
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

        {draft && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="card-title">
                {draft.id ? `Edit Salary Head - [${draft.name || 'untitled'}]` : 'Create Salary Head'}
              </h3>
              {!editable && <span className="text-[11px] font-semibold text-amber-600">You may view heads but not change them.</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Head Name" required>
                <Text value={draft.name ?? ''} onChange={e => set({ name: e.target.value })} placeholder="e.g. House Rent Allowance" disabled={!editable} />
              </Field>
              <Field label="Code">
                <div className="flex items-center gap-1">
                  <Text value={draft.code ?? ''} onChange={e => set({ code: e.target.value.toUpperCase() })} placeholder="PH-004" disabled={!editable} />
                  <button type="button" onClick={proposeCode} disabled={!editable} title="Propose the next code"
                    className="h-[30px] w-8 shrink-0 rounded border border-teal-200 bg-teal-50 text-[#25a195] hover:bg-teal-100 disabled:opacity-40 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Field>
              <Field label="Earned or Deducted" required>
                <Pick value={draft.kind ?? 'Earning'} onChange={e => set({ kind: e.target.value as PayHeadKind })} disabled={!editable}>
                  {(hub.value?.kinds ?? ['Earning', 'Deduction']).map(k => <option key={k} value={k}>{k}</option>)}
                </Pick>
              </Field>
              <Field label="Order on Payslip" hint="Lower numbers print first — gross pay builds in this order.">
                <NumCell value={draft.sequence ?? 0} onChange={e => set({ sequence: Number(e.target.value) })} disabled={!editable} />
              </Field>
              <Field label="How the amount is cut">
                <Pick value={draft.basis ?? 'Fixed'} onChange={e => set({ basis: e.target.value as PayHead['basis'] })} disabled={!editable}>
                  {(hub.value?.bases ?? ['Fixed', 'Basic %', 'Gross %']).map(b => <option key={b} value={b}>{b}</option>)}
                </Pick>
              </Field>
              {draft.basis === 'Fixed' ? (
                <Field label="Amount">
                  <NumCell value={draft.amount ?? 0} onChange={e => set({ amount: Number(e.target.value) })} disabled={!editable} />
                </Field>
              ) : (
                <Field label="Rate (%)">
                  <NumCell value={draft.rate ?? 0} onChange={e => set({ rate: Number(e.target.value) })} step="0.01" disabled={!editable} />
                </Field>
              )}
              <Field label="Books Into Account" hint="The ledger this head posts to when the sheet is approved.">
                <Pick value={String(draft.accountId ?? '')} onChange={e => set({ accountId: Number(e.target.value) || null })} disabled={!editable}>
                  <option value="">Let payroll decide</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Pick>
              </Field>
              <Field label="Auto Rule">
                <Pick value={draft.rule ?? ''} onChange={e => set({ rule: e.target.value as PayHead['rule'] })} disabled={!editable}>
                  {RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Pick>
              </Field>
              <Field label="Description" className="lg:col-span-4">
                <Area rows={2} value={draft.description ?? ''} onChange={e => set({ description: e.target.value })}
                  placeholder="What this head is for, and who it applies to." disabled={!editable} />
              </Field>
              <div className="flex items-end gap-4 lg:col-span-4">
                <Check checked={!!draft.auto} onChange={v => set({ auto: v })} label="Payroll fills this amount by itself" disabled={!editable} />
                <Check checked={!!draft.taxable} onChange={v => set({ taxable: v })} label="Counts as taxable pay" disabled={!editable} />
                <Check checked={draft.isActive !== false} onChange={v => set({ isActive: v })} label="Active" disabled={!editable} />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              {BASIS_HINT[draft.basis ?? 'Fixed']}
              {draft.auto ? ' This head is filled from the payroll rules, so an amount typed on a scheme is only a floor.' : ''}
            </p>
            <FormFooter onSave={() => submit()} onClose={() => setDraft(null)} saving={saving}
              disabled={!editable || !String(draft.name ?? '').trim()}
              saveLabel={draft.id ? 'SAVE' : 'ADD HEAD'} />
          </div>
        )}

        <div className="nb-card p-0 overflow-hidden">
          <div className="overflow-auto max-h-[64vh] app-scroll">
          <table className="splendid-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <SortHeader label="Code" sortKey="code" sort={sort} onSort={onSort} />
                <SortHeader label="Salary Head" sortKey="name" sort={sort} onSort={onSort} />
                <SortHeader label="Type" sortKey="kind" sort={sort} onSort={onSort} />
                <SortHeader label="Basis" sortKey="basis" sort={sort} onSort={onSort} />
                <SortHeader label="Rate" sortKey="rate" sort={sort} onSort={onSort} />
                <SortHeader label="Amount" sortKey="amount" sort={sort} onSort={onSort} />
                <SortHeader label="Ledger Account" sortKey="accountName" sort={sort} onSort={onSort} />
                <th>Rule</th>
                <th>Taxable</th>
                <SortHeader label="On agreed" sortKey="usedBy" sort={sort} onSort={onSort} />
                <SortHeader label="On sheets" sortKey="onSheets" sort={sort} onSort={onSort} />
                <SortHeader label="Status" sortKey="isActive" sort={sort} onSort={onSort} />
                <th className="w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {hub.loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={13}>
                    <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${100 - i * 8}%` }} />
                  </td>
                </tr>
              ))}
              {!hub.loading && !visible.length && (
                <TableEmpty colSpan={13} noun="salary heads" filters={activeFilters} cleared={clearAll}
                  addLabel={rows.length ? undefined : 'ADD HEAD'}
                  onAdd={() => { setDraft(blank('Earning', rows.length + 1)); setError(''); setNotice(''); }} />
              )}
              {!hub.loading && visible.map(h => (
                <tr key={h.id}>
                  <td className="font-medium">{h.code || '-'}</td>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{h.name}</span>
                      {h.auto && <span className="text-[10px] font-bold uppercase text-[#1e88e5] bg-blue-50 px-1.5 py-0.5 rounded">Auto</span>}
                    </span>
                    {h.description && <span className="block text-[10px] text-gray-400">{h.description}</span>}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      h.kind === 'Earning' ? 'bg-teal-50 text-[#25a195]' : 'bg-amber-50 text-amber-700'}`}>
                      {h.kind}
                    </span>
                  </td>
                  <td>{h.basis}</td>
                  <td className="text-right">{h.basis === 'Fixed' ? <span className="text-gray-300">-</span> : `${h.rate}%`}</td>
                  <td className="text-right">{h.basis === 'Fixed' ? money(h.amount) : <span className="text-gray-300">from rate</span>}</td>
                  <td>{h.accountName || <span className="text-gray-300">Payroll decides</span>}</td>
                  <td>{h.rule || <span className="text-gray-300">-</span>}</td>
                  <td>{h.taxable ? 'Yes' : <span className="text-gray-300">No</span>}</td>
                  <td className="text-right">{h.usedBy}</td>
                  <td className="text-right">{h.onSheets}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${h.isActive ? 'bg-teal-50 text-[#25a195]' : 'bg-gray-100 text-gray-500'}`}>
                      {h.isActive ? 'Active' : 'Stopped'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <IconAction title="Edit head" tone="primary" disabled={!editable}
                        onClick={() => { setDraft({ ...h }); setError(''); setNotice(''); }}><Pencil className="w-4 h-4" /></IconAction>
                      {confirmId === h.id ? (
                        <DeleteConfirm onConfirm={() => remove(h)} onCancel={() => setConfirmId(null)}
                          keepLabel={`Keep ${h.name}`} />
                      ) : (
                        <IconAction title={h.onSheets ? 'Already on a salary sheet — stop it instead of deleting'
                          : h.usedBy ? `Still carried by ${h.usedBy} agreed scheme${h.usedBy === 1 ? '' : 's'} — deleting takes it off those schemes and re-cuts their gross`
                          : 'Delete head'}
                          tone="danger" disabled={!editable || h.onSheets > 0} onClick={() => setConfirmId(h.id)}><Trash2 className="w-4 h-4" /></IconAction>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {!!visible.length && !hub.loading && (
              <tfoot>
                <tr className="bg-gray-50/80">
                  {/* The same figures the chips above write, and the sheet and the workbook close with. */}
                  <td colSpan={5} className="font-black text-gray-800">Total ({visible.length})</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{money(fixedMonthly)}</td>
                  <td colSpan={3} className="text-[11px] text-gray-500">
                    Flat heads only; a percentage head is cut from basic pay on each scheme
                  </td>
                  <td className="text-right tabular-nums font-black text-gray-800">{onSchemes}</td>
                  <td className="text-right tabular-nums font-black text-gray-800">{onSheets}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayHeadsPage;
