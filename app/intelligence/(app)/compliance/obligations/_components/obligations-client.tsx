'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { upcoming: 'bg-blue-500/20 text-blue-400', overdue: 'bg-red-500/20 text-red-400', completed: 'bg-green-500/20 text-green-400' };
const CAT_COLORS: Record<string, string> = { contractual: 'text-[#009AFF]', tax: 'text-amber-400', filing: 'text-purple-400', insurance: 'text-green-400', regulatory: 'text-red-400' };

export function ObligationsClient() {
  const [obligations, setObligations] = useState<any[]>([]);
  useEffect(() => { fetch('/api/intelligence/compliance/obligations').then(r => r.json()).then(d => setObligations(d ?? [])).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Calendar className="w-6 h-6 text-[#FF9149]" /> Obligations Calendar</h1>
      <p className="text-white/40 text-sm mt-1">Contractual, tax, filing and insurance deadlines</p></div>

      <div className="space-y-3">
        {obligations.map((ob: any, i: number) => {
          const daysUntil = Math.ceil(((new Date(ob?.dueAt))?.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <motion.div key={ob?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="text-center min-w-[60px]">
                <p className="text-2xl font-bold text-white">{new Date(ob?.dueAt).getDate()}</p>
                <p className="text-white/40 text-xs">{new Date(ob?.dueAt).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</p>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium text-sm">{ob?.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs ${CAT_COLORS[ob?.category] ?? 'text-white/30'}`}>{ob?.category}</span>
                  <span className="text-white/20 text-xs">{ob?.entity?.code ?? ''} · {ob?.jurisdiction}</span>
                  <span className="text-white/20 text-xs">Owner: {ob?.ownerUser || '—'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[ob?.status] ?? ''}`}>{ob?.status}</span>
                <p className={`text-xs mt-1 ${daysUntil < 0 ? 'text-red-400' : daysUntil < 7 ? 'text-amber-400' : 'text-white/30'}`}>
                  {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Due today' : `${daysUntil}d remaining`}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
