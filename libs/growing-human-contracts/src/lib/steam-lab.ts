import { AgeBand } from './growing-human-contracts';

export const STEAM_GALLERY_ENDPOINT = '/api/growing-human/steam/gallery';
export const STEAM_MISSION_ENDPOINT = '/api/growing-human/steam/mission';

export const STEAM_THEMES = [
  { id: 'mars', label: 'Mars', query: 'mars rover landscape' },
  { id: 'moon', label: 'The Moon', query: 'moon surface nasa' },
  { id: 'earth', label: 'Earth', query: 'earth from space ISS' },
  { id: 'deep-space', label: 'Deep space', query: 'nebula hubble' },
] as const;
export type SteamTheme = (typeof STEAM_THEMES)[number]['id'];

export const STEAM_LENSES = [
  { id: 'science', label: 'Investigate', field: 'Science' },
  { id: 'technology', label: 'Invent a tool', field: 'Technology' },
  { id: 'engineering', label: 'Design & test', field: 'Engineering' },
  { id: 'art', label: 'Make art', field: 'Art' },
  { id: 'maths', label: 'Find a pattern', field: 'Maths' },
] as const;
export type SteamLens = (typeof STEAM_LENSES)[number]['id'];

export const STEAM_NOTICES = [
  { id: 'colour', label: 'Colour' },
  { id: 'shape', label: 'Shape' },
  { id: 'pattern', label: 'Pattern' },
  { id: 'texture', label: 'Texture' },
] as const;
export type SteamNotice = (typeof STEAM_NOTICES)[number]['id'];

export interface SteamImage {
  readonly id: string;
  readonly title: string;
  readonly thumbnailUrl: string;
  readonly sourceUrl: string;
  readonly date: string | null;
}

export interface SteamGallery {
  readonly theme: SteamTheme;
  readonly page: number;
  readonly images: readonly SteamImage[];
}

/** The browser sends only IDs and a bounded remix number, never child-authored text. */
export interface SteamMissionRequest {
  readonly ageBand: AgeBand;
  readonly theme: SteamTheme;
  readonly page: number;
  readonly imageId: string;
  readonly lens: SteamLens;
  readonly notice: SteamNotice;
  readonly remix: number;
}

export interface SteamMissionReply {
  readonly title: string;
  readonly challenge: string;
  readonly action: string;
  readonly question: string;
  readonly source: 'ai' | 'starter';
}
