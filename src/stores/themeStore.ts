/**
 * themeStore · 浅色/深色（tokens.css data-theme）
 */
import { create } from 'zustand';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'sb-theme';

function systemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function apply(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  localStorage.setItem(STORAGE_KEY, theme);
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  init() {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const next = saved ?? systemTheme();
    apply(next);
    set({ theme: next });
  },

  toggle() {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },

  setTheme(t) {
    apply(t);
    set({ theme: t });
  },
}));
