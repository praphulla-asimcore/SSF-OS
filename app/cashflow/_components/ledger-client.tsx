'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Pencil, Trash2, X, DownloadIcon, Loader2 } from 'lucide-react';
import { formatCurrency, MONTHS_2026, MONTH_FULL_LABELS, weeksForMonth, WEEKS_2026, CURRENCY_RATES, type Week2026 } from '@/lib/format';
import { toast } from 'sonner';

interface Category { id: string; name: string; type: string; sortOrder: number; }
interface Entry {
  id: string; description: string; project: string; invoiceRef: string;
  amount: number; currency: string; rate: number; periodMonth: string; periodWeek: string | null;
  notes: string; categoryId: string; bankAccountId: string | null;
}
interface Account { id: string; name: string; currency: string; entity: string; openingBalance: number; }

const WEEK_BY_KEY = new Map(WEEKS_2026.map((w) => [w.key, w]));

// Which week does an entry fall in? Fall back to the first week of its month
// for any legacy entry that only has a month.
function entryWeekKey(e: Entry): string {
  if (e?.periodWeek && WEEK_BY_KEY.has(e.periodWeek)) return e.periodWeek;
  const wks = weeksForMonth(e?.periodMonth ?? '');
  return wks[0]?.key ?? '';
}
function entryMonth(e: Entry): string {
  const wk = WEEK_BY_KEY.get(entryWeekKey(e));
  return wk?.month ?? e?.periodMonth ?? '';
}

