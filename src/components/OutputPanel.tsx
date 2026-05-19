import { Terminal, Wand2, Copy, AlertTriangle, Database, ExternalLink, Globe, Lock, Check, Loader2, LogIn, HardDrive, FileText, Youtube, Cloud, Download, Share2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { FORBIDDEN_KEYWORDS } from '../constants';
import { MasterPrompt, PromptState, Visibility } from '../types';
import { GlassPanel } from './ui/GlassPanel';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth, getAccessToken, OperationType, handleFirestoreError } from '../lib/firebase';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface OutputPanelProps {
  promptText: string;
  formState: PromptState;
  activeProfile: string;
  visibility: Visibility;
  onVisibilityChange: (v: Visibility) => void;
  onEnhance: () => void;
  user: User | null;
  onSignIn: () => void;
  isGeneratingAI?: boolean;
}

export default function OutputPanel({ 
  promptText, 
  formState, 
  activeProfile, 
  visibility, 
  onVisibilityChange,
  onEnhance,
  user,
  onSignIn,
  isGeneratingAI = false
 }: OutputPanelProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveStatus, setDriveStatus] = useState<null | 'success' | 'error'>(null);
  const [isSavingToDocs, setIsSavingToDocs] = useState(false);
  const [docsStatus, setDocsStatus] = useState<null | 'success' | 'error'>(null);

  const foundViolations = useMemo(() => {
    const lowerText = promptText.toLowerCase();
    return FORBIDDEN_KEYWORDS.filter(word => lowerText.includes(word));
  }, [promptText]);

  const hasViolations = foundViolations.length > 0;

  const handleCopy = () => {
    if (hasViolations) return;
    navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user || hasViolations || isSaving) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const promptData: MasterPrompt = {
        ...formState,
        profile: activeProfile,
        visibility,
        prompt: promptText,
        timestamp: new Date().toISOString(),
        userId: user.uid
      };

      await addDoc(collection(db, 'master_prompts'), promptData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'master_prompts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!user || hasViolations || isSavingToDrive) return;

    const token = getAccessToken();
    if (!token) {
      onSignIn();
      return;
    }

    setIsSavingToDrive(true);
    setDriveStatus(null);

    try {
      const fileName = `Prompt-${activeProfile}-${new Date().toISOString().split('T')[0]}.txt`;
      const metadata = {
        name: fileName,
        mimeType: 'text/plain',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([promptText], { type: 'text/plain' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Drive API Error:', error);
        throw new Error('Drive upload failed');
      }
      
      setDriveStatus('success');
      setTimeout(() => setDriveStatus(null), 3000);
    } catch (error) {
      console.error('Drive save error:', error);
      setDriveStatus('error');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleSaveToDocs = async () => {
    if (!user || hasViolations || isSavingToDocs) return;

    const token = getAccessToken();
    if (!token) {
      onSignIn();
      return;
    }

    setIsSavingToDocs(true);
    setDocsStatus(null);

    try {
      const fileName = `Masterpiece Formula - ${activeProfile} - ${new Date().toLocaleDateString()}`;
      
      // Step 1: Create the document
      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: fileName }),
      });

      if (!createRes.ok) throw new Error('Failed to create Doc');
      const doc = await createRes.json();
      const documentId = doc.documentId;

      // Step 2: Add content to the document
      const content = `
MASTERPIECE FORMULA
===================
Profile: ${activeProfile}
Export Date: ${new Date().toLocaleString()}

THE FORMULA:
${promptText}

META DATA:
- Genre Heritage: ${formState.genre1}
- Modern Mix: ${formState.genre2}
- Vocals: ${formState.vocals}
- Instruments: ${formState.instruments}
- Logic/Polish: ${formState.logic}
      `.trim();

      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update Doc content');

      setDocsStatus('success');
      setTimeout(() => setDocsStatus(null), 3000);
    } catch (error) {
      console.error('Docs save error:', error);
      setDocsStatus('error');
    } finally {
      setIsSavingToDocs(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([promptText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Prompt-${activeProfile}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const handleWebShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'Masterpiece Formula',
        text: promptText,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <GlassPanel id="output-panel" className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Master Formula
        </h2>
        <button 
          onClick={onEnhance}
          disabled={isGeneratingAI}
          className="text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white px-3 py-1.5 rounded-xl shadow-lg font-bold transition flex items-center gap-1 uppercase tracking-wider disabled:opacity-50"
        >
          {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          {isGeneratingAI ? 'Thinking...' : 'AI Enhance'}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex-grow relative group min-h-[120px]">
        <p className={cn(
          "text-base font-mono leading-relaxed transition-colors",
          hasViolations ? "text-rose-400" : "text-emerald-400"
        )}>
          {promptText}
        </p>
        <button 
          onClick={handleCopy}
          disabled={hasViolations}
          className="absolute top-4 right-4 p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
        >
          {isCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-zinc-400" />}
        </button>
      </div>

      {hasViolations && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-sm text-rose-400">
          <AlertTriangle className="w-5 h-5 flex-none mt-0.5" />
          <div>
            <span className="font-bold block mb-1 uppercase tracking-wider text-xs">Policy Violation Detected</span>
            <span className="opacity-90">ตรวจพบคำต้องห้าม: "{foundViolations.join(', ')}" โปรดแก้ไขก่อน</span>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Feedback Loop (Ground Truth)</p>
        
        <div className="flex gap-3">
          {user ? (
            <>
              <select 
                value={visibility}
                onChange={(e) => onVisibilityChange(e.target.value as Visibility)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 outline-none flex-1 focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="private">🔒 Private</option>
                <option value="public">🌐 Public (Shared)</option>
              </select>
              
              <button 
                onClick={handleSave}
                disabled={hasViolations || isSaving}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-zinc-800 shadow-lg shadow-indigo-500/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {saveStatus === 'success' ? 'Masterpiece Saved' : 'Commit to Ecosystem'}
              </button>
            </>
          ) : (
            <button 
              onClick={onSignIn}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-indigo-400 text-sm font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-zinc-700"
            >
              <LogIn className="w-4 h-4" /> Sign in to Commit Formula
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {user && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleSaveToDrive}
                disabled={hasViolations || isSavingToDrive}
                className="bg-zinc-900 hover:bg-zinc-800 text-indigo-300 text-[10px] font-bold py-3.5 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2 uppercase tracking-[0.1em] disabled:opacity-50"
                title="Save to Google Drive"
              >
                {isSavingToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                {driveStatus === 'success' ? 'Saved!' : 'Save Drive'}
              </button>
              <button 
                onClick={handleSaveToDocs}
                disabled={hasViolations || isSavingToDocs}
                className="bg-zinc-900 hover:bg-zinc-800 text-indigo-300 text-[10px] font-bold py-3.5 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2 uppercase tracking-[0.1em] disabled:opacity-50"
                title="Export to Google Docs"
              >
                {isSavingToDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {docsStatus === 'success' ? 'Exported!' : 'Export Docs'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDownload}
                disabled={hasViolations}
                className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 text-[10px] font-bold py-3.5 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2 uppercase tracking-[0.1em] disabled:opacity-50"
                title="Download as .txt file"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
              {canShare && (
                <button 
                  onClick={handleWebShare}
                  disabled={hasViolations}
                  className="bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-[10px] font-bold py-3.5 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2 uppercase tracking-[0.1em] disabled:opacity-50"
                  title="Share to Cloud Storage or Apps"
                >
                  <Share2 className="w-4 h-4" />
                  Cloud Share
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 justify-center py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <span className="text-[8px] text-zinc-600 uppercase tracking-widest">Connect:</span>
              <div className="flex gap-2">
                 <div className="w-4 h-4 rounded-sm bg-blue-500/20 flex items-center justify-center opacity-50 grayscale hover:grayscale-0 transition cursor-help" title="OneDrive Integration Available via Cloud Share">
                   <div className="w-2 h-2 bg-blue-500 rounded-full" />
                 </div>
                 <div className="w-4 h-4 rounded-sm bg-indigo-500/20 flex items-center justify-center opacity-50 grayscale hover:grayscale-0 transition cursor-help" title="Dropbox Integration Available via Cloud Share">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                 </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <a 
            href="https://suno.com/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-3 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-1.5 uppercase tracking-wider h-12"
          >
            <ExternalLink className="w-3 h-3" /> Suno
          </a>
          <a 
            href="https://www.udio.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-3 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-1.5 uppercase tracking-wider h-12"
          >
            <ExternalLink className="w-3 h-3" /> Udio
          </a>
          <a 
            href="https://www.youtube.com/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-zinc-900 hover:bg-zinc-800 text-rose-500 text-[10px] font-bold py-3 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-1.5 uppercase tracking-wider h-12"
          >
            <Youtube className="w-3.5 h-3.5" /> YouTube
          </a>
        </div>
      </div>
    </GlassPanel>
  );
}
