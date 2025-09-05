import { create } from 'zustand/react';

interface ActiveGameStore {
  setIsActive: (isActive: boolean) => void;
  activeGame: boolean;
}

export const useIsActiveStore = create<ActiveGameStore>((set) => ({
  activeGame: false,
  setIsActive: (isActive) => set({ activeGame: isActive }),
}));
