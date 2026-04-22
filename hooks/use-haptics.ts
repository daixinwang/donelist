import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/use-settings-store';

export function useHaptics() {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  return {
    success: () => {
      if (!hapticsEnabled) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    },
    selection: () => {
      if (!hapticsEnabled) return;
      Haptics.selectionAsync().catch(() => {});
    },
    light: () => {
      if (!hapticsEnabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    medium: () => {
      if (!hapticsEnabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
  };
}
