'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, ArrowLeft, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/budget', icon: LayoutDashboard },
  { label: 'All Jobs', href: '/budget/jobs', icon: List },
];

const ROLES = ['Producer', 'Finance', 'Admin'];

export function BudgetShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState('Admin');

  return (
    <div className="min-h-screen bg-[#05070c]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Image src="/brand/ssf-wordmark.png" alt="Seven Sunday Films" width={170} height={10} className="h-5 w-auto" />
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-white/90 font-medium text-sm">Job Budget & Cost Control</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/budget'
                ? pathname === '/budget'
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-[#009AFF]/15 text-[#009AFF]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="h-5 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <User className="w-3.5 h-3.5" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-transparent text-white/60 text-xs border-none outline-none cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#0b0e14]">{r}</option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
