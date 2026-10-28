'use client';
import { motion } from 'framer-motion';
import { FileBarChart, Download, Calendar } from 'lucide-react';

const REPORTS = [
  { name: 'Production Profitability Summary', desc: 'EAC margin analysis across all active projects', type: 'profitability' },
  { name: 'Cash Flow Forecast', desc: '13-week rolling forecast with scenario analysis', type: 'cash-forecast' },
  { name: 'AR Aging Report', desc: 'Receivables aging buckets and top balances', type: 'ar-aging' },
  { name: 'AP Aging Report', desc: 'Payables aging with vendor exposure', type: 'ap-aging' },
  { name: 'Data Quality Summary', desc: 'Outstanding exceptions and resolution status', type: 'data-quality' },
];

export function ReportsClient() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileBarChart className="w-6 h-6 text-[#009AFF]" /> Reports</h1>
      <p className="text-white/40 text-sm mt-1">Exportable management reports with data lineage</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r, i) => (
          <motion.div key={r.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-6 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">{r.name}</h3>
                <p className="text-white/40 text-sm">{r.desc}</p>
              </div>
              <button className="p-2 rounded-lg bg-[#009AFF]/10 text-[#009AFF] hover:bg-[#009AFF]/20 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-4 text-white/20 text-xs">
              <Calendar className="w-3 h-3" /> Period: Current Month | Last generated: DEMO
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
