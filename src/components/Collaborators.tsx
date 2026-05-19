import { motion, AnimatePresence } from 'motion/react';
import { UserCircle } from 'lucide-react';

interface Participant {
  uid: string;
  displayName: string;
  photoURL: string;
}

interface CollaboratorsProps {
  participants: Participant[];
}

export default function Collaborators({ participants }: CollaboratorsProps) {
  return (
    <div className="flex -space-x-2">
      <AnimatePresence>
        {participants.map((p) => (
          <motion.div
            key={p.uid}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            className="relative group focus-within:z-10"
            title={p.displayName}
          >
            {p.photoURL ? (
              <img 
                src={p.photoURL} 
                alt={p.displayName} 
                className="w-8 h-8 rounded-full border-2 border-zinc-950 object-cover ring-2 ring-indigo-500/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center ring-2 ring-indigo-500/20">
                <UserCircle className="w-5 h-5 text-zinc-500" />
              </div>
            )}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-[10px] font-bold text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {p.displayName}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
