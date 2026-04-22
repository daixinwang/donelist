import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

import { tagColorPalette } from '@/constants/theme';
import { useSettingsStore } from '@/store/use-settings-store';

type Props = {
  trigger: number;
};

/**
 * Mounts a ConfettiCannon with autoStart whenever `trigger` increments.
 * Unmounts itself ~1.8s later to free the view.
 */
export function ConfettiOverlay({ trigger }: Props) {
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const [burstId, setBurstId] = useState(0);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (trigger <= 0 || !animationsEnabled) return;
    setBurstId(trigger);
    const handle = setTimeout(() => setBurstId(0), 1800);
    return () => clearTimeout(handle);
  }, [trigger, animationsEnabled]);

  if (!animationsEnabled || burstId === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ConfettiCannon
        key={burstId}
        count={42}
        origin={{ x: width / 2, y: -20 }}
        autoStart
        fadeOut
        fallSpeed={2600}
        explosionSpeed={280}
        colors={tagColorPalette}
      />
    </View>
  );
}
