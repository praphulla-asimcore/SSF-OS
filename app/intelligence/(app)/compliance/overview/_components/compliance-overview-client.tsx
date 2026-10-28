'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, AlertTriangle, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = { acceptance: 'Accept', pre_production: 'Pre-Prod', shoot_authorization: 'Shoot', post_production_qc: 'Post-QC', closure: 'Close' };
const STATUS_COLORS: Record<string, string> = { not_started: 'bg-white/10 text-white/40', in_progress: 'bg-blue-500/20 text-blue-400', pending_review: 'bg-amber-500/20 text-amber-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400', blocked: 'bg-red-600/30 text-red-500' };

export function ComplianceOverviewClient() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/intelligence/compliance/overview').then(r => r.json()).then(setData).catch(() => {}); }, []);

  const kpis = [
    { label: 'High-Risk Issues', value: data?.highRiskIssues ?? 0, icon: AlertTriangle, color: '#ef4444' },
    { label: 'Overdue Controls', value: data?.overdueControls ?? 0, icon: Clock, color: '#f59e0b' },
    { label: 'Pending Approvals', value: data?.pendingApprovals ?? 0, icon: CheckCircle, color: '#009AFF' },
    { label: 'Upcoming Obligations', value: data?.upcomingObligations ?? 0, icon: Shield, color: '#A19AD3' },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Eye className="w-6 h-6 text-[#FF9149]" /> Compliance Overview</h1>
      <p className="text-white/40 text-sm mt-1">Open issues, overdue controls, and project readiness</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg" style={{ backgroundColor: `${k.color}15` }}><Icon className="w-4 h-4" style={{ color: k.color }} /></div>
                <span className="text-white/40 text-xs">{k.label}</span></div>
              <p className="text-2xl font-bold text-white">{k.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Project Readiness Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Project Stage Gate Readiness</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-white/40">
              <th className="text-left py-2 px-3">Project</th>
              <th className="text-left py-2 px-3">State</th>
              {Object.values(STAGE_LABELS).map(l => <th key={l} className="text-center py-2 px-3">{l}</th>)}
            </tr></thead>
            <tbody>
              {(data?.readinessGrid ?? []).map((p: any) => (
                <tr key={p?.id} className="border-b border-white/5">
                  <td className="py-2 px-3 text-white font-medium">{p?.title}</td>
                  <td className="py-2 px-3"><span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">{p?.state?.replace(/_/g, ' ')}</span></td>
                  {Object.keys(STAGE_LABELS).map(sk => {
                    const s = p?.stages?.[sk];
                    return (
                      <td key={sk} className="py-2 px-3 text-center">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_COLORS[s?.status] ?? 'bg-white/5 text-white/20'}`}>
                          {s?.pct ?? 0}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recent Issues */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> Recent Issues</h2>
        <div className="space-y-2">
          {(data?.recentIssues ?? []).map((issue: any) => (
            <div key={issue?.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <span className={`w-2 h-2 rounded-full ${issue?.severity === 'critical' ? 'bg-red-500' : issue?.severity === 'high' ? 'bg-orange-400' : 'bg-amber-400'}`} />
              <span className="text-white/80 text-sm flex-1">{issue?.title}</span>
              <span className="text-white/30 text-xs">{issue?.project?.title ?? ''}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${issue?.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{issue?.severity}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
