import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark;
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDark: newIsDark };
    }),
}));

// Initialize light mode on load
if (globalThis.window !== undefined) {
  document.documentElement.classList.remove('dark');
}
