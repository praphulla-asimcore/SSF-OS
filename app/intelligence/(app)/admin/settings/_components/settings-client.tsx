'use client';
import { motion } from 'framer-motion';
import { Lock, Bell, Database, Shield } from 'lucide-react';

const SETTINGS = [
  { icon: Shield, label: 'Cost Overrun Threshold', value: '5%', desc: 'Alert when EAC exceeds budget by this percentage' },
  { icon: Bell, label: 'Notifications', value: 'Enabled', desc: 'Email alerts for overdue controls and risk events' },
  { icon: Database, label: 'Data Retention', value: 'TBD', desc: 'Configurable after legal review' },
  { icon: Lock, label: 'MFA Requirement', value: 'Admin roles', desc: 'Multi-factor authentication for privileged roles' },
];

export function SettingsClient() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Lock className="w-6 h-6 text-[#A19AD3]" /> Settings</h1>
      <p className="text-white/40 text-sm mt-1">Platform configuration and thresholds</p></div>

      <div className="space-y-3">
        {SETTINGS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-[#A19AD3]/10"><Icon className="w-5 h-5 text-[#A19AD3]" /></div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{s.label}</h3>
                <p className="text-white/40 text-sm">{s.desc}</p>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm">{s.value}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
