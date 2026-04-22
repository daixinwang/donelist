import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <ThemedText type="caption">{label}</ThemedText>
      <ThemedText style={[styles.value, { color: colors.accent }]}>
        {value}
      </ThemedText>
      {hint ? <ThemedText type="caption">{hint}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
});
