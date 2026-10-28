'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Pitching', 'Awarded', 'In Production', 'Delivered', 'Closed'];
const OFFICES = ['Jakarta', 'Singapore', 'KL'];
const CURRENCIES = ['IDR', 'USD', 'SGD', 'GBP', 'MYR'];

interface Props {
  onClose: () => void;
  onSaved: () => void;
  initial?: any;
}

export function JobFormModal({ onClose, onSaved, initial }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    client: initial?.client ?? '',
    status: initial?.status ?? 'Pitching',
    office: initial?.office ?? 'Jakarta',
    director: initial?.director ?? '',
    currency: initial?.currency ?? 'IDR',
    exchangeRate: initial?.exchangeRate ?? 1,
    awardedValue: initial?.awardedValue ?? 0,
    approvedBudget: initial?.approvedBudget ?? 0,
    forecastCost: initial?.forecastCost ?? 0,
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.client) {
      toast.error('Name and client are required');
      return;
    }
    setSaving(true);
    try {
      const url = initial?.id ? `/api/budget/jobs/${initial.id}` : '/api/budget/jobs';
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, val: any) => setForm((p: any) => ({ ...(p ?? {}), [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{initial?.id ? 'Edit Job' : 'New Job'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Job Name" value={form.name} onChange={(v: any) => set('name', v)} required />
          <Field label="Client" value={form.client} onChange={(v: any) => set('client', v)} required />
          <Field label="Director" value={form.director} onChange={(v: any) => set('director', v)} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Status" value={form.status} options={STATUSES} onChange={(v: any) => set('status', v)} />
            <SelectField label="Office" value={form.office} options={OFFICES} onChange={(v: any) => set('office', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Currency" value={form.currency} options={CURRENCIES} onChange={(v: any) => set('currency', v)} />
            <Field label="Exchange Rate" value={form.exchangeRate} onChange={(v: any) => set('exchangeRate', parseFloat(v) || 1)} type="number" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Awarded Value" value={form.awardedValue} onChange={(v: any) => set('awardedValue', parseFloat(v) || 0)} type="number" />
            <Field label="Approved Budget" value={form.approvedBudget} onChange={(v: any) => set('approvedBudget', parseFloat(v) || 0)} type="number" />
            <Field label="Forecast Cost" value={form.forecastCost} onChange={(v: any) => set('forecastCost', parseFloat(v) || 0)} type="number" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#009AFF]/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-[#009AFF] text-[#05070c] font-medium text-sm hover:bg-[#4FB8FF] transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : initial?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }: any) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#009AFF]/50"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#009AFF]/50 cursor-pointer"
      >
        {(options ?? []).map((o: any) => <option key={o} value={o} className="bg-[#0b0e14]">{o}</option>)}
      </select>
    </div>
  );
}
