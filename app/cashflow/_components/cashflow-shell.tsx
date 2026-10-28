'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, TableProperties, BarChart3 } from 'lucide-react';
import Image from 'next/image';

const TABS = [
  { label: 'Ledger', href: '/cashflow', icon: TableProperties },
  { label: 'Dashboard', href: '/cashflow/dashboard', icon: BarChart3 },
];

export function CashflowShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#05070c]">
      <header className="sticky top-0 z-50 glass-strong">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Image src="/brand/ssf-wordmark.png" alt="Seven Sunday Films" width={170} height={10} className="h-5 w-auto" />
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-white/90 font-medium text-sm">Cash-Flow Planner</span>
          </div>
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = tab.href === '/cashflow'
                ? pathname === '/cashflow'
                : pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-[#009AFF]/15 text-[#009AFF]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
