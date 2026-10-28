'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Receipt, CreditCard, Activity,
  AlertTriangle, Building2, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

function fmtIDR(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)}M`;
  return `${sign}Rp ${abs.toFixed(0)}`;
}

export function CfoOverviewClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/intelligence/cfo/overview')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpis = data?.kpis ?? {};
  const riskQueue = data?.riskQueue ?? [];

  const cards = [
    { label: 'Revenue Pipeline', value: fmtIDR(kpis?.revenuePipeline ?? 0), icon: TrendingUp, color: '#009AFF' },
    { label: 'Gross Profit', value: fmtIDR(kpis?.grossProfit ?? 0), icon: DollarSign, color: (kpis?.grossProfit ?? 0) >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'Total AR', value: fmtIDR(kpis?.totalAR ?? 0), icon: Receipt, color: '#D8FF36' },
    { label: 'Total AP', value: fmtIDR(kpis?.totalAP ?? 0), icon: CreditCard, color: '#FF9149' },
    { label: 'Active Productions', value: String(kpis?.activeProductions ?? 0), icon: Activity, color: '#009AFF' },
    { label: 'Projects at Risk', value: String(kpis?.projectsAtRisk ?? 0), icon: AlertTriangle, color: (kpis?.projectsAtRisk ?? 0) > 0 ? '#ef4444' : '#22c55e' },
    { label: 'Entities', value: String(kpis?.entityCount ?? 0), icon: Building2, color: '#A19AD3' },
    { label: 'Cash Position', value: fmtIDR(kpis?.cashPosition ?? 0), icon: DollarSign, color: (kpis?.cashPosition ?? 0) >= 0 ? '#22c55e' : '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CFO Overview</h1>
          <p className="text-white/40 text-sm mt-1">Financial intelligence at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Data as of: {data?.dataFreshness ? new Date(data.dataFreshness).toLocaleString('en-US', { timeZone: 'UTC' }) : '—'}</span>
          <span className="ml-1 text-white/20">| IDR equivalent</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${card.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-white/40 text-xs">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{loading ? '—' : card.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Production Risk Queue */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" /> Production Risk Queue
        </h2>
        {riskQueue.length === 0 ? (
          <p className="text-white/40 text-sm">No projects at risk — all within thresholds.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="text-left py-2 px-3">Project</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="text-right py-2 px-3">EFC</th>
                  <th className="text-right py-2 px-3">Margin</th>
                  <th className="text-right py-2 px-3">Variance</th>
                  <th className="text-left py-2 px-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {riskQueue.map((r: any) => (
                  <tr key={r?.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-white font-medium">{r?.title ?? r?.projectCode}</td>
                    <td className="py-2 px-3 text-right text-white/60">{fmtIDR(r?.revenue ?? 0)}</td>
                    <td className="py-2 px-3 text-right text-white/60">{fmtIDR(r?.efc ?? 0)}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`${(r?.marginPct ?? 0) < 15 ? 'text-red-400' : 'text-green-400'}`}>
                        {r?.marginPct != null ? `${(r.marginPct).toFixed(1)}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`flex items-center justify-end gap-1 ${(r?.variancePct ?? 0) > 5 ? 'text-red-400' : 'text-white/60'}`}>
                        {(r?.variancePct ?? 0) > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(r?.variancePct ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-amber-400 text-xs">{r?.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
