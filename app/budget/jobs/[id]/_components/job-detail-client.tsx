'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, User, DollarSign, Lock, Unlock, Plus, FileText, Download, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';
import { toast } from 'sonner';
import { JobFormModal } from '../../_components/job-form-modal';

const BUDGET_CATEGORIES = ['Production', 'Crew', 'Equipment', 'Location/Travel', 'Post-Production', 'Music/SFX', 'Other'];
const CHANGE_STATUSES = ['Pending', 'Internal Approved', 'Client Approved', 'Invoiced'];

const STATUS_COLORS: Record<string, string> = {
  'Pitching': 'bg-blue-500/20 text-blue-300',
  'Awarded': 'bg-amber-500/20 text-amber-300',
  'In Production': 'bg-emerald-500/20 text-emerald-300',
  'Delivered': 'bg-purple-500/20 text-purple-300',
  'Closed': 'bg-white/10 text-white/40',
};

export function JobDetailClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [newChange, setNewChange] = useState({ description: '', costImpact: 0, status: 'Pending' });
  const [showChangeForm, setShowChangeForm] = useState(false);

  const fetchJob = () => {
    fetch(`/api/budget/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d: any) => setJob(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJob(); }, [jobId]);

  const saveBudgetLine = async (lineId: string, field: string, value: number) => {
    try {
      await fetch(`/api/budget/budget-lines/${lineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      fetchJob();
    } catch (err: any) {
      toast.error('Failed to update');
    }
  };

  const addChange = async () => {
    if (!newChange.description) return;
    try {
      await fetch(`/api/budget/jobs/${jobId}/changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChange),
      });
      setNewChange({ description: '', costImpact: 0, status: 'Pending' });
      setShowChangeForm(false);
      fetchJob();
      toast.success('Change logged');
    } catch (err: any) {
      toast.error('Failed to add change');
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="glass rounded-xl h-32 animate-pulse" />)}</div>;
  if (!job) return <p className="text-white/50">Job not found.</p>;

  const budgetLines = job?.budgetLines ?? [];
  const changeLogs = job?.changeLogs ?? [];
  const totalBudget = budgetLines.reduce((s: number, l: any) => s + (l?.budget ?? 0), 0);
  const totalCommitted = budgetLines.reduce((s: number, l: any) => s + (l?.committed ?? 0), 0);
  const totalActual = budgetLines.reduce((s: number, l: any) => s + (l?.actual ?? 0), 0);
  const totalRemaining = totalBudget - totalActual;
  const margin = (job?.awardedValue ?? 0) > 0 ? (((job?.awardedValue ?? 0) - totalActual) / (job?.awardedValue ?? 0)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/budget/jobs" className="flex items-center gap-2 text-white/40 hover:text-[#009AFF] transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to All Jobs
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{job?.name ?? ''}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job?.status ?? ''] ?? ''}`}>
                {job?.status ?? ''}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{job?.client ?? ''}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job?.office ?? ''}</span>
              {job?.director && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{job.director}</span>}
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job?.currency ?? 'IDR'}</span>
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 border border-[#009AFF]/30 text-[#009AFF] rounded-lg text-sm hover:bg-[#009AFF]/10 transition-colors"
          >
            Edit Job
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <MiniKPI label="Awarded Value" value={formatCurrency(job?.awardedValue ?? 0, job?.currency ?? 'IDR')} />
          <MiniKPI label="Total Budget" value={formatCurrency(totalBudget, job?.currency ?? 'IDR')} />
          <MiniKPI label="Total Actual" value={formatCurrency(totalActual, job?.currency ?? 'IDR')} />
          <MiniKPI label="Remaining" value={formatCurrency(totalRemaining, job?.currency ?? 'IDR')} highlight={totalRemaining < 0 ? 'red' : 'green'} />
          <MiniKPI label="Margin" value={`${margin.toFixed(1)}%`} highlight={margin >= 15 ? 'green' : margin >= 0 ? 'amber' : 'red'} />
        </div>
      </motion.div>

      {/* Budget Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Cost Categories</h2>
          <span className="flex items-center gap-1 text-xs text-white/30">
            {job?.budgetLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {job?.budgetLocked ? 'Budget Locked' : 'Budget Editable'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-3 py-2 text-white/40 text-xs">Category</th>
                <th className="text-right px-3 py-2 text-white/40 text-xs">Budget</th>
                <th className="text-right px-3 py-2 text-white/40 text-xs">Committed</th>
                <th className="text-right px-3 py-2 text-white/40 text-xs">Actual</th>
                <th className="text-right px-3 py-2 text-white/40 text-xs">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {budgetLines.map((line: any) => {
                const rem = (line?.budget ?? 0) - (line?.actual ?? 0);
                return (
                  <tr key={line?.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-white/70">{line?.category ?? ''}</td>
                    <td className="px-3 py-2 text-right">
                      <EditableCell value={line?.budget ?? 0} onSave={(v: number) => saveBudgetLine(line?.id, 'budget', v)} currency={job?.currency ?? 'IDR'} disabled={job?.budgetLocked} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <EditableCell value={line?.committed ?? 0} onSave={(v: number) => saveBudgetLine(line?.id, 'committed', v)} currency={job?.currency ?? 'IDR'} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <EditableCell value={line?.actual ?? 0} onSave={(v: number) => saveBudgetLine(line?.id, 'actual', v)} currency={job?.currency ?? 'IDR'} />
                    </td>
                    <td className={`px-3 py-2 text-right font-mono ${rem < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formatCurrency(rem, job?.currency ?? 'IDR')}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-[#009AFF]/20">
                <td className="px-3 py-2 text-[#009AFF] font-medium">Total</td>
                <td className="px-3 py-2 text-right font-mono text-[#009AFF]">{formatCurrency(totalBudget, job?.currency ?? 'IDR')}</td>
                <td className="px-3 py-2 text-right font-mono text-[#009AFF]">{formatCurrency(totalCommitted, job?.currency ?? 'IDR')}</td>
                <td className="px-3 py-2 text-right font-mono text-[#009AFF]">{formatCurrency(totalActual, job?.currency ?? 'IDR')}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${totalRemaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(totalRemaining, job?.currency ?? 'IDR')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Change Log */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Change Log</h2>
          <button onClick={() => setShowChangeForm(!showChangeForm)} className="flex items-center gap-1 text-xs text-[#009AFF] hover:text-[#4FB8FF] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Change
          </button>
        </div>

        {showChangeForm && (
          <div className="mb-4 p-4 bg-white/[0.03] rounded-lg space-y-3">
            <input
              value={newChange.description}
              onChange={(e) => setNewChange((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the change..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#009AFF]/50"
            />
            <div className="flex gap-3">
              <input
                type="number"
                value={newChange.costImpact}
                onChange={(e) => setNewChange((p) => ({ ...p, costImpact: parseFloat(e.target.value) || 0 }))}
                placeholder="Cost Impact"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#009AFF]/50"
              />
              <select
                value={newChange.status}
                onChange={(e) => setNewChange((p) => ({ ...p, status: e.target.value }))}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none cursor-pointer"
              >
                {CHANGE_STATUSES.map(s => <option key={s} value={s} className="bg-[#0b0e14]">{s}</option>)}
              </select>
              <button onClick={addChange} className="px-4 py-2 bg-[#009AFF] text-[#05070c] rounded-lg text-sm font-medium hover:bg-[#4FB8FF] transition-colors">
                Save
              </button>
            </div>
          </div>
        )}

        {(changeLogs?.length ?? 0) === 0 ? (
          <p className="text-white/20 text-sm">No changes recorded.</p>
        ) : (
          <div className="space-y-2">
            {changeLogs.map((cl: any) => (
              <div key={cl?.id} className="flex items-start justify-between p-3 bg-white/[0.02] rounded-lg">
                <div>
                  <p className="text-sm text-white/70">{cl?.description ?? ''}</p>
                  <p className="text-xs text-white/30 mt-1">
                    {cl?.createdAt ? new Date(cl.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-mono ${(cl?.costImpact ?? 0) > 0 ? 'text-red-400' : (cl?.costImpact ?? 0) < 0 ? 'text-emerald-400' : 'text-white/40'}`}>
                    {(cl?.costImpact ?? 0) > 0 ? '+' : ''}{formatCurrency(cl?.costImpact ?? 0, job?.currency ?? 'IDR')}
                  </span>
                  <p className="text-xs text-white/30 mt-1">{cl?.status ?? ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {showEdit && (
        <JobFormModal
          initial={job}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchJob(); toast.success('Job updated'); }}
        />
      )}
    </div>
  );
}

function MiniKPI({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  const colorMap: Record<string, string> = { green: 'text-emerald-400', red: 'text-red-400', amber: 'text-amber-400' };
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <p className="text-xs text-white/30 mb-1">{label}</p>
      <p className={`text-sm font-bold ${highlight ? colorMap[highlight] ?? 'text-white' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function EditableCell({ value, onSave, currency, disabled }: { value: number; onSave: (v: number) => void; currency: string; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));

  if (editing && !disabled) {
    return (
      <input
        type="number"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => { onSave(parseFloat(temp) || 0); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onSave(parseFloat(temp) || 0); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
        autoFocus
        className="w-24 px-2 py-1 bg-white/10 border border-[#009AFF]/50 rounded text-sm text-white text-right focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => { if (!disabled) { setTemp(String(value)); setEditing(true); } }}
      className={`font-mono text-white/60 ${disabled ? '' : 'cursor-pointer hover:text-[#009AFF] transition-colors'}`}
    >
      {formatCurrency(value, currency)}
    </span>
  );
}
