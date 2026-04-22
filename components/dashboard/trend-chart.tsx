import dayjs from 'dayjs';
import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { DailyCount } from '@/db/queries/stats';

type Props = {
  data: DailyCount[];
  fromMs: number;
  toMs: number;
};

const WEEKDAY_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

export function TrendChart({ data, fromMs, toMs }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const series = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d.count]));
    const start = dayjs(fromMs).startOf('day');
    const endExclusive = dayjs(toMs).startOf('day');
    const days = Math.max(1, endExclusive.diff(start, 'day'));

    return Array.from({ length: days }, (_, i) => {
      const d = start.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      const value = map.get(key) ?? 0;
      let label = '';
      if (days <= 7) {
        // dayjs.day(): 0=Sun..6=Sat → convert to Mon-based index
        label = WEEKDAY_SHORT[(d.day() + 6) % 7];
      } else if (days <= 35) {
        // monthly grid: first bar + month boundaries + every 5th day
        if (i === 0 || d.date() === 1 || d.date() % 5 === 0) {
          label = String(d.date());
        }
      } else {
        // long range: month boundaries only to avoid clutter
        if (i === 0 || d.date() === 1) label = d.format('M月');
      }
      return { value, label };
    });
  }, [data, fromMs, toMs]);

  const total = series.reduce((s, b) => s + b.value, 0);
  const maxVal = Math.max(1, ...series.map((s) => s.value));

  // Size bars per range. For long ranges, let the chart scroll so
  // each bar keeps enough width; squishing everything into one
  // viewport ends up with 3-pixel bars that can't be read.
  const count = series.length;
  const scrollable = count > 35;
  const spacing = count <= 7 ? 10 : 3;
  const availWidth = width - Spacing.lg * 2 - 40; // container + y-axis gutter
  const fitWidth = (availWidth - (count - 1) * spacing) / count;
  const barWidth = scrollable
    ? 14
    : count <= 7
    ? Math.min(36, Math.floor(fitWidth))
    : Math.max(6, Math.floor(fitWidth));
  const labelWidth = Math.max(barWidth + spacing, count <= 7 ? 36 : 22);

  // Per-bar color: transparent for zero so the bar (and its rounded
  // cap, if any) genuinely disappears instead of rendering as a
  // 1-2 px artefact on the baseline.
  const enriched = series.map((s) => ({
    value: s.value,
    label: s.label,
    frontColor: s.value > 0 ? colors.primary : 'transparent',
  }));

  return (
    <View style={styles.wrapper}>
      <ThemedText type="subtitle">完成趋势</ThemedText>
      <ThemedText type="caption">共 {total} 条</ThemedText>
      <View style={{ marginTop: Spacing.sm }}>
        <BarChart
          data={enriched}
          barWidth={barWidth}
          spacing={spacing}
          labelWidth={labelWidth}
          noOfSections={Math.min(4, Math.max(1, maxVal))}
          maxValue={maxVal}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: colors.textSubtle, fontSize: 10 }}
          xAxisLabelTextStyle={{
            color: colors.textSubtle,
            fontSize: 10,
          }}
          hideRules
          initialSpacing={4}
          endSpacing={4}
          disableScroll={!scrollable}
          isAnimated
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