export function LedgerClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [entityFilter, setEntityFilter] = useState('All');
  const [addingTo, setAddingTo] = useState<string | null>(null);     // categoryId for new entry
  const [editing, setEditing] = useState<Entry | null>(null);        // entry being edited
  const [showAddCategory, setShowAddCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    try {
      const [catRes, entryRes, accRes] = await Promise.all([
        fetch('/api/cashflow/categories'),
        fetch('/api/cashflow/entries'),
        fetch('/api/cashflow/accounts'),
      ]);
      setCategories((await catRes.json()) ?? []);
      setEntries((await entryRes.json()) ?? []);
      setAccounts((await accRes.json()) ?? []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const weeks = useMemo(() => weeksForMonth(selectedMonth), [selectedMonth]);

  const entities = useMemo(() => {
    const set = new Set((accounts ?? []).map((a: any) => a?.entity ?? '').filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [accounts]);

  // Entity filter: when a specific entity is chosen, only entries tied to one of
  // that entity's bank accounts are shown.
  const visibleEntries = useMemo(() => {
    if (entityFilter === 'All') return entries ?? [];
    const ids = new Set((accounts ?? []).filter((a) => a?.entity === entityFilter).map((a) => a?.id));
    return (entries ?? []).filter((e) => e?.bankAccountId && ids.has(e.bankAccountId));
  }, [entries, accounts, entityFilter]);

  const inflowCats = useMemo(() => (categories ?? []).filter((c) => c?.type === 'INFLOW').sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0)), [categories]);
  const outflowCats = useMemo(() => (categories ?? []).filter((c) => c?.type === 'OUTFLOW').sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0)), [categories]);

  const toggleCat = (id: string) => setExpandedCats((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const idr = (e: Entry) => (e?.amount ?? 0) * (e?.rate ?? 1);
  const getCatWeek = (catId: string, weekKey: string) =>
    visibleEntries.filter((e) => e?.categoryId === catId && entryWeekKey(e) === weekKey).reduce((s, e) => s + idr(e), 0);
  const getCatMonth = (catId: string) =>
    visibleEntries.filter((e) => e?.categoryId === catId && entryMonth(e) === selectedMonth).reduce((s, e) => s + idr(e), 0);
  const getTypeWeek = (type: string, weekKey: string) => {
    const ids = new Set((categories ?? []).filter((c) => c?.type === type).map((c) => c?.id));
    return visibleEntries.filter((e) => ids.has(e?.categoryId) && entryWeekKey(e) === weekKey).reduce((s, e) => s + idr(e), 0);
  };
  const getTypeMonth = (type: string) => {
    const ids = new Set((categories ?? []).filter((c) => c?.type === type).map((c) => c?.id));
    return visibleEntries.filter((e) => ids.has(e?.categoryId) && entryMonth(e) === selectedMonth).reduce((s, e) => s + idr(e), 0);
  };

  const saveEntry = async (form: any) => {
    const wk = WEEK_BY_KEY.get(form.periodWeek);
    const payload = { ...form, periodMonth: wk?.month ?? selectedMonth };
    try {
      if (editing) {
        await fetch(`/api/cashflow/entries/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        toast.success('Entry updated');
      } else {
        await fetch('/api/cashflow/entries', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        toast.success('Entry added');
      }
      setAddingTo(null); setEditing(null);
      fetchData();
    } catch { toast.error('Failed to save entry'); }
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetch(`/api/cashflow/entries/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const addCategory = async (type: string) => {
    if (!newCatName.trim()) return;
    try {
      await fetch('/api/cashflow/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName, type }),
      });
      toast.success('Category added');
      setNewCatName(''); setShowAddCategory(null);
      fetchData();
    } catch { toast.error('Failed to add category'); }
  };

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/cashflow/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, entity: entityFilter === 'All' ? undefined : entityFilter }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SSF_Cashflow_${selectedMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('PDF downloaded');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  const stepMonth = (dir: number) => {
    const i = MONTHS_2026.indexOf(selectedMonth);
    const ni = Math.min(MONTHS_2026.length - 1, Math.max(0, i + dir));
    setSelectedMonth(MONTHS_2026[ni]);
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}</div>;

  const colW = 'w-28';

  const renderSection = (title: string, cats: Category[], type: string, colorClass: string) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${colorClass}`}>{title}</h3>
        <button
          onClick={() => setShowAddCategory(showAddCategory === type ? null : type)}
          className={`flex items-center gap-1 text-xs ${colorClass} opacity-60 hover:opacity-100 transition-opacity`}
        >
          <Plus className="w-3 h-3" /> Add Category
        </button>
      </div>

      {showAddCategory === type && (
        <div className="flex items-center gap-2 px-3 pb-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name..."
            className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-[#009AFF]/50"
            onKeyDown={(e) => { if (e.key === 'Enter') addCategory(type); }}
          />
          <button onClick={() => addCategory(type)} className="px-3 py-1.5 bg-[#009AFF] text-[#05070c] rounded text-xs font-medium">Add</button>
          <button onClick={() => setShowAddCategory(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {cats.map((cat) => {
        const isExpanded = expandedCats.has(cat?.id);
        const catEntries = visibleEntries.filter((e) => e?.categoryId === cat?.id && entryMonth(e) === selectedMonth);
        return (
          <div key={cat?.id} className="glass-light rounded-lg overflow-hidden">
            <div className="flex items-center cursor-pointer hover:bg-white/[0.03] transition-colors" onClick={() => toggleCat(cat?.id)}>
              <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-[220px]">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/30" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
                <span className="text-sm text-white/80 font-medium">{cat?.name ?? ''}</span>
                <span className="text-xs text-white/20">({catEntries.length})</span>
              </div>
              {weeks.map((w) => {
                const total = getCatWeek(cat?.id, w.key);
                return (
                  <div key={w.key} className={`${colW} px-2 py-2.5 text-right`}>
                    <span className={`text-xs font-mono ${total !== 0 ? colorClass : 'text-white/15'}`}>{total !== 0 ? formatCurrency(total, 'IDR') : '–'}</span>
                  </div>
                );
              })}
              <div className={`${colW} px-2 py-2.5 text-right`}>
                <span className={`text-xs font-mono font-semibold ${getCatMonth(cat?.id) !== 0 ? colorClass : 'text-white/15'}`}>{getCatMonth(cat?.id) !== 0 ? formatCurrency(getCatMonth(cat?.id), 'IDR') : '–'}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-white/5">
                {catEntries.map((entry) => (
                  <div key={entry?.id} className="flex items-center px-3 py-2 hover:bg-white/[0.02] group">
                    <div className="flex-1 min-w-[220px] pl-6">
                      <p className="text-xs text-white/60">{entry?.description ?? ''}</p>
                      <p className="text-[10px] text-white/25">
                        {entry?.project ? `${entry.project} · ` : ''}{entry?.currency !== 'IDR' ? `${entry?.amount?.toLocaleString('en-US')} ${entry?.currency}` : ''}
                      </p>
                    </div>
                    {weeks.map((w) => (
                      <div key={w.key} className={`${colW} px-2 text-right`}>
                        <span className="text-xs font-mono text-white/45">{entryWeekKey(entry) === w.key ? formatCurrency(idr(entry), 'IDR') : ''}</span>
                      </div>
                    ))}
                    <div className={`${colW} px-2 flex items-center justify-end gap-1`}>
                      <button onClick={(e) => { e.stopPropagation(); setEditing(entry); setAddingTo(null); }} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-[#009AFF] transition-all"><Pencil className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry?.id); }} className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}

                {editing && editing.categoryId === cat?.id && (
                  <EntryForm key={editing.id} initial={editing} weeks={weeksForMonth(entryMonth(editing))} accounts={accounts} onSave={saveEntry} onCancel={() => setEditing(null)} />
                )}

                {addingTo === cat?.id ? (
                  <EntryForm weeks={weeks} defaultWeek={weeks[0]?.key} categoryId={cat?.id} accounts={accounts} onSave={saveEntry} onCancel={() => setAddingTo(null)} />
                ) : (
                  <button onClick={() => { setAddingTo(cat?.id); setEditing(null); }} className="flex items-center gap-1 px-3 py-2 pl-8 text-xs text-[#009AFF]/60 hover:text-[#009AFF] transition-colors w-full">
                    <Plus className="w-3 h-3" /> Add entry to {cat?.name}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center px-3 py-2 bg-white/[0.02] rounded-lg">
        <div className="flex-1 min-w-[220px]"><span className={`text-sm font-bold ${colorClass}`}>Total {title}</span></div>
        {weeks.map((w) => {
          const total = getTypeWeek(type, w.key);
          return <div key={w.key} className={`${colW} px-2 text-right`}><span className={`text-xs font-mono font-bold ${colorClass}`}>{total !== 0 ? formatCurrency(total, 'IDR') : '–'}</span></div>;
        })}
        <div className={`${colW} px-2 text-right`}><span className={`text-xs font-mono font-bold ${colorClass}`}>{getTypeMonth(type) !== 0 ? formatCurrency(getTypeMonth(type), 'IDR') : '–'}</span></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cash Flow Ledger</h1>
          <p className="text-white/40 text-sm mt-1">Weekly view — expand a category and pick a week to log cash in or out. All amounts shown in IDR.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D4A843]/60 bg-[#D4A843]/10 text-[#F0C060] text-sm font-medium hover:bg-[#D4A843]/20 hover:border-[#D4A843] disabled:opacity-60 disabled:cursor-wait transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
            {exporting ? 'Generating…' : 'Download PDF'}
          </button>
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 focus:outline-none cursor-pointer">
            {entities.map((e) => <option key={e} value={e} className="bg-[#0b0e14]">{e}</option>)}
          </select>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => stepMonth(-1)} disabled={selectedMonth === MONTHS_2026[0]} className="glass-light w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-[#009AFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2 glass-light rounded-lg text-sm font-semibold text-white focus:outline-none cursor-pointer min-w-[180px] text-center">
          {MONTHS_2026.map((m) => <option key={m} value={m} className="bg-[#0b0e14]">{MONTH_FULL_LABELS[m] ?? m}</option>)}
        </select>
        <button onClick={() => stepMonth(1)} disabled={selectedMonth === MONTHS_2026[MONTHS_2026.length - 1]} className="glass-light w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-[#009AFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex items-center px-3 py-3 border-b border-white/10">
              <div className="flex-1 min-w-[220px]"><span className="text-xs text-white/30 uppercase tracking-wider">Category</span></div>
              {weeks.map((w) => (
                <div key={w.key} className={`${colW} px-2 text-right`} title={w.fullLabel}>
                  <span className="text-xs text-white/50 font-medium block">{w.rangeLabel}</span>
                  <span className="text-[9px] text-white/25 uppercase tracking-wide">{w.key.slice(5)}</span>
                </div>
              ))}
              <div className={`${colW} px-2 text-right`}><span className="text-xs text-[#009AFF]/70 font-semibold uppercase tracking-wider">Month</span></div>
            </div>

            <div className="p-3 space-y-1">{renderSection('Cash In (Inflows)', inflowCats, 'INFLOW', 'text-emerald-400')}</div>
            <div className="border-t border-white/10" />
            <div className="p-3 space-y-1">{renderSection('Cash Out (Outflows)', outflowCats, 'OUTFLOW', 'text-red-400')}</div>
            <div className="border-t border-[#009AFF]/20" />

            {/* Net */}
            <div className="flex items-center px-6 py-4 bg-[#009AFF]/5">
              <div className="flex-1 min-w-[220px]"><span className="text-sm font-bold text-[#009AFF]">Net Cash Flow</span></div>
              {weeks.map((w) => {
                const net = getTypeWeek('INFLOW', w.key) - getTypeWeek('OUTFLOW', w.key);
                return <div key={w.key} className={`${colW} px-2 text-right`}><span className={`text-xs font-mono font-bold ${net >= 0 ? 'text-[#009AFF]' : 'text-red-400'}`}>{formatCurrency(net, 'IDR')}</span></div>;
              })}
              <div className={`${colW} px-2 text-right`}>
                {(() => { const net = getTypeMonth('INFLOW') - getTypeMonth('OUTFLOW'); return <span className={`text-xs font-mono font-bold ${net >= 0 ? 'text-[#009AFF]' : 'text-red-400'}`}>{formatCurrency(net, 'IDR')}</span>; })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryForm({ initial, categoryId, weeks, defaultWeek, accounts, onSave, onCancel }: {
  initial?: Entry; categoryId?: string; weeks: Week2026[]; defaultWeek?: string;
  accounts: Account[]; onSave: (form: any) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    description: initial?.description ?? '',
    project: initial?.project ?? '',
    invoiceRef: initial?.invoiceRef ?? '',
    amount: initial?.amount ?? 0,
    currency: initial?.currency ?? 'IDR',
    rate: initial?.rate ?? 1,
    periodWeek: initial?.periodWeek ?? defaultWeek ?? weeks[0]?.key ?? '',
    notes: initial?.notes ?? '',
    bankAccountId: initial?.bankAccountId ?? '',
    categoryId: initial?.categoryId ?? categoryId ?? '',
  });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const setCurrency = (c: string) => setForm((p) => ({ ...p, currency: c, rate: CURRENCY_RATES[c] ?? p.rate }));

  const converted = (form.amount || 0) * (form.rate || 1);
  const valid = form.description.trim().length > 0 && form.amount > 0 && form.periodWeek;

  const labelCls = 'block text-[10px] uppercase tracking-wider text-white/40 mb-1';
  const inputCls = 'w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#009AFF]/50';

  return (
    <div className="m-3 ml-8 p-4 rounded-lg bg-[#0b0e14]/60 border border-[#009AFF]/20 space-y-3">
      <p className="text-xs font-semibold text-[#009AFF]">{initial ? 'Edit entry' : 'New entry'}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className={labelCls}>Description *</label>
          <input autoFocus value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. WPP Production – Milo invoice" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Project / Client</label>
          <input value={form.project} onChange={(e) => set('project', e.target.value)} placeholder="e.g. Milo" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Amount *</label>
          <input type="number" value={form.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <select value={form.currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {['IDR', 'USD', 'SGD', 'GBP', 'MYR'].map((c) => <option key={c} value={c} className="bg-[#0b0e14]">{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Rate to IDR</label>
          <input type="number" value={form.rate} onChange={(e) => set('rate', parseFloat(e.target.value) || 1)} disabled={form.currency === 'IDR'} className={`${inputCls} ${form.currency === 'IDR' ? 'opacity-40' : ''}`} />
        </div>
        <div>
          <label className={labelCls}>Week *</label>
          <select value={form.periodWeek} onChange={(e) => set('periodWeek', e.target.value)} className={`${inputCls} cursor-pointer`}>
            {weeks.map((w) => <option key={w.key} value={w.key} className="bg-[#0b0e14]">{w.dropdownLabel}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className={labelCls}>Bank Account (optional)</label>
          <select value={form.bankAccountId} onChange={(e) => set('bankAccountId', e.target.value)} className={`${inputCls} cursor-pointer`}>
            <option value="" className="bg-[#0b0e14]">No account</option>
            {(accounts ?? []).map((a) => <option key={a?.id} value={a?.id} className="bg-[#0b0e14]">{a?.name} ({a?.currency}) — {a?.entity}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Converted (IDR)</label>
          <div className="px-2.5 py-2 rounded-md bg-[#009AFF]/10 border border-[#009AFF]/20 text-sm font-mono text-[#009AFF]">{formatCurrency(converted, 'IDR')}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onSave(form)} disabled={!valid} className="px-4 py-2 bg-[#009AFF] text-[#05070c] rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed">{initial ? 'Save changes' : 'Add entry'}</button>
        <button onClick={onCancel} className="px-4 py-2 border border-white/10 text-white/50 hover:text-white rounded-md text-xs">Cancel</button>
        {!valid && <span className="text-[10px] text-white/30">Description, amount &amp; week are required</span>}
      </div>
    </div>
  );
}
