'use client';

import { AbacusDashboard, useDashboardData } from '@/components/viz/abacus-dashboard';
import { cashflowManifest } from '@/lib/cashflow-dashboard-manifest';

export default function CashflowDashboardPage() {
  const { data, dataAsOf, error } = useDashboardData('/api/cashflow/dashboard', 60_000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cash Flow Analytics</h1>
        <p className="text-white/40 text-sm mt-1">High-level insights across all accounts and entities</p>
      </div>
      <AbacusDashboard manifest={cashflowManifest} data={data} dataAsOf={dataAsOf} className="min-h-[600px]" />
    </div>
  );
}
