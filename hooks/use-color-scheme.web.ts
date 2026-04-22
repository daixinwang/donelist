import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/use-settings-store';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const system = useRNColorScheme();
  const override = useSettingsStore((s) => s.themeOverride);

  if (!hasHydrated) return 'light';
  if (override === 'light' || override === 'dark') return override;
  return system;
}
