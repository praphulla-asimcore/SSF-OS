'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, ChevronDown, ChevronRight, Shield, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const STAGE_LABELS: Record<string, string> = { acceptance: 'Project Acceptance', pre_production: 'Pre-Production', shoot_authorization: 'Shoot Authorization', post_production_qc: 'Post-Production QC', closure: 'Project Closure' };
const STATUS_COLORS: Record<string, string> = { not_started: 'border-white/20 text-white/40', in_progress: 'border-blue-400 text-blue-400', pending_review: 'border-amber-400 text-amber-400', approved: 'border-green-400 text-green-400', rejected: 'border-red-400 text-red-400', blocked: 'border-red-500 text-red-500' };
const CTRL_COLORS: Record<string, string> = { pending: 'text-white/40', evidence_submitted: 'text-amber-400', verified: 'text-green-400', rejected: 'text-red-400', waived: 'text-blue-400', overdue: 'text-red-500' };

export function StageGatesClient() {
  const [stages, setStages] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string>('');
  const [acting, setActing] = useState(false);

  function load() { fetch('/api/intelligence/compliance/stage-gates').then(r => r.json()).then(d => setStages(d ?? [])).catch(() => {}); }
  useEffect(() => { load(); }, []);

  // Group by project
  const projectMap: Record<string, any> = {};
  for (const s of stages) {
    const pid = s?.project?.id ?? s?.projectId;
    if (!projectMap[pid]) projectMap[pid] = { project: s?.project, stages: [] };
    projectMap[pid].stages.push(s);
  }

  async function doAction(action: string, stageId?: string, controlId?: string) {
    setActing(true);
    try {
      const res = await fetch('/api/intelligence/compliance/stage-gates', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, stageId, controlId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Action failed'); }
      else { toast.success('Action completed'); load(); }
    } catch { toast.error('Network error'); }
    setActing(false);
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><CheckSquare className="w-6 h-6 text-[#FF9149]" /> Stage Gates</h1>
      <p className="text-white/40 text-sm mt-1">Control verification, evidence and gate approvals by project</p></div>

      {Object.entries(projectMap).map(([pid, pData]: any) => (
        <motion.div key={pid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
          <button onClick={() => setExpanded(expanded === pid ? '' : pid)} className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors">
            {expanded === pid ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
            <span className="text-white font-medium">{pData?.project?.title ?? pid}</span>
            <span className="text-white/30 text-xs">{pData?.project?.projectCode}</span>
            <div className="flex-1" />
            <div className="flex gap-1">
              {(pData?.stages ?? []).sort((a: any, b: any) => Object.keys(STAGE_LABELS).indexOf(a?.stageKey) - Object.keys(STAGE_LABELS).indexOf(b?.stageKey)).map((s: any) => (
                <span key={s?.id} className={`w-3 h-3 rounded-full border-2 ${STATUS_COLORS[s?.status]?.split(' ')[0] ?? 'border-white/20'}`} title={`${STAGE_LABELS[s?.stageKey] ?? s?.stageKey}: ${s?.status}`} />
              ))}
            </div>
          </button>

          {expanded === pid && (
            <div className="border-t border-white/10 p-4 space-y-4">
              {(pData?.stages ?? []).sort((a: any, b: any) => Object.keys(STAGE_LABELS).indexOf(a?.stageKey) - Object.keys(STAGE_LABELS).indexOf(b?.stageKey)).map((stage: any) => (
                <div key={stage?.id} className="bg-white/[0.02] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-4 h-4 text-[#FF9149]" />
                    <span className="text-white font-medium">{STAGE_LABELS[stage?.stageKey] ?? stage?.stageKey}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[stage?.status]?.split(' ').map((c: string) => c.replace('border-', 'bg-').replace(/\/(\d+)/, '/$1')).join(' ') ?? 'bg-white/10 text-white/40'}`}>{stage?.status?.replace(/_/g, ' ')}</span>
                    <div className="flex-1" />
                    {stage?.status !== 'approved' && (
                      <button onClick={() => doAction('approve_gate', stage?.id)} disabled={acting} className="px-3 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors">Approve Gate</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(stage?.controls ?? []).map((ctrl: any) => (
                      <div key={ctrl?.id} className="flex items-center gap-3 p-2 rounded bg-white/[0.02]">
                        <span className={`w-1.5 h-1.5 rounded-full ${ctrl?.controlTemplate?.mandatory ? 'bg-red-400' : 'bg-white/20'}`} title={ctrl?.controlTemplate?.mandatory ? 'Mandatory' : 'Optional'} />
                        <span className="text-white/70 text-sm flex-1">{ctrl?.controlTemplate?.title ?? 'Control'}</span>
                        <span className={`text-xs ${CTRL_COLORS[ctrl?.status] ?? 'text-white/30'}`}>{ctrl?.status?.replace(/_/g, ' ')}</span>
                        {ctrl?.status === 'evidence_submitted' && (
                          <div className="flex gap-1">
                            <button onClick={() => doAction('verify_control', undefined, ctrl?.id)} disabled={acting} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"><Check className="w-3 h-3" /></button>
                            <button onClick={() => doAction('reject_control', undefined, ctrl?.id)} disabled={acting} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
