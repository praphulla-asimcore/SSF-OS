'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield } from 'lucide-react';

const ROLES = ['admin', 'cfo', 'producer', 'manager', 'auditor', 'viewer'];
const ROLE_COLORS: Record<string, string> = { admin: 'bg-red-500/20 text-red-400', cfo: 'bg-[#009AFF]/20 text-[#009AFF]', producer: 'bg-green-500/20 text-green-400', manager: 'bg-amber-500/20 text-amber-400', auditor: 'bg-purple-500/20 text-purple-400', viewer: 'bg-white/10 text-white/40' };

export function UsersClient() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { fetch('/api/intelligence/admin/users').then(r => r.json()).then(d => setUsers(d ?? [])).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-[#A19AD3]" /> Users & Roles</h1>
      <p className="text-white/40 text-sm mt-1">Manage user access and role assignments</p></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-white/40">
            <th className="text-left py-3 px-4">Name</th>
            <th className="text-left py-3 px-4">Email</th>
            <th className="text-left py-3 px-4">Role</th>
            <th className="text-left py-3 px-4">Joined</th>
          </tr></thead>
          <tbody>
            {users.map((u: any, i: number) => (
              <tr key={u?.id ?? i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-3 px-4 text-white font-medium">{u?.name ?? '—'}</td>
                <td className="py-3 px-4 text-white/60">{u?.email}</td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u?.role] ?? 'bg-white/10 text-white/40'}`}>{u?.role}</span></td>
                <td className="py-3 px-4 text-white/40 text-xs">{u?.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
