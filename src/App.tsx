import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy, type Unsubscribe, doc, setDoc, updateDoc, serverTimestamp, getDoc, getDocFromServer } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import EcosystemTable from './components/EcosystemTable';
import Header from './components/Header';
import OutputPanel from './components/OutputPanel';
import PillarEngine from './components/PillarEngine';
import SonicVisualizer from './components/SonicVisualizer';
import Collaborators from './components/Collaborators';
import TemplateManager from './components/TemplateManager';
import { GENRE_PRESETS } from './constants';
import { auth, db, googleSignIn, initAuth, OperationType, handleFirestoreError } from './lib/firebase';
import { MasterPrompt, PromptState, Visibility } from './types';
import { Users, Share2, Loader2, Undo2, Redo2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState('Main Studio');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const isRemoteUpdate = useRef(false);

  const [formState, setFormState] = useState<PromptState>({
    genre1: 'Mor Lam',
    genre2: 'EDM',
    vocals: GENRE_PRESETS['Mor Lam'].vocals,
    instruments: GENRE_PRESETS['Mor Lam'].instruments,
    logic: GENRE_PRESETS['Mor Lam'].logic,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.0,
  });

  // History state
  const [history, setHistory] = useState<PromptState[]>([]);
  const [future, setFuture] = useState<PromptState[]>([]);

  // Auth setup
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = initAuth((u) => {
      setUser(u);
      setAuthError(null);
    }, () => {
      setUser(null);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      await googleSignIn();
      setAuthError(null);
    } catch (error: any) {
      console.error('Auth Hub Error:', error);
      setAuthError(error.message);
    }
  };

  const handleSignOut = () => signOut(auth);

  // Collaboration setup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session');
    if (sid) {
      setSessionId(sid);
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !user) return;

    // Presence update
    const participantRef = doc(db, `collab_sessions/${sessionId}/participants/${user.uid}`);
    setDoc(participantRef, {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous Producer',
      photoURL: user.photoURL || '',
      lastActive: new Date().toISOString()
    }).catch(error => handleFirestoreError(error, OperationType.WRITE, `collab_sessions/${sessionId}/participants/${user.uid}`));

    // Listen to participants
    const participantsRef = collection(db, `collab_sessions/${sessionId}/participants`);
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      const p = snapshot.docs.map(d => d.data());
      setParticipants(p);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `collab_sessions/${sessionId}/participants`));

    // Listen to session state
    const sessionRef = doc(db, 'collab_sessions', sessionId);
    const unsubSession = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.lastUpdatedBy !== user.uid) {
          isRemoteUpdate.current = true;
          setFormState(data.formState);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `collab_sessions/${sessionId}`));

    return () => {
      unsubParticipants();
      unsubSession();
    };
  }, [sessionId, user]);

  const handleStartSession = async () => {
    if (!user) {
      handleSignIn();
      return;
    }
    setIsStartingSession(true);
    try {
      const sid = Math.random().toString(36).substring(2, 11);
      const sessionRef = doc(db, 'collab_sessions', sid);
      await setDoc(sessionRef, {
        formState,
        lastUpdatedBy: user.uid,
        updatedAt: new Date().toISOString()
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('session', sid);
      window.history.pushState({}, '', newUrl);
      setSessionId(sid);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'collab_sessions');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, future, formState]);

  const handleFormChange = (newState: PromptState, saveToHistory = true) => {
    if (saveToHistory) {
      setHistory(prev => [...prev, formState]);
      setFuture([]); // Clear future on new change
    }
    
    setFormState(newState);
    if (sessionId && user && !isRemoteUpdate.current) {
      const sessionRef = doc(db, 'collab_sessions', sessionId);
      updateDoc(sessionRef, {
        formState: newState,
        lastUpdatedBy: user.uid,
        updatedAt: new Date().toISOString()
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `collab_sessions/${sessionId}`));
    }
    isRemoteUpdate.current = false;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [formState, ...f]);
    setHistory(h => h.slice(0, -1));
    handleFormChange(prev, false);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, formState]);
    setFuture(f => f.slice(1));
    handleFormChange(next, false);
  };
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // In a real app with social features, you might want a more complex query.
    // Here we fetch personal prompts for the profile AND public prompts if they match the profile.
    const promptsRef = collection(db, 'master_prompts');
    const q = query(
      promptsRef,
      where('profile', '==', activeProfile),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPrompts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as MasterPrompt))
        .filter(p => p.userId === user.uid || p.visibility === 'public'); // Double check visibility in client if rules are complex
      
      setPrompts(fetchedPrompts);
      setLoading(false);
    }, (error) => {
      console.error('Firestore Error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, activeProfile]);

  const masterPromptText = useMemo(() => {
    return `[Genre Mix]: ${formState.genre1} ${formState.genre2} Hybrid. [Intensity/Mood]: High Energy. [Vocal Profile]: ${formState.vocals}. [Instrumentation]: Featuring ${formState.instruments}. [Structure/Logic]: ${formState.logic}`;
  }, [formState]);

  const handleEnhance = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formState }),
      });
      
      if (!response.ok) throw new Error('AI generation failed');
      
      const data = await response.json();
      if (data.text) {
        handleFormChange({
          ...formState,
          logic: data.text
        });
      }
    } catch (error) {
      console.error('Enhance Error:', error);
      // Fallback to basic enhancement if AI fails
      const enhanceKeywords = " Masterpiece, High-fidelity, pristine mastering, Dolby Atmos, crisp EQ, deep soundstage, cinematic dynamics, uncompressed audio.";
      if (!formState.logic.includes("Masterpiece")) {
        handleFormChange({
          ...formState,
          logic: formState.logic + enhanceKeywords
        });
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        <Header 
          activeProfile={activeProfile} 
          onProfileChange={setActiveProfile} 
          systemStatus={user ? 'Online' : 'Restricted'} 
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          <div className="lg:col-span-4 flex flex-col lg:flex-row items-center gap-4 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              {!sessionId ? (
                <button 
                  onClick={handleStartSession}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-indigo-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-800 transition"
                  disabled={isStartingSession}
                >
                  {isStartingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Go Live
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Live Session: {sessionId}</span>
                  </div>
                  <Collaborators participants={participants} />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Session link copied!');
                    }}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Invite
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 border-l border-zinc-800 pl-4">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-2 text-zinc-500 hover:text-indigo-400 transition disabled:opacity-30 disabled:hover:text-zinc-500"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  className="p-2 text-zinc-500 hover:text-indigo-400 transition disabled:opacity-30 disabled:hover:text-zinc-500"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:ml-auto">
              <TemplateManager 
                user={user} 
                currentFormState={formState} 
                onLoadTemplate={handleFormChange} 
                onSignIn={handleSignIn}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              className="h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <PillarEngine 
                formState={formState} 
                onFormChange={handleFormChange} 
              />
            </motion.div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <SonicVisualizer genre1={formState.genre1} genre2={formState.genre2} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              <OutputPanel 
                promptText={masterPromptText} 
                formState={formState}
                activeProfile={activeProfile}
                visibility={visibility}
                onVisibilityChange={setVisibility}
                onEnhance={handleEnhance}
                onSignIn={handleSignIn}
                user={user}
                isGeneratingAI={isGeneratingAI}
              />
            </motion.div>
          </div>

          <motion.div
            className="lg:col-span-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <EcosystemTable 
              prompts={prompts} 
              isLoading={loading} 
              activeProfile={activeProfile} 
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
