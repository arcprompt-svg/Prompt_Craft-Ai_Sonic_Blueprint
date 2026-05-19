import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Genre, HybridGenre } from '../types';
import { GlassPanel } from './ui/GlassPanel';
import { Music2 } from 'lucide-react';

interface SonicVisualizerProps {
  genre1: Genre;
  genre2: HybridGenre;
}

export default function SonicVisualizer({ genre1, genre2 }: SonicVisualizerProps) {
  // Determine color scheme based on genre
  const colorScheme = useMemo(() => {
    switch (genre1) {
      case 'Mor Lam':
        return { primary: 'bg-emerald-500', secondary: 'bg-amber-400', glow: 'shadow-emerald-500/20' };
      case 'Luk Thung':
        return { primary: 'bg-rose-500', secondary: 'bg-orange-400', glow: 'shadow-rose-500/20' };
      case 'Thai Classical':
        return { primary: 'bg-amber-600', secondary: 'bg-yellow-200', glow: 'shadow-amber-500/20' };
      case 'Ploeng Phuea Chiwit':
        return { primary: 'bg-zinc-500', secondary: 'bg-amber-700', glow: 'shadow-zinc-500/20' };
      case 'Thai Pop':
        return { primary: 'bg-pink-500', secondary: 'bg-indigo-400', glow: 'shadow-pink-500/20' };
      default:
        return { primary: 'bg-indigo-500', secondary: 'bg-purple-400', glow: 'shadow-indigo-500/20' };
    }
  }, [genre1]);

  // Animation speed based on genre2
  const speed = useMemo(() => {
    switch (genre2) {
      case 'EDM': return 0.5;
      case 'Cinematic Trap': return 0.8;
      case 'Heavy Rock': return 0.4;
      default: return 1;
    }
  }, [genre2]);

  const barCount = 24;

  return (
    <GlassPanel className="h-full flex flex-col justify-between overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 z-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-zinc-400">
          <Music2 className="w-4 h-4 text-indigo-400" />
          Spectral Pulse
        </h2>
        <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Sync</span>
        </div>
      </div>

      <div className="flex-grow flex items-end justify-between gap-1 h-32 px-2 z-10">
        {[...Array(barCount)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-full rounded-t-full ${i % 2 === 0 ? colorScheme.primary : colorScheme.secondary} ${colorScheme.glow} shadow-lg`}
            initial={{ height: '10%' }}
            animate={{ 
              height: [`${10 + Math.random() * 20}%`, `${30 + Math.random() * 70}%`, `${15 + Math.random() * 30}%`]
            }}
            transition={{
              duration: speed + (Math.random() * 0.5),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800 z-10">
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
          <span>0Hz</span>
          <span>{genre1} + {genre2}</span>
          <span>22kHz</span>
        </div>
      </div>
    </GlassPanel>
  );
}
