'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Tag, Calendar } from 'lucide-react';

const CATEGORIES = ['', 'production_brief', 'script', 'budget', 'call_sheet', 'schedule', 'contract', 'permit', 'safety', 'vendor', 'location', 'SOP', 'incident', 'postmortem', 'other'];

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  async function doSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (category) params.set('category', category);
      const res = await fetch(`/api/intelligence/knowledge/search?${params}`);
      const data = await res.json();
      setResults(data?.results ?? []);
    } catch {} finally { setSearching(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Search className="w-6 h-6 text-[#D8FF36]" /> Knowledge Search</h1>
      <p className="text-white/40 text-sm mt-1">Search across all production documents and knowledge</p></div>

      <form onSubmit={doSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents, SOPs, contracts…" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D8FF36]/50" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
        <button type="submit" disabled={searching} className="px-5 py-2.5 rounded-lg bg-[#D8FF36] text-black font-medium hover:bg-[#c5eb30] disabled:opacity-50 transition-colors">
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((r: any, i: number) => (
            <motion.div key={r?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl p-4 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#D8FF36] mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{r?.title}</h3>
                  <p className="text-white/40 text-sm mt-1 line-clamp-2">{r?.snippet}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-white/30"><Tag className="w-3 h-3" /> {r?.category?.replace(/_/g, ' ')}</span>
                    {r?.project && <span className="text-xs text-white/30">Project: {r.project}</span>}
                    <span className="text-xs text-white/20">v{r?.version ?? 1}</span>
                    <span className="flex items-center gap-1 text-xs text-white/20"><Calendar className="w-3 h-3" /> {r?.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-GB') : ''}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : query && !searching ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-white/40">No results found for "{query}"</p>
        </div>
      ) : null}
    </div>
  );
}
