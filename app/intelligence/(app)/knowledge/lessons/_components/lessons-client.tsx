'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = { pending: 'bg-amber-500/20 text-amber-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400' };

export function LessonsClient() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ projectId: '', category: 'general', observation: '', recommendation: '' });
  const [projects, setProjects] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/intelligence/knowledge/lessons').then(r => r.json()).then(d => setLessons(d ?? [])).catch(() => {});
    fetch('/api/intelligence/cfo/profitability').then(r => r.json()).then(d => setProjects(d?.projects ?? [])).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/intelligence/knowledge/lessons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ projectId: '', category: 'general', observation: '', recommendation: '' });
      const res = await fetch('/api/intelligence/knowledge/lessons');
      setLessons(await res.json());
    } catch {} finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Lightbulb className="w-6 h-6 text-[#D8FF36]" /> Lessons Learned</h1>
        <p className="text-white/40 text-sm mt-1">Submit and review production lessons</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg bg-[#D8FF36] text-black font-medium hover:bg-[#c5eb30] flex items-center gap-2"><Plus className="w-4 h-4" /> Submit Lesson</button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-1 block">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="">Select project</option>
                  {projects.map((p: any) => <option key={p?.id} value={p?.id}>{p?.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  {['general', 'production', 'logistics', 'crew', 'post_production', 'client', 'budget', 'safety'].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Observation</label>
              <textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} required rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Recommendation</label>
              <textarea value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-white/40 border border-white/10 rounded-lg">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#D8FF36] text-black font-medium rounded-lg disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-3">
        {lessons.map((l: any, i: number) => (
          <motion.div key={l?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-white/80 text-sm">{l?.observation}</p>
                {l?.recommendation && <p className="text-white/50 text-sm mt-2 italic">→ {l.recommendation}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_STYLES[l?.status] ?? ''}`}>{l?.status}</span>
                  <span className="text-xs text-white/20">{l?.project?.title ?? ''}</span>
                  <span className="text-xs text-white/20">{l?.category}</span>
                  <span className="text-xs text-white/20">by {l?.submittedBy}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
