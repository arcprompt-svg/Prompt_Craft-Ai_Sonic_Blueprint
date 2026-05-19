import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { PromptState, PromptTemplate } from '../types';
import { Save, FolderOpen, Trash2, Loader2, X, Check, HardDrive, FileJson, RefreshCw, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from './ui/GlassPanel';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';
import { getAccessToken } from '../lib/firebase';

interface DriveFile {
  id: string;
  name: string;
}

interface TemplateManagerProps {
  user: User | null;
  currentFormState: PromptState;
  onLoadTemplate: (template: PromptState) => void;
  onSignIn: () => void;
}

export default function TemplateManager({ user, currentFormState, onLoadTemplate, onSignIn }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [status, setStatus] = useState<null | 'success' | 'error'>(null);
  
  // Drive states
  const [driveTemplates, setDriveTemplates] = useState<DriveFile[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');

  // Load local templates
  useEffect(() => {
    if (!user) {
      setTemplates([]);
      return;
    }

    const q = query(
      collection(db, 'prompt_templates'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as PromptTemplate[];
      setTemplates(t.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'prompt_templates'));

    return unsubscribe;
  }, [user]);

  const loadDriveTemplates = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsDriveLoading(true);
    try {
      // Find files with .json extension in their name that might be templates
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=name contains \'.json\' and mimeType = \'application/json\' and trashed = false', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDriveTemplates(data.files || []);
    } catch (error) {
      console.error('Error loading Drive templates:', error);
    } finally {
      setIsDriveLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'drive' && user) {
      loadDriveTemplates();
    }
  }, [isOpen, activeTab, user]);

  const handleSaveLocal = async () => {
    if (!user || !newTemplateName.trim()) return;

    setIsSaving(true);
    setStatus(null);
    try {
      await addDoc(collection(db, 'prompt_templates'), {
        name: newTemplateName.trim(),
        ...currentFormState,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      setNewTemplateName('');
      setShowSaveDialog(false);
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'prompt_templates');
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDrive = async () => {
    const token = getAccessToken();
    if (!token || !newTemplateName.trim()) return;

    setIsSaving(true);
    setStatus(null);

    try {
      const fileName = `${newTemplateName.trim()}.json`;
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        description: 'Pillar Engine Prompt Template',
        appProperties: {
          type: 'pillar_template'
        }
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(currentFormState)], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error('Drive upload failed');

      setNewTemplateName('');
      setShowSaveDialog(false);
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
      if (activeTab === 'drive') loadDriveTemplates();
    } catch (error) {
      console.error('Drive save error:', error);
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFromDrive = async (fileId: string) => {
    const token = getAccessToken();
    if (!token) return;

    setIsDriveLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download template');
      
      const config = await res.json();
      onLoadTemplate(config);
      setIsOpen(false);
    } catch (error) {
      console.error('Drive load error:', error);
      alert('Error loading template from Drive. Make sure it is a valid template file.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'prompt_templates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `prompt_templates/${id}`);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition text-[10px] font-bold uppercase tracking-widest",
            isOpen 
              ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" 
              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
          )}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Load ({activeTab === 'local' ? templates.length : driveTemplates.length})
        </button>
        
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition text-[10px] font-bold uppercase tracking-widest"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 z-50"
          >
            <GlassPanel className="p-0 border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab('local')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition border-b-2",
                    activeTab === 'local' 
                      ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" 
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  )}
                >
                  Local
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition border-b-2",
                    activeTab === 'drive' 
                      ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" 
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  )}
                >
                  Google Drive
                </button>
              </div>

              <div className="p-2 overflow-y-auto custom-scrollbar">
                {activeTab === 'local' ? (
                  <div className="space-y-1">
                    {templates.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">No local templates</p>
                      </div>
                    ) : (
                      templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            onLoadTemplate(t);
                            setIsOpen(false);
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-700/50 group flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-zinc-300 truncate">{t.name}</p>
                            <p className="text-[9px] text-zinc-500 truncate">{t.genre1} + {t.genre2}</p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteTemplate(t.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {isDriveLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Syncing with Drive...</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-2 py-1 flex justify-between items-center">
                           <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Files from Drive</p>
                           <button onClick={loadDriveTemplates} className="p-1 text-zinc-500 hover:text-indigo-400">
                             <RefreshCw className="w-3 h-3" />
                           </button>
                        </div>
                        {driveTemplates.length === 0 ? (
                          <div className="py-8 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">No .json files found</p>
                            <p className="text-[9px] text-zinc-700 mt-1">Save a template to Drive first</p>
                          </div>
                        ) : (
                          driveTemplates.map((file) => (
                            <button
                              key={file.id}
                              onClick={() => handleLoadFromDrive(file.id)}
                              className="w-full text-left p-3 rounded-lg hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-700/50 group flex items-center gap-3"
                            >
                              <FileJson className="w-4 h-4 text-amber-500/70" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-zinc-300 truncate">{file.name}</p>
                                <p className="text-[9px] text-zinc-500 truncate">Cloud Config</p>
                              </div>
                            </button>
                          ))
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm"
            >
              <GlassPanel className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Save Configuration</h3>
                  <button onClick={() => setShowSaveDialog(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Template Name</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. Dreamy Mor Lam Trap"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 transition"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSaveLocal}
                      disabled={isSaving || !newTemplateName.trim()}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50"
                    >
                      {isSaving && activeTab === 'local' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Local
                    </button>
                    <button
                      onClick={handleSaveToDrive}
                      disabled={isSaving || !newTemplateName.trim()}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50"
                    >
                      {isSaving && activeTab === 'drive' ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                      Drive
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {status && (
        <div className={cn(
          "fixed bottom-8 right-8 z-[110] px-6 py-3 rounded-xl border flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300",
          status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        )}>
          {status === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-200">
            {status === 'success' ? 'Template saved successfully' : 'Failed to save template'}
          </span>
        </div>
      )}
    </div>
  );
}
