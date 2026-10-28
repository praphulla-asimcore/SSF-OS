'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Upload, FileText, Tag, Shield, Calendar, Download } from 'lucide-react';

const CATEGORIES = ['production_brief', 'script', 'budget', 'call_sheet', 'schedule', 'contract', 'permit', 'safety', 'vendor', 'location', 'SOP', 'incident', 'postmortem', 'other'];
const CLASSIFICATIONS = ['public_internal', 'confidential', 'restricted_finance'];

export function LibraryClient() {
  const [docs, setDocs] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'other', classification: 'public_internal', entityId: '' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { loadDocs(); }, []);
  function loadDocs() { fetch('/api/intelligence/knowledge/documents').then(r => r.json()).then(d => setDocs(d ?? [])).catch(() => {}); }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      // Get presigned URL
      const res = await fetch('/api/intelligence/knowledge/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
        }),
      });
      const data = await res.json();
      if (data?.uploadUrl) {
        await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
      }
      setShowUpload(false);
      setForm({ title: '', category: 'other', classification: 'public_internal', entityId: '' });
      setFile(null);
      loadDocs();
    } catch (err) { console.error('Upload error:', err); }
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="w-6 h-6 text-[#D8FF36]" /> Document Library</h1>
        <p className="text-white/40 text-sm mt-1">Upload, categorize and manage production documents</p></div>
        <button onClick={() => setShowUpload(!showUpload)} className="px-4 py-2 rounded-lg bg-[#D8FF36] text-black font-medium hover:bg-[#c5eb30] transition-colors flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {showUpload && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D8FF36]/50" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Classification</label>
                <select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">File</label>
                <input type="file" onChange={(e) => { setFile(e.target.files?.[0] ?? null); if (!form.title && e.target.files?.[0]) setForm({ ...form, title: e.target.files[0].name }); }} required className="w-full text-white/60 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-lg text-white/40 hover:text-white/60 border border-white/10">Cancel</button>
              <button type="submit" disabled={uploading} className="px-4 py-2 rounded-lg bg-[#D8FF36] text-black font-medium hover:bg-[#c5eb30] disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload'}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-3">
        {docs.map((d: any, i: number) => (
          <motion.div key={d?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass rounded-xl p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[#D8FF36]/10"><FileText className="w-5 h-5 text-[#D8FF36]" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{d?.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-white/30"><Tag className="w-3 h-3" /> {d?.category?.replace(/_/g, ' ')}</span>
                <span className="flex items-center gap-1 text-xs text-white/30"><Shield className="w-3 h-3" /> {d?.classification?.replace(/_/g, ' ')}</span>
                <span className="text-xs text-white/20">v{d?.version ?? 1}</span>
                {d?.project && <span className="text-xs text-white/20">{d.project?.title}</span>}
              </div>
            </div>
            <span className="text-xs text-white/20 flex items-center gap-1"><Calendar className="w-3 h-3" /> {d?.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : ''}</span>
            {d?.downloadUrl && (
              <a href={d.downloadUrl} className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-[#D8FF36] transition-colors"><Download className="w-4 h-4" /></a>
            )}
          </motion.div>
        ))}
        {docs.length === 0 && <div className="glass rounded-xl p-8 text-center text-white/30">No documents yet. Upload your first document above.</div>}
      </div>
    </div>
  );
}
