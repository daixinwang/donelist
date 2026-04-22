import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';

export type RangeKey = 'week' | 'month' | 'all';

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
];

export function RangeSelector({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.segment,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}>
      {OPTIONS.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              styles.option,
              {
                backgroundColor: active ? colors.surface : 'transparent',
                borderColor: active ? colors.accent : 'transparent',
              },
            ]}>
            <ThemedText
              style={{
                color: active ? colors.accent : colors.textMuted,
                fontWeight: active ? '600' : '400',
              }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
});
