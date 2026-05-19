import { useState, useEffect } from 'react';
import { SlidersHorizontal, BookOpen, AlertCircle, Cpu, ChevronDown } from 'lucide-react';
import { GENRE_PRESETS, KEYWORD_CHEAT_SHEET } from '../constants';
import { Genre, HybridGenre, PromptState, PromptStateSchema } from '../types';
import { GlassPanel } from './ui/GlassPanel';
import { motion, AnimatePresence } from 'motion/react';
import { z } from 'zod';

interface PillarEngineProps {
  formState: PromptState;
  onFormChange: (state: PromptState) => void;
}

export default function PillarEngine({ formState, onFormChange }: PillarEngineProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof PromptState, string>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const result = PromptStateSchema.safeParse(formState);
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof PromptState, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0] as keyof PromptState] = issue.message;
        }
      });
      setErrors(formattedErrors);
    } else {
      setErrors({});
    }
  }, [formState]);

  const handleChange = (key: keyof PromptState, value: string | number) => {
    let newState = { ...formState, [key]: value };

    // If genre1 changed, apply preset
    if (key === 'genre1') {
      const preset = GENRE_PRESETS[value as Genre];
      if (preset) {
        newState = {
          ...newState,
          ...preset,
          genre1: value as Genre
        };
      }
    }

    onFormChange(newState);
  };

  const insertKeyword = (keyword: string, targetField: keyof PromptState) => {
    const currentValue = formState[targetField];
    if (typeof currentValue !== 'string') return;
    const separator = currentValue && !currentValue.endsWith(' ') ? ', ' : '';
    handleChange(targetField, currentValue + separator + keyword);
  };

  const handleSettingChange = (key: keyof PromptState, value: number) => {
    onFormChange({ ...formState, [key]: value });
  };

  return (
    <GlassPanel id="pillar-engine" className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-blue-400" />
        The 4-Pillar Engine
      </h2>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-400 font-medium">Core Genre (Heritage)</label>
            <select 
              value={formState.genre1}
              onChange={(e) => handleChange('genre1', e.target.value)}
              className={`w-full bg-zinc-900 border ${errors.genre1 ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-zinc-800'} rounded-xl p-3 text-sm text-zinc-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all`}
            >
              <option value="Mor Lam">Mor Lam (หมอลำ)</option>
              <option value="Luk Thung">Luk Thung (ลูกทุ่ง)</option>
              <option value="Thai Classical">Thai Classical (ดนตรีไทยเดิม)</option>
              <option value="Ploeng Phuea Chiwit">Ploeng Phuea Chiwit (เพลงเพื่อชีวิต)</option>
              <option value="Thai Pop">Thai Pop (ที-ป๊อป)</option>
            </select>
            {errors.genre1 && (
              <p className="text-[10px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.genre1}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-400 font-medium">Hybridization (Modern Mix)</label>
            <select 
              value={formState.genre2}
              onChange={(e) => handleChange('genre2', e.target.value)}
              className={`w-full bg-zinc-900 border ${errors.genre2 ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-zinc-800'} rounded-xl p-3 text-sm text-zinc-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all`}
            >
              <option value="EDM">EDM</option>
              <option value="Cinematic Trap">Cinematic Trap</option>
              <option value="Heavy Rock">Heavy Rock</option>
            </select>
            {errors.genre2 && (
              <p className="text-[10px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.genre2}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400 font-medium">Vocal Profile / Pitch</label>
          <input 
            type="text" 
            value={formState.vocals}
            onChange={(e) => handleChange('vocals', e.target.value)}
            placeholder="e.g., Powerful Soprano female vocal..." 
            className={`w-full bg-zinc-900 border ${errors.vocals ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-zinc-800'} rounded-xl p-3 text-sm text-zinc-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-zinc-600`}
          />
          {errors.vocals && (
            <p className="text-[10px] text-rose-400 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.vocals}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400 font-medium">Key Instruments (Texture)</label>
          <input 
            type="text" 
            value={formState.instruments}
            onChange={(e) => handleChange('instruments', e.target.value)}
            placeholder="e.g., Driving Phin, Thundering 808s..." 
            className={`w-full bg-zinc-900 border ${errors.instruments ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-zinc-800'} rounded-xl p-3 text-sm text-zinc-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-zinc-600`}
          />
          {errors.instruments && (
            <p className="text-[10px] text-rose-400 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.instruments}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400 font-medium">Progression / Technical Polish</label>
          <textarea 
            rows={3} 
            value={formState.logic}
            onChange={(e) => handleChange('logic', e.target.value)}
            className={`w-full bg-zinc-900 border ${errors.logic ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-zinc-800'} rounded-xl p-3 text-sm text-zinc-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none placeholder:text-zinc-600`}
          />
          {errors.logic && (
            <p className="text-[10px] text-rose-400 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.logic}
            </p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-sm font-semibold text-zinc-300 hover:text-indigo-300 transition-colors mb-2"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" /> 
            <span>Advanced AI Settings</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-4 space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-zinc-400 font-bold uppercase tracking-wider">Temperature</label>
                    <span className="text-emerald-400 font-mono">{(formState.temperature ?? 0.7).toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.1"
                    value={formState.temperature ?? 0.7}
                    onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[9px] text-zinc-600">Higher values make output more random, lower values more deterministic.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-zinc-400 font-bold uppercase tracking-wider">Top P</label>
                    <span className="text-emerald-400 font-mono">{(formState.topP ?? 0.9).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={formState.topP ?? 0.9}
                    onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[9px] text-zinc-600">Nucleus sampling: only the top percentage of mass is considered.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-zinc-400 font-bold uppercase tracking-wider">Frequency Penalty</label>
                    <span className="text-emerald-400 font-mono">{(formState.frequencyPenalty ?? 0.0).toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.1"
                    value={formState.frequencyPenalty ?? 0.0}
                    onChange={(e) => handleSettingChange('frequencyPenalty', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[9px] text-zinc-600">Decreases the likelihood of the model repeating the same line verbatim.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Keyword Cheat Sheet
          </h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Select to apply</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(KEYWORD_CHEAT_SHEET) as [keyof typeof KEYWORD_CHEAT_SHEET, string[]][]).map(([category, words]) => (
            <div key={category} className="space-y-2">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{category}</p>
              {words.map(word => (
                <button 
                  key={word}
                  onClick={() => insertKeyword(word, category === 'texture' ? 'instruments' : category === 'vocals' ? 'vocals' : 'logic')}
                  className="block w-full text-left text-[11px] bg-zinc-900 hover:bg-indigo-500/10 hover:text-indigo-300 p-2 rounded-lg border border-zinc-800 transition-all font-medium"
                >
                  {word}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
