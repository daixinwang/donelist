import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeOverride = 'system' | 'light' | 'dark';

type SettingsState = {
  hapticsEnabled: boolean;
  animationsEnabled: boolean;
  themeOverride: ThemeOverride;
  durationChipsMin: number[];
  setHapticsEnabled: (v: boolean) => void;
  setAnimationsEnabled: (v: boolean) => void;
  setThemeOverride: (v: ThemeOverride) => void;
  addDurationChip: (min: number) => void;
  removeDurationChip: (min: number) => void;
};

/** Max number of duration chips the user can keep pinned. */
export const MAX_DURATION_CHIPS = 8;
/** Below this the chip row starts to feel empty — refuse to delete further. */
export const MIN_DURATION_CHIPS = 2;
const DEFAULT_DURATION_CHIPS = [15, 30, 60, 120];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hapticsEnabled: true,
      animationsEnabled: true,
      themeOverride: 'system',
      durationChipsMin: DEFAULT_DURATION_CHIPS,

      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setAnimationsEnabled: (v) => set({ animationsEnabled: v }),
      setThemeOverride: (v) => set({ themeOverride: v }),

      addDurationChip: (min) => {
        if (!Number.isFinite(min) || min <= 0) return;
        const rounded = Math.round(min);
        const current = get().durationChipsMin;
        if (current.includes(rounded)) return;
        if (current.length >= MAX_DURATION_CHIPS) return;
        set({
          durationChipsMin: [...current, rounded].sort((a, b) => a - b),
        });
      },

      removeDurationChip: (min) => {
        const current = get().durationChipsMin;
        if (current.length <= MIN_DURATION_CHIPS) return;
        set({ durationChipsMin: current.filter((m) => m !== min) });
      },
    }),
    {
      name: 'donelist-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
