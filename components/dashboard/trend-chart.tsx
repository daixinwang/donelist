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

export function TrendChart({ data, fromMs, toMs }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const series = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d.count]));
    const start = dayjs(fromMs).startOf('day');
    const end = dayjs(toMs).subtract(1, 'day').startOf('day');
    const days = end.diff(start, 'day') + 1;
    const bars: { value: number; label?: string }[] = [];
    for (let i = 0; i < days; i++) {
      const d = start.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      const isMonthStart = d.date() === 1 || i === 0;
      const showLabel = days <= 14 || i % Math.ceil(days / 7) === 0 || isMonthStart;
      bars.push({
        value: map.get(key) ?? 0,
        label: showLabel ? d.format(days <= 14 ? 'DD' : 'M/D') : undefined,
      });
    }
    return bars;
  }, [data, fromMs, toMs]);

  const maxVal = Math.max(1, ...series.map((s) => s.value));
  const chartWidth = width - Spacing.lg * 4;
  const barWidth = Math.max(6, Math.floor(chartWidth / series.length) - 4);

  return (
    <View style={styles.wrapper}>
      <ThemedText type="subtitle">完成趋势</ThemedText>
      <ThemedText type="caption">共 {series.reduce((s, b) => s + b.value, 0)} 条</ThemedText>
      <View style={{ marginTop: Spacing.sm }}>
        <BarChart
          data={series}
          barWidth={barWidth}
          spacing={4}
          frontColor={colors.primary}
          gradientColor={colors.accent}
          showGradient
          roundedTop
          noOfSections={Math.min(4, maxVal)}
          maxValue={maxVal}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: colors.textSubtle, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.textSubtle, fontSize: 10 }}
          hideRules
          initialSpacing={0}
          endSpacing={0}
          disableScroll
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
