'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, ArrowUpDown, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';
import { toast } from 'sonner';
import { JobFormModal } from './job-form-modal';

interface Job {
  id: string;
  name: string;
  client: string;
  status: string;
  office: string;
  director: string;
  currency: string;
  awardedValue: number;
  approvedBudget: number;
  forecastCost: number;
  exchangeRate: number;
  startDate: string | null;
  endDate: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  'Pitching': 'bg-blue-500/20 text-blue-300',
  'Awarded': 'bg-amber-500/20 text-amber-300',
  'In Production': 'bg-emerald-500/20 text-emerald-300',
  'Delivered': 'bg-purple-500/20 text-purple-300',
  'Closed': 'bg-white/10 text-white/40',
};

const OFFICES = ['All', 'Jakarta', 'Singapore', 'KL'];
const STATUSES = ['All', 'Pitching', 'Awarded', 'In Production', 'Delivered', 'Closed'];

export function JobsListClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'awardedValue' | 'name'>('awardedValue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);

  const fetchJobs = () => {
    setLoading(true);
    fetch('/api/budget/jobs')
      .then((r) => r.json())
      .then((d: any) => setJobs(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const filtered = useMemo(() => {
    let list = [...(jobs ?? [])];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((j: any) =>
        (j?.name ?? '').toLowerCase().includes(s) ||
        (j?.client ?? '').toLowerCase().includes(s) ||
        (j?.director ?? '').toLowerCase().includes(s)
      );
    }
    if (officeFilter !== 'All') list = list.filter((j: any) => j?.office === officeFilter);
    if (statusFilter !== 'All') list = list.filter((j: any) => j?.status === statusFilter);
    list.sort((a: any, b: any) => {
      const aVal = a?.[sortField] ?? 0;
      const bVal = b?.[sortField] ?? 0;
      return sortDir === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });
    return list;
  }, [jobs, search, officeFilter, statusFilter, sortField, sortDir]);

  const marginPct = (j: any) => {
    const awarded = j?.awardedValue ?? 0;
    const forecast = j?.forecastCost ?? 0;
    if (awarded === 0) return 0;
    return ((awarded - forecast) / awarded) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">All Jobs</h1>
          <p className="text-white/40 text-sm mt-1">Manage production jobs across all offices</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#009AFF] text-[#05070c] rounded-lg font-medium text-sm hover:bg-[#4FB8FF] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search jobs, clients, directors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#009AFF]/50"
          />
        </div>
        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 focus:outline-none cursor-pointer"
        >
          {OFFICES.map((o) => <option key={o} value={o} className="bg-[#0b0e14]">{o === 'All' ? 'All Offices' : o}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 focus:outline-none cursor-pointer"
        >
          {STATUSES.map((s) => <option key={s} value={s} className="bg-[#0b0e14]">{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Job</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Office</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-white/60"
                  onClick={() => { setSortField('awardedValue'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}
                >
                  <span className="flex items-center justify-end gap-1">Awarded <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Budget</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Forecast</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">No jobs found</td></tr>
              ) : (
                filtered.map((job: any, i: number) => {
                  const m = marginPct(job);
                  return (
                    <motion.tr
                      key={job?.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => { window.location.href = `/budget/jobs/${job?.id}`; }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-white/90 font-medium">{job?.name ?? ''}</p>
                        <p className="text-white/30 text-xs">{job?.client ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job?.status ?? ''] ?? 'bg-white/10 text-white/40'}`}>
                          {job?.status ?? ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-white/50 text-xs">
                          <MapPin className="w-3 h-3" /> {job?.office ?? ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white/70">{formatCurrency(job?.awardedValue ?? 0, job?.currency ?? 'IDR')}</td>
                      <td className="px-4 py-3 text-right font-mono text-white/50">{formatCurrency(job?.approvedBudget ?? 0, job?.currency ?? 'IDR')}</td>
                      <td className="px-4 py-3 text-right font-mono text-white/50">{formatCurrency(job?.forecastCost ?? 0, job?.currency ?? 'IDR')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-sm ${m >= 15 ? 'text-emerald-400' : m >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                          {m.toFixed(1)}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <JobFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchJobs(); toast.success('Job created'); }}
        />
      )}
    </div>
  );
}
