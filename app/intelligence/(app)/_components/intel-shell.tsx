'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Brain, Shield, Settings, ChevronDown,
  DollarSign, Search, MessageSquare, BookOpen,
  Lightbulb, Eye, CheckSquare, AlertTriangle,
  Calendar, ClipboardList, Building2, Lock, LogOut,
  Menu, X, Cpu, TrendingUp, Receipt, CreditCard,
  Database, FileBarChart, Home, FileText, Users
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    id: 'cfo', label: 'CFO', icon: BarChart3, color: '#009AFF',
    items: [
      { href: '/intelligence/cfo/overview', label: 'Overview', icon: Home },
      { href: '/intelligence/cfo/profitability', label: 'Profitability', icon: TrendingUp },
      { href: '/intelligence/cfo/cash-intelligence', label: 'Cash Intelligence', icon: DollarSign },
      { href: '/intelligence/cfo/receivables', label: 'Receivables', icon: Receipt },
      { href: '/intelligence/cfo/payables', label: 'Payables', icon: CreditCard },
      { href: '/intelligence/cfo/data-quality', label: 'Data Quality', icon: Database },
      { href: '/intelligence/cfo/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
  {
    id: 'knowledge', label: 'Knowledge', icon: Brain, color: '#D8FF36',
    items: [
      { href: '/intelligence/knowledge/search', label: 'Search', icon: Search },
      { href: '/intelligence/knowledge/chat', label: 'Chat Assistant', icon: MessageSquare },
      { href: '/intelligence/knowledge/library', label: 'Library', icon: BookOpen },
      { href: '/intelligence/knowledge/lessons', label: 'Lessons Learned', icon: Lightbulb },
    ],
  },
  {
    id: 'compliance', label: 'Compliance', icon: Shield, color: '#FF9149',
    items: [
      { href: '/intelligence/compliance/overview', label: 'Overview', icon: Eye },
      { href: '/intelligence/compliance/stage-gates', label: 'Stage Gates', icon: CheckSquare },
      { href: '/intelligence/compliance/control-library', label: 'Control Library', icon: ClipboardList },
      { href: '/intelligence/compliance/issues', label: 'Issues', icon: AlertTriangle },
      { href: '/intelligence/compliance/obligations', label: 'Obligations', icon: Calendar },
      { href: '/intelligence/compliance/audit', label: 'Audit Trail', icon: FileText },
    ],
  },
  {
    id: 'admin', label: 'Admin', icon: Settings, color: '#A19AD3',
    items: [
      { href: '/intelligence/admin/entities', label: 'Entities', icon: Building2 },
      { href: '/intelligence/admin/users', label: 'Users & Roles', icon: Users },
      { href: '/intelligence/admin/settings', label: 'Settings', icon: Lock },
    ],
  },
];

interface ShellProps {
  user: { name?: string | null; email?: string | null; role: string };
  children: React.ReactNode;
}

export function IntelShell({ user, children }: ShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string>('');
  const [entityId, setEntityId] = useState('all');
  const [entities, setEntities] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/intelligence/entities')
      .then((r) => r.json())
      .then((d) => setEntities(d ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const section = NAV_SECTIONS.find((s) => pathname?.includes?.(`/intelligence/${s.id}`));
    if (section) setExpanded(section.id);
  }, [pathname]);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 mb-3">
          <Image src="/brand/ssf-logo.png" alt="SSF" width={120} height={30} className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#009AFF]" />
          <span className="text-sm font-semibold text-white">IntelligenceOS</span>
          <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">DEMO</span>
        </div>
      </div>

      <div className="p-3 border-b border-white/10">
        <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">Entity</label>
        <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#009AFF]/50">
          <option value="all">All Entities</option>
          {(entities ?? []).map((ent: any) => (
            <option key={ent?.id} value={ent?.id}>{ent?.name ?? 'Unknown'} ({ent?.functionalCurrency ?? ''})</option>
          ))}
        </select>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_SECTIONS.map((section) => {
          const SIcon = section.icon;
          const isExpanded = expanded === section.id;
          return (
            <div key={section.id}>
              <button onClick={() => setExpanded(isExpanded ? '' : section.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isExpanded ? 'bg-white/5 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                <SIcon className="w-4 h-4" style={{ color: section.color }} />
                <span>{section.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="ml-4 mt-1 space-y-0.5">
                      {section.items.map((item) => {
                        const IIcon = item.icon;
                        const active = pathname === item.href;
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${active ? 'bg-[#009AFF]/10 text-[#009AFF]' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                            <IIcon className="w-3.5 h-3.5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#009AFF]/20 flex items-center justify-center text-[#009AFF] text-xs font-bold">
            {(user?.name ?? user?.email ?? 'U')[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
          <button onClick={() => signOut({ redirectTo: '/intelligence/login' })} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen animated-bg flex">
      <aside className={`hidden lg:flex flex-col glass-strong border-r border-white/10 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'}`}>
        {sidebar}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 bottom-0 w-60 z-50 glass-strong border-r border-white/10 lg:hidden">
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="glass-strong border-b border-white/10 px-4 py-2.5 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 1024) setMobileOpen(!mobileOpen); else setSidebarOpen(!sidebarOpen); }} className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">DEMO DATA</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
