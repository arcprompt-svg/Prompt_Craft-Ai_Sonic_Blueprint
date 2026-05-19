import { UserCircle, CheckCircle, LogIn, LogOut, ExternalLink } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeProfile: string;
  onProfileChange: (profile: string) => void;
  systemStatus: string;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Header({ 
  activeProfile, 
  onProfileChange, 
  systemStatus, 
  user,
  onSignIn,
  onSignOut
}: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-end justify-between pb-4 gap-4">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          Promptcraft-Ai
        </h1>
        <div className="flex flex-col">
          <p className="text-zinc-400 font-medium ml-13">The Sonic Blueprint: Hybrid Music Ecosystem</p>
          <a 
            href="https://ais-dev-6owsyntzonxeny2imudr55-721391878984.asia-east1.run.app" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] text-indigo-400/60 hover:text-indigo-400 transition ml-13 flex items-center gap-1 mt-1 group"
          >
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            Live Deployment: ais-dev-6owsy...asia-east1.run.app
          </a>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        {user ? (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full" />
            ) : (
              <UserCircle className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-xs font-semibold text-zinc-300 hidden sm:block">
              {user.displayName || user.email || 'Producer'}
            </span>
            <button 
              onClick={onSignOut}
              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onSignIn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-2xl transition shadow-lg shadow-indigo-500/20 uppercase tracking-widest"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        )}

        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-2xl border border-zinc-800 flex-1 md:flex-none">
          <UserCircle className="w-5 h-5 text-indigo-400" />
          <select 
            id="activeProfile"
            value={activeProfile}
            onChange={(e) => onProfileChange(e.target.value)}
            className="bg-transparent text-sm text-zinc-300 font-semibold focus:outline-none pr-2 cursor-pointer w-full"
          >
            <option value="Main Studio">Main Studio</option>
            <option value="Experimental Lab">Experimental Lab</option>
            <option value="Mor Lam Project">Mor Lam Project</option>
          </select>
        </div>
        
        <span className="px-4 py-2 text-xs font-bold bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center gap-2 whitespace-nowrap">
          <CheckCircle className="w-3.5 h-3.5" /> {systemStatus}
        </span>
      </div>
    </header>
  );
}
