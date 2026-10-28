'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Filter } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = { created: 'text-green-400', updated: 'text-blue-400', approved: 'text-green-400', rejected: 'text-red-400', uploaded: 'text-[#D8FF36]', verified: 'text-green-400', chat: 'text-[#009AFF]' };

export function AuditClient() {
  const [events, setEvents] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  useEffect(() => {
    const params = filterType ? `?objectType=${filterType}` : '';
    fetch(`/api/intelligence/compliance/audit${params}`).then(r => r.json()).then(d => setEvents(d ?? [])).catch(() => {});
  }, [filterType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-6 h-6 text-[#FF9149]" /> Audit Trail</h1>
        <p className="text-white/40 text-sm mt-1">Immutable record of all changes, approvals and events</p></div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
            <option value="">All Types</option>
            {['project', 'control', 'stage', 'document', 'issue', 'approval', 'ai_query'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="px-3 py-1.5 rounded-lg bg-[#FF9149]/20 text-[#FF9149] text-sm hover:bg-[#FF9149]/30 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-white/40">
            <th className="text-left py-3 px-3">Timestamp</th>
            <th className="text-left py-3 px-3">Actor</th>
            <th className="text-left py-3 px-3">Type</th>
            <th className="text-left py-3 px-3">Action</th>
            <th className="text-left py-3 px-3">Object</th>
            <th className="text-left py-3 px-3">Project</th>
          </tr></thead>
          <tbody>
            {events.map((ev: any, i: number) => (
              <motion.tr key={ev?.id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 px-3 text-white/50 text-xs font-mono">{ev?.at ? new Date(ev.at).toLocaleString('en-GB', { timeZone: 'UTC' }) : ''}</td>
                <td className="py-2 px-3 text-white/60">{ev?.actorUserId?.slice(0, 8) ?? '—'}</td>
                <td className="py-2 px-3"><span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">{ev?.objectType}</span></td>
                <td className="py-2 px-3"><span className={`text-sm font-medium ${ACTION_COLORS[ev?.action] ?? 'text-white/60'}`}>{ev?.action}</span></td>
                <td className="py-2 px-3 text-white/40 text-xs font-mono">{ev?.objectId?.slice(0, 12) ?? ''}</td>
                <td className="py-2 px-3 text-white/40 text-xs">{ev?.project?.title ?? ''}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
