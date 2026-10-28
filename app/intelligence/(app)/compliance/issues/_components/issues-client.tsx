'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, ChevronDown, ChevronRight } from 'lucide-react';

const SEV_COLORS: Record<string, string> = { critical: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-blue-500/20 text-blue-400' };
const STATUS_COLORS: Record<string, string> = { open: 'bg-red-500/20 text-red-400', in_progress: 'bg-amber-500/20 text-amber-400', resolved: 'bg-green-500/20 text-green-400', closed: 'bg-white/10 text-white/40' };

export function IssuesClient() {
  const [issues, setIssues] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string>('');
  useEffect(() => { fetch('/api/intelligence/compliance/issues').then(r => r.json()).then(d => setIssues(d ?? [])).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-[#FF9149]" /> Issues & Corrective Actions</h1>
        <p className="text-white/40 text-sm mt-1">Track, resolve and verify issues across projects</p></div>
      </div>

      <div className="space-y-3">
        {issues.map((issue: any, i: number) => (
          <motion.div key={issue?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(expanded === issue?.id ? '' : issue?.id)} className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02]">
              {expanded === issue?.id ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
              <span className={`w-2 h-2 rounded-full ${issue?.severity === 'critical' ? 'bg-red-500' : issue?.severity === 'high' ? 'bg-orange-400' : 'bg-amber-400'}`} />
              <span className="text-white font-medium text-sm flex-1 text-left">{issue?.title}</span>
              <span className="text-white/20 text-xs">{issue?.project?.title ?? ''}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${SEV_COLORS[issue?.severity] ?? ''}`}>{issue?.severity}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[issue?.status] ?? ''}`}>{issue?.status?.replace(/_/g, ' ')}</span>
            </button>
            {expanded === issue?.id && (
              <div className="border-t border-white/10 p-4">
                <p className="text-white/60 text-sm mb-3">{issue?.description || 'No description'}</p>
                <div className="flex gap-4 text-xs text-white/30">
                  <span>Owner: {issue?.ownerUser || '—'}</span>
                  <span>Due: {issue?.dueAt ? new Date(issue.dueAt).toLocaleDateString('en-GB') : '—'}</span>
                  <span>Entity: {issue?.entity?.code ?? ''}</span>
                </div>
                {(issue?.correctiveActions ?? []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-white/40 text-xs font-medium">Corrective Actions:</p>
                    {issue.correctiveActions.map((ca: any) => (
                      <div key={ca?.id} className="flex items-center gap-2 p-2 rounded bg-white/[0.02] text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${ca?.status === 'completed' || ca?.status === 'verified' ? 'bg-green-400' : 'bg-amber-400'}`} />
                        <span className="text-white/70 flex-1">{ca?.action}</span>
                        <span className="text-white/30 text-xs">{ca?.ownerUser}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${ca?.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{ca?.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
