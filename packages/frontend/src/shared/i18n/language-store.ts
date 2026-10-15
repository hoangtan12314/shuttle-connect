// shared/i18n: which language is active, persisted per browser. Client-only global state
// (not server data, not local to one component) -- exactly what Zustand is for in this project.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'vi' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'vi',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'shuttle-connect-language' },
  ),
);
