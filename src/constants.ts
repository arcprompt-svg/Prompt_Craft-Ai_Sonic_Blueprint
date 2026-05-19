import { Genre, GenrePreset } from './types';

export const GENRE_PRESETS: Record<Genre, GenrePreset> = {
  'Mor Lam': {
    vocals: "Soulful Northeast Thai dialect vocals, energetic Luk Thung vibrato",
    instruments: "Driving Phin (Thai lute), rhythmic Khaen (bamboo mouth organ), lively tempo",
    logic: "Starts with an a cappella vocal cry, building up with Khaen and Phin into a fast-paced, festive dance rhythm."
  },
  'Luk Thung': {
    vocals: "Smooth, highly emotive Thai country vocals with distinct vibrato (Luk Kho)",
    instruments: "Acoustic guitar, brass section stabs, traditional Thai percussion",
    logic: "Mid-tempo groove. Emotional verse transitions into a grand chorus heavily supported by brass and strings."
  },
  'Thai Classical': {
    vocals: "Classical Thai reciting (Sepha) with precise microtonal pitch",
    instruments: "Ranat Ek (xylophone), Khong Wong Yai (gong circle), Ching (cymbals)",
    logic: "Slow and meditative opening. Complex counterpoint melodies layering gradually."
  },
  'Ploeng Phuea Chiwit': {
    vocals: "Raw, gravelly storytelling vocals, honest and socially conscious delivery",
    instruments: "Acoustic folk guitar, harmonica, steady bass, minimal percussion",
    logic: "Guitar-driven acoustic ballad. Focus remains on the lyrical narrative with subtle emotional peaks."
  },
  'Thai Pop': {
    vocals: "Bright, airy, and high-pitched T-Pop vocals, catchy melodic phrasing",
    instruments: "Polished synth-pop keys, electronic drums, funky rhythmic guitar",
    logic: "Upbeat and infectious radio-ready structure. Glossy production with a focus on hooks and danceable rhythms."
  }
};

export const FORBIDDEN_KEYWORDS = ['kill', 'blood', 'naked', 'porn', 'racist', 'hate speech', 'murder', 'nazi', 'suicide'];

export const KEYWORD_CHEAT_SHEET = {
  vocals: ['Crisp Soprano', 'Guttural Growl'],
  texture: ['Sub-bass 808s', 'Ethereal Pads'],
  polish: ['Dolby Atmos Mix', 'Binaural Panning'],
  rhythm: ['Syncopated groove', 'Polyrhythmic']
};
