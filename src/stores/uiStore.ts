import { create } from 'zustand';

interface UIState {
  isTroubleshootOpen: boolean;
  toggleTroubleshoot: () => void;
  openTroubleshoot: () => void;
  closeTroubleshoot: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTroubleshootOpen: false,
  toggleTroubleshoot: () => set((state) => ({ isTroubleshootOpen: !state.isTroubleshootOpen })),
  openTroubleshoot: () => set({ isTroubleshootOpen: true }),
  closeTroubleshoot: () => set({ isTroubleshootOpen: false }),
}));
