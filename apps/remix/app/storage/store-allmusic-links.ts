import { create } from 'zustand';

export interface VideoLinkData {
  id: string;
  name: string;
  url: string;
  isrcVideo?: string | null | undefined;
  publishedAt?: Date | null | undefined;
  lyrics?: string | null | undefined;
  modified: boolean;
  deleted?: boolean;
}

export interface GeneralLinkData {
  id: string;
  name: string;
  url: string;
  modified?: boolean;
  deleted?: boolean;
}

interface AllMusicLinksStore {
  videoLinks: VideoLinkData[];
  generalLinks: GeneralLinkData[];

  // Video Links actions
  addVideoLink: (link: VideoLinkData) => void;
  updateVideoLink: (id: string, updates: Partial<VideoLinkData>) => void;
  removeVideoLink: (id: string) => void;
  clearVideoLinks: () => void;

  // General Links actions
  addGeneralLink: (link: GeneralLinkData) => void;
  updateGeneralLink: (id: string, updates: Partial<GeneralLinkData>) => void;
  removeGeneralLink: (id: string) => void;
  clearGeneralLinks: () => void;

  // Reset all
  resetStore: () => void;

  setInitialVideoLinks: (links: VideoLinkData[]) => void;
  setInitialGeneralLinks: (links: GeneralLinkData[]) => void;
}

export const useAllMusicLinksStore = create<AllMusicLinksStore>((set) => ({
  videoLinks: [],
  generalLinks: [],

  addVideoLink: (link) =>
    set((state) => ({
      videoLinks: [...state.videoLinks, link],
    })),

  updateVideoLink: (id, updates) =>
    set((state) => ({
      videoLinks: state.videoLinks.map((link) =>
        link.id === id ? { ...link, ...updates, modified: true } : link,
      ),
    })),

  removeVideoLink: (id) =>
    set((state) => ({
      videoLinks: state.videoLinks.filter((link) => link.id !== id),
    })),

  clearVideoLinks: () => set({ videoLinks: [] }),

  addGeneralLink: (link) =>
    set((state) => ({
      generalLinks: [...state.generalLinks, link],
    })),

  updateGeneralLink: (id, updates) =>
    set((state) => ({
      generalLinks: state.generalLinks.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      ),
    })),

  removeGeneralLink: (id) =>
    set((state) => ({
      generalLinks: state.generalLinks.filter((link) => link.id !== id),
    })),

  clearGeneralLinks: () => set({ generalLinks: [] }),

  setInitialVideoLinks: (links) => set({ videoLinks: links }),
  setInitialGeneralLinks: (links) => set({ generalLinks: links }),

  resetStore: () =>
    set({
      videoLinks: [],
      generalLinks: [],
    }),
}));
