import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import { humanizeDay } from '@/utils/date';

export function DayHeader({ dayKey, count }: { dayKey: string; count: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <ThemedText type="subtitle" style={styles.label}>
        {humanizeDay(dayKey)}
      </ThemedText>
      <ThemedText type="caption">{count} 条</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 18,
  },
});
