import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/use-settings-store';

export function useColorScheme() {
  const system = useSystemColorScheme();
  const override = useSettingsStore((s) => s.themeOverride);
  if (override === 'light' || override === 'dark') return override;
  return system;
}
