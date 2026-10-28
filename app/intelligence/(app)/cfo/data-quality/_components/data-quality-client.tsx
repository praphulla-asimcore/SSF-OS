'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const SEV_CONFIG: Record<string, any> = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  error: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  warning: { icon: Info, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  info: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

export function DataQualityClient() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/intelligence/cfo/data-quality').then(r => r.json()).then(setData).catch(() => {}); }, []);
  const exceptions = data?.exceptions ?? [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Database className="w-6 h-6 text-[#009AFF]" /> Data Quality</h1>
      <p className="text-white/40 text-sm mt-1">Exceptions, unmatched records and data gaps</p></div>

      {exceptions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white/60">No outstanding data quality exceptions</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {exceptions.map((ex: any, i: number) => {
            const cfg = SEV_CONFIG[ex?.severity] ?? SEV_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <motion.div key={ex?.id ?? i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl p-4 flex items-start gap-4">
                <div className={`p-2 rounded-lg ${cfg.bg}`}><Icon className={`w-5 h-5 ${cfg.color}`} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase ${cfg.color}`}>{ex?.severity}</span>
                    <span className="text-white/20">|</span>
                    <span className="text-white/40 text-xs">{ex?.source}</span>
                    {ex?.objectRef && <span className="text-white/20 text-xs">#{ex.objectRef}</span>}
                  </div>
                  <p className="text-white/80 text-sm mt-1">{ex?.reason}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${ex?.resolutionStatus === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{ex?.resolutionStatus}</span>
                    <span className="text-white/20 text-xs">{ex?.createdAt ? new Date(ex.createdAt).toLocaleDateString('en-GB') : ''}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
