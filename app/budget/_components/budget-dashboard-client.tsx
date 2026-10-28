'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, TrendingUp, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

interface JobSummary {
  id: string;
  name: string;
  client: string;
  status: string;
  office: string;
  currency: string;
  awardedValue: number;
  approvedBudget: number;
  forecastCost: number;
}

interface DashboardData {
  jobs: JobSummary[];
  totalJobs: number;
  totalAwarded: number;
  totalBudget: number;
  blendedMargin: number;
  statusCounts: Record<string, number>;
}

export function BudgetDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/budget/dashboard')
      .then((r) => r.json())
      .then((d: any) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="glass rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-white/50">Failed to load dashboard data.</p>;

  const statuses = ['Pitching', 'Awarded', 'In Production', 'Delivered', 'Closed'];
  const topJobs = [...(data?.jobs ?? [])]
    .sort((a: any, b: any) => (b?.awardedValue ?? 0) - (a?.awardedValue ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Budget Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Overview of all production jobs and financial health</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Briefcase} label="Total Jobs" value={String(data?.totalJobs ?? 0)} delay={0} />
        <KPICard icon={DollarSign} label="Total Awarded" value={formatCurrency(data?.totalAwarded ?? 0, 'IDR')} delay={0.1} />
        <KPICard icon={TrendingUp} label="Total Budget" value={formatCurrency(data?.totalBudget ?? 0, 'IDR')} delay={0.2} />
        <KPICard icon={Percent} label="Blended Margin" value={`${(data?.blendedMargin ?? 0).toFixed(1)}%`} delay={0.3} positive={(data?.blendedMargin ?? 0) > 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-sm font-medium text-white/60 mb-4">Pipeline by Status</h3>
          <div className="space-y-3">
            {statuses.map((s) => {
              const count = data?.statusCounts?.[s] ?? 0;
              const total = data?.totalJobs ?? 1;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-28 truncate">{s}</span>
                  <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-[#009AFF] to-[#4FB8FF] rounded-full flex items-center justify-end pr-2"
                    >
                      {pct > 15 && <span className="text-[10px] font-medium text-[#05070c]">{count}</span>}
                    </motion.div>
                  </div>
                  {pct <= 15 && <span className="text-xs text-white/40">{count}</span>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Jobs by Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-sm font-medium text-white/60 mb-4">Top Jobs by Awarded Value</h3>
          <div className="space-y-2">
            {topJobs.map((job: any, i: number) => (
              <Link
                key={job?.id}
                href={`/budget/jobs/${job?.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#009AFF] text-xs font-mono w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm text-white/80 group-hover:text-[#009AFF] transition-colors">{job?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-white/30">{job?.client ?? ''}</p>
                  </div>
                </div>
                <span className="text-sm font-mono text-[#009AFF]">
                  {formatCurrency(job?.awardedValue ?? 0, job?.currency ?? 'IDR')}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, delay, positive }: {
  icon: any; label: string; value: string; delay: number; positive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#009AFF]" />
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {positive !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{positive ? 'Healthy' : 'At risk'}</span>
        </div>
      )}
    </motion.div>
  );
}
