import { z } from 'zod';

export const PromptStateSchema = z.object({
  genre1: z.string().min(1, "Genre Heritage is required"),
  genre2: z.string().min(1, "Modern Mix is required"),
  vocals: z.string().min(1, "Vocal specifications are required").max(1000),
  instruments: z.string().min(1, "Instrument specifications are required").max(1000),
  logic: z.string().min(1, "Logic and polish settings are required").max(2000),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(0).max(2).optional(),
});

export type Genre = 'Mor Lam' | 'Luk Thung' | 'Thai Classical' | 'Ploeng Phuea Chiwit' | 'Thai Pop';
export type HybridGenre = 'EDM' | 'Cinematic Trap' | 'Heavy Rock';
export type Visibility = 'private' | 'public';

export interface PromptState {
  genre1: Genre;
  genre2: HybridGenre;
  vocals: string;
  instruments: string;
  logic: string;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
}

export interface MasterPrompt extends PromptState {
  id?: string;
  profile: string;
  visibility: Visibility;
  prompt: string;
  timestamp: string;
  userId: string;
}

export interface GenrePreset {
  vocals: string;
  instruments: string;
  logic: string;
}

export interface PromptTemplate extends PromptState {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}
