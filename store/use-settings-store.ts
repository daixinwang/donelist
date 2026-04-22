import { create } from 'zustand';

type SettingsState = {
  hapticsEnabled: boolean;
  animationsEnabled: boolean;
  themeOverride: 'system' | 'light' | 'dark';
  setHapticsEnabled: (v: boolean) => void;
  setAnimationsEnabled: (v: boolean) => void;
  setThemeOverride: (v: 'system' | 'light' | 'dark') => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  hapticsEnabled: true,
  animationsEnabled: true,
  themeOverride: 'system',
  setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
  setAnimationsEnabled: (v) => set({ animationsEnabled: v }),
  setThemeOverride: (v) => set({ themeOverride: v }),
}));
