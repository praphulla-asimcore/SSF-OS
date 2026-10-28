'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle, Cpu } from 'lucide-react';

export function LoginClient() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data?.error ?? 'Signup failed'); setLoading(false); return; }
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { setError('Invalid credentials'); setLoading(false); return; }
      router.replace('/intelligence/cfo/overview');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#009AFF] opacity-[0.03] blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#009AFF] opacity-[0.04] blur-[100px]" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Image src="/brand/ssf-logo.png" alt="Seven Sunday Films" width={240} height={60} className="mx-auto h-12 w-auto mb-4" priority />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-[#009AFF]" />
            <h1 className="text-xl font-semibold text-white">IntelligenceOS</h1>
          </div>
          <p className="text-white/40 text-sm">CFO · Knowledge · Compliance</p>
        </div>

        {/* DEMO badge */}
        <div className="flex justify-center mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
            DEMO ENVIRONMENT
          </span>
        </div>

        {/* Card */}
        <div className="glass gold-glow rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            <button onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === 'login' ? 'bg-[#009AFF]/20 text-[#009AFF]' : 'text-white/50 hover:text-white/70'}`}>
              <LogIn className="w-4 h-4 inline mr-1.5" /> Sign In
            </button>
            <button onClick={() => { setMode('signup'); setError(''); }} className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === 'signup' ? 'bg-[#009AFF]/20 text-[#009AFF]' : 'text-white/50 hover:text-white/70'}`}>
              <UserPlus className="w-4 h-4 inline mr-1.5" /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-white/60 text-sm mb-1 block">Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#009AFF]/50 transition" />
              </div>
            )}
            <div>
              <label className="text-white/60 text-sm mb-1 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#009AFF]/50 transition" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#009AFF]/50 transition" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-[#009AFF] text-white font-medium hover:bg-[#0077CC] disabled:opacity-50 transition-colors">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-white/40 text-xs mb-2 font-medium">Demo Credentials:</p>
            <p className="text-white/60 text-xs">Email: <span className="text-[#009AFF] font-mono">demo@sevensundayfilms.com</span></p>
            <p className="text-white/60 text-xs">Password: <span className="text-[#009AFF] font-mono">Demo2026!</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
