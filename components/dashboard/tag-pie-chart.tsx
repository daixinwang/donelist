import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { TagCount } from '@/db/queries/stats';

type Props = {
  data: TagCount[];
};

export function TagPieChart({ data }: Props) {
  const { colors } = useAppTheme();
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText type="muted">暂无数据</ThemedText>
      </View>
    );
  }

  const pieData = data.map((d) => ({
    value: d.count,
    color: d.color ?? colors.textSubtle,
    text: String(d.count),
    textColor: colors.surface,
    textSize: 12,
  }));

  return (
    <View style={styles.wrapper}>
      <ThemedText type="subtitle">标签占比</ThemedText>
      <View style={styles.content}>
        <PieChart
          data={pieData}
          donut
          radius={72}
          innerRadius={42}
          innerCircleColor={colors.surface}
          showText={false}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <ThemedText type="title" style={{ fontSize: 22 }}>
                {total}
              </ThemedText>
              <ThemedText type="caption">条</ThemedText>
            </View>
          )}
        />
        <View style={styles.legend}>
          {data.map((d, idx) => (
            <View key={idx} style={styles.legendRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: d.color ?? colors.textSubtle },
                ]}
              />
              <ThemedText style={{ flex: 1 }} numberOfLines={1}>
                {d.name ?? '无标签'}
              </ThemedText>
              <ThemedText type="muted">
                {Math.round((d.count / total) * 100)}%
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  empty: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
