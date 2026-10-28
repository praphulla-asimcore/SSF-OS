'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Shield } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = { acceptance: 'Acceptance', pre_production: 'Pre-Production', shoot_authorization: 'Shoot Auth', post_production_qc: 'Post-QC', closure: 'Closure' };
const RISK_COLORS: Record<string, string> = { low: 'bg-green-500/20 text-green-400', medium: 'bg-amber-500/20 text-amber-400', high: 'bg-orange-500/20 text-orange-400', critical: 'bg-red-500/20 text-red-400' };

export function ControlLibraryClient() {
  const [controls, setControls] = useState<any[]>([]);
  useEffect(() => { fetch('/api/intelligence/compliance/controls').then(r => r.json()).then(d => setControls(d ?? [])).catch(() => {}); }, []);

  const grouped: Record<string, any[]> = {};
  for (const c of controls) { const sk = c?.stageKey ?? 'other'; if (!grouped[sk]) grouped[sk] = []; grouped[sk].push(c); }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-6 h-6 text-[#FF9149]" /> Control Library</h1>
      <p className="text-white/40 text-sm mt-1">Approved control templates by stage gate</p></div>

      {Object.entries(STAGE_LABELS).map(([sk, label]) => {
        const items = grouped[sk] ?? [];
        if (items.length === 0) return null;
        return (
          <motion.div key={sk} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#FF9149]" /> {label}</h2>
            <div className="space-y-2">
              {items.map((c: any) => (
                <div key={c?.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <span className="text-[#FF9149] font-mono text-xs w-24">{c?.controlCode}</span>
                  <span className="text-white/80 text-sm flex-1">{c?.title}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${RISK_COLORS[c?.riskLevel] ?? ''}`}>{c?.riskLevel}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${c?.mandatory ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>{c?.mandatory ? 'Mandatory' : 'Optional'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
