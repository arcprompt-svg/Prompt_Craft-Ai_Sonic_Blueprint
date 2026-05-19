import * as React from 'react';
import { cn } from '../../lib/utils';

export function GlassPanel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div 
      id={id}
      className={cn(
        "bg-[#18181b] border border-zinc-800 rounded-[2rem] shadow-2xl p-8 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
