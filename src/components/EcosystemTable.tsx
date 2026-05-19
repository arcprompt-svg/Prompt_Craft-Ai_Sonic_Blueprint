import { Library, Loader2, Copy, Trash2, Globe, Lock } from 'lucide-react';
import { MasterPrompt } from '../types';
import { GlassPanel } from './ui/GlassPanel';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useState } from 'react';

interface EcosystemTableProps {
  prompts: MasterPrompt[];
  isLoading: boolean;
  activeProfile: string;
}

export default function EcosystemTable({ prompts, isLoading, activeProfile }: EcosystemTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this prompt?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'master_prompts', id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <GlassPanel className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Library className="w-5 h-5 text-indigo-400" />
          Ground Truth Ecosystem
        </h2>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
          Active: {activeProfile}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-sm text-left text-zinc-300">
          <thead className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold bg-zinc-900">
            <tr>
              <th className="px-6 py-4">Hybrid Blueprint</th>
              <th className="px-6 py-4">Sonic Formula</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="font-medium">Initializing Ecosystem Data...</span>
                  </div>
                </td>
              </tr>
            ) : prompts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 font-medium">
                  No masterpiece blueprints found for [{activeProfile}].
                </td>
              </tr>
            ) : (
              prompts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {p.visibility === 'public' ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-rose-400" />}
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border border-indigo-500/20">
                        {p.genre1}
                      </span>
                      <span className="text-zinc-600">×</span>
                      <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border border-zinc-700">
                        {p.genre2}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="line-clamp-1 text-xs text-zinc-500 font-mono" title={p.prompt}>
                      {p.prompt}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => copyToClipboard(p.prompt)}
                        className="p-2 hover:bg-zinc-800 hover:text-indigo-400 rounded-xl transition text-zinc-500"
                        title="Copy Formula"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {auth.currentUser?.uid === p.userId && (
                        <button 
                          onClick={() => p.id && handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-2 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition text-zinc-500 disabled:opacity-30"
                          title="Purge"
                        >
                          {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
