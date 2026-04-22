import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { TagDuration } from '@/db/queries/stats';
import { formatDuration } from '@/utils/date';

type Props = {
  data: TagDuration[];
};

export function TimePieChart({ data }: Props) {
  const { colors } = useAppTheme();
  const positive = data.filter((d) => d.totalMs > 0);
  const total = positive.reduce((s, d) => s + d.totalMs, 0);

  if (total === 0) {
    return (
      <View style={styles.wrapper}>
        <ThemedText type="subtitle">时间占比</ThemedText>
        <View style={styles.emptyBlock}>
          <ThemedText type="muted">还没有时长数据</ThemedText>
        </View>
      </View>
    );
  }

  const pieData = positive.map((d) => ({
    value: d.totalMs,
    color: d.color ?? colors.textSubtle,
  }));

  return (
    <View style={styles.wrapper}>
      <ThemedText type="subtitle">时间占比</ThemedText>
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
              <ThemedText
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  lineHeight: 22,
                }}>
                {formatDuration(total)}
              </ThemedText>
              <ThemedText type="caption">共耗</ThemedText>
            </View>
          )}
        />
        <View style={styles.legend}>
          {positive.map((d, idx) => (
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
                {Math.round((d.totalMs / total) * 100)}%
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
  emptyBlock: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
