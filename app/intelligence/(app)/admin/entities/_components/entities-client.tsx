'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, DollarSign, Clock } from 'lucide-react';

export function EntitiesClient() {
  const [entities, setEntities] = useState<any[]>([]);
  useEffect(() => { fetch('/api/intelligence/entities').then(r => r.json()).then(d => setEntities(d ?? [])).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-[#A19AD3]" /> Legal Entities</h1>
      <p className="text-white/40 text-sm mt-1">Manage entity configuration</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map((e: any, i: number) => (
          <motion.div key={e?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{e?.name}</h3>
                <span className="text-[#009AFF] font-mono text-sm">{e?.code}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${e?.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{e?.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/50"><Globe className="w-4 h-4" /> {e?.jurisdiction || 'N/A'}</div>
              <div className="flex items-center gap-2 text-sm text-white/50"><DollarSign className="w-4 h-4" /> {e?.functionalCurrency}</div>
              <div className="flex items-center gap-2 text-sm text-white/50"><Clock className="w-4 h-4" /> {e?.timezone}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
