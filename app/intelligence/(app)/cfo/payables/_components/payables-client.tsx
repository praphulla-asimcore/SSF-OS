'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Clock } from 'lucide-react';

const BUCKET_LABELS: Record<string, string> = { notDue: 'Not Due', days1_30: '1–30 days', days31_60: '31–60 days', days61_90: '61–90 days', over90: '>90 days' };
const BUCKET_COLORS: Record<string, string> = { notDue: 'bg-green-500/20 text-green-400', days1_30: 'bg-amber-500/20 text-amber-400', days31_60: 'bg-orange-500/20 text-orange-400', days61_90: 'bg-red-500/20 text-red-400', over90: 'bg-red-600/30 text-red-500' };

function fmt(n: number, cur: string) {
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  const sym: Record<string, string> = { IDR: 'Rp', USD: '$', SGD: 'S$', GBP: '\u00a3', MYR: 'RM' };
  const s = sym[cur] ?? cur;
  if (cur === 'IDR') { if (abs >= 1e9) return `${sign}${s} ${(abs/1e9).toFixed(1)}B`; if (abs >= 1e6) return `${sign}${s} ${(abs/1e6).toFixed(0)}M`; return `${sign}${s} ${abs.toFixed(0)}`; }
  return `${sign}${s}${abs >= 1e6 ? (abs/1e6).toFixed(1) + 'M' : abs >= 1e3 ? (abs/1e3).toFixed(1) + 'K' : abs.toFixed(2)}`;
}

export function PayablesClient() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/intelligence/cfo/payables').then(r => r.json()).then(setData).catch(() => {}); }, []);

  const buckets = data?.buckets ?? {};
  const bills = data?.bills ?? [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard className="w-6 h-6 text-[#FF9149]" /> Payables (AP)</h1>
      <p className="text-white/40 text-sm mt-1">Aging, vendor exposure and upcoming disbursements</p></div>

      <div className="grid grid-cols-5 gap-3">
        {Object.entries(BUCKET_LABELS).map(([key, label]) => (
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 text-center">
            <p className="text-white/40 text-xs mb-2">{label}</p>
            <p className={`text-lg font-bold ${BUCKET_COLORS[key]?.split(' ')[1] ?? 'text-white'}`}>{fmt(buckets[key] ?? 0, 'IDR')}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-white/40">
            <th className="text-left py-3 px-3">Bill #</th><th className="text-left py-3 px-3">Vendor</th><th className="text-left py-3 px-3">Project</th>
            <th className="text-left py-3 px-3">Entity</th><th className="text-right py-3 px-3">Amount</th><th className="text-right py-3 px-3">Outstanding</th>
            <th className="text-left py-3 px-3">Due Date</th><th className="text-right py-3 px-3">Days</th><th className="text-left py-3 px-3">Bucket</th>
          </tr></thead>
          <tbody>
            {bills.map((b: any) => (
              <tr key={b?.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 px-3 text-white font-mono text-xs">{b?.billNo}</td>
                <td className="py-2 px-3 text-white/70">{b?.vendor}</td>
                <td className="py-2 px-3 text-white/50">{b?.project || '—'}</td>
                <td className="py-2 px-3 text-white/50">{b?.entity}</td>
                <td className="py-2 px-3 text-right text-white/70">{fmt(b?.amount ?? 0, b?.currency ?? 'IDR')}</td>
                <td className="py-2 px-3 text-right text-white font-medium">{fmt(b?.outstandingAmount ?? 0, b?.currency ?? 'IDR')}</td>
                <td className="py-2 px-3 text-white/50 text-xs">{b?.dueDate ? new Date(b.dueDate).toLocaleDateString('en-GB') : ''}</td>
                <td className={`py-2 px-3 text-right ${(b?.daysOverdue ?? 0) > 30 ? 'text-red-400' : (b?.daysOverdue ?? 0) > 0 ? 'text-amber-400' : 'text-green-400'}`}>{b?.daysOverdue ?? 0}</td>
                <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-xs ${BUCKET_COLORS[b?.bucket] ?? ''}`}>{BUCKET_LABELS[b?.bucket] ?? b?.bucket}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
