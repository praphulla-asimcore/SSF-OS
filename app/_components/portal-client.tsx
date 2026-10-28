'use client';

import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, ArrowRight, Cpu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function PortalClient() {
  return (
    <div className="min-h-screen animated-bg relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#009AFF] opacity-[0.03] blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#009AFF] opacity-[0.04] blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="sr-only">SSF Suite — Seven Sunday Films</h1>
          <div className="flex items-center justify-center mb-5">
            <Image src="/brand/ssf-logo.png" alt="Seven Sunday Films" width={320} height={82} priority className="h-16 md:h-20 w-auto" />
          </div>
          <p className="text-white/35 text-sm tracking-[0.35em] uppercase font-light">
            Indonesia · Singapore
          </p>
          <p className="text-white/60 text-base mt-5 max-w-md mx-auto">
            Operations Suite — financial tools for production excellence
          </p>
        </motion.div>

        {/* App Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <AppCard
            title="Job Budget & Cost Control"
            description="Track production jobs from awarded pitch through to closeout. Monitor budgets, actuals, margins, and change approvals across all offices."
            icon={<Briefcase className="w-8 h-8" />}
            href="/budget"
            delay={0.2}
          />
          <AppCard
            title="Production Cash-Flow Planner"
            description="Plan and manage cash flow across all bank accounts and entities. Enter transactions, track balances, and gain real-time financial insights."
            icon={<TrendingUp className="w-8 h-8" />}
            href="/cashflow"
            delay={0.4}
          />
          <AppCard
            title="IntelligenceOS"
            description="CFO Financial Intelligence · AI Production Knowledge · Operational Quality & Compliance — your unified operations intelligence platform."
            icon={<Cpu className="w-8 h-8" />}
            href="/intelligence/login"
            delay={0.6}
          />
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 text-center"
        >
          <p className="text-white/20 text-sm">
            © 2026 Seven Sunday Films. All rights reserved.
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

function AppCard({ title, description, icon, href, delay }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
    >
      <Link href={href} className="block group">
        <div className="glass gold-glow rounded-2xl p-8 h-full transition-all duration-500 hover:border-[#009AFF]/30 hover:bg-[rgba(0,154,255,0.05)] cursor-pointer">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-[#009AFF]/10 text-[#009AFF] group-hover:bg-[#009AFF]/20 transition-colors">
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-[#009AFF] transition-colors">
              {title}
            </h2>
          </div>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            {description}
          </p>
          <div className="flex items-center gap-2 text-[#009AFF] text-sm font-medium group-hover:gap-3 transition-all">
            Open App <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
