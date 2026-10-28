'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, ArrowUpDown } from 'lucide-react';

function fmtIDR(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)}M`;
  return `${sign}Rp ${abs.toFixed(0)}`;
}

const RAG_COLORS = { green: 'bg-green-500/20 text-green-400', amber: 'bg-amber-500/20 text-amber-400', red: 'bg-red-500/20 text-red-400' };

export function ProfitabilityClient() {
  const [data, setData] = useState<any>(null);
  const [sortKey, setSortKey] = useState('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetch('/api/intelligence/cfo/profitability').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const projects = [...(data?.projects ?? [])].sort((a: any, b: any) => {
    const av = a?.[sortKey] ?? 0;
    const bv = b?.[sortKey] ?? 0;
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const columns = [
    { key: 'title', label: 'Project' },
    { key: 'client', label: 'Client' },
    { key: 'state', label: 'State' },
    { key: 'contractedRevenue', label: 'Revenue' },
    { key: 'approvedBudget', label: 'Budget' },
    { key: 'actualCost', label: 'Actual' },
    { key: 'openCommitments', label: 'Open Comm.' },
    { key: 'costToComplete', label: 'CTC' },
    { key: 'efc', label: 'EFC' },
    { key: 'marginPct', label: 'Margin %' },
    { key: 'variancePct', label: 'Var %' },
    { key: 'rag', label: 'RAG' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-6 h-6 text-[#009AFF]" /> Production Profitability</h1>
          <p className="text-white/40 text-sm mt-1">EAC margin analysis across all projects (IDR equivalent)</p>
        </div>
        <div className="flex items-center gap-2 text-white/30 text-xs"><Clock className="w-3.5 h-3.5" /> {data?.dataAsOf ? new Date(data.dataAsOf).toLocaleString('en-US', { timeZone: 'UTC' }) : ''}</div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} className="text-left py-3 px-3 text-white/40 font-medium cursor-pointer hover:text-white/60 whitespace-nowrap">
                    <span className="flex items-center gap-1">{col.label} <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any, i: number) => (
                <tr key={p?.id ?? i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-white font-medium">{p?.title}</td>
                  <td className="py-2.5 px-3 text-white/60">{p?.client}</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/60">{p?.state?.replace(/_/g, ' ')}</span></td>
                  <td className="py-2.5 px-3 text-right text-white/70">{fmtIDR(p?.contractedRevenue ?? 0)}</td>
                  <td className="py-2.5 px-3 text-right text-white/70">{fmtIDR(p?.approvedBudget ?? 0)}</td>
                  <td className="py-2.5 px-3 text-right text-white/70">{fmtIDR(p?.actualCost ?? 0)}</td>
                  <td className="py-2.5 px-3 text-right text-white/70">{fmtIDR(p?.openCommitments ?? 0)}</td>
                  <td className="py-2.5 px-3 text-right text-white/70">{fmtIDR(p?.costToComplete ?? 0)}</td>
                  <td className="py-2.5 px-3 text-right text-white font-medium">{fmtIDR(p?.efc ?? 0)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={p?.marginPct != null ? ((p.marginPct) < 15 ? 'text-red-400' : (p.marginPct) < 25 ? 'text-amber-400' : 'text-green-400') : 'text-white/30'}>
                      {p?.marginPct != null ? `${p.marginPct.toFixed(1)}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={(p?.variancePct ?? 0) > 5 ? 'text-red-400' : (p?.variancePct ?? 0) > 2 ? 'text-amber-400' : 'text-white/60'}>
                      {(p?.variancePct ?? 0) > 0 ? '+' : ''}{(p?.variancePct ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${RAG_COLORS[p?.rag as keyof typeof RAG_COLORS] ?? 'bg-white/10 text-white/40'}`}>
                      {(p?.rag ?? 'N/A').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
