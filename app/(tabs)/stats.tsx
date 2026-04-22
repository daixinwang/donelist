import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RangeSelector,
  type RangeKey,
} from '@/components/dashboard/range-selector';
import { TimePieChart } from '@/components/dashboard/time-pie-chart';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { listDoneItemsByCompletion } from '@/db/queries/done-items';
import { durationByTag, type TagDuration } from '@/db/queries/stats';
import type { DoneItem } from '@/db/types';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { startOfWeek } from '@/utils/date';

type Range = { fromMs: number; toMs: number };

const rangeFor = (key: RangeKey): Range => {
  const now = dayjs();
  if (key === 'week') {
    // Full Mon–Sun so future days still show on the x-axis.
    const weekStart = startOfWeek(now.valueOf());
    return {
      fromMs: weekStart,
      toMs: dayjs(weekStart).add(7, 'day').valueOf(),
    };
  }
  // Full 1st–last day of the month.
  return {
    fromMs: now.startOf('month').valueOf(),
    toMs: now.startOf('month').add(1, 'month').valueOf(),
  };
};

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const items = useDoneStore((s) => s.items);

  const [range, setRange] = useState<RangeKey>('week');
  const [rangeItems, setRangeItems] = useState<DoneItem[]>([]);
  const [timeByTag, setTimeByTag] = useState<TagDuration[]>([]);

  const windowRange = useMemo(() => rangeFor(range), [range]);

  useEffect(() => {
    (async () => {
      const [rangeList, dur] = await Promise.all([
        listDoneItemsByCompletion(windowRange.fromMs, windowRange.toMs),
        durationByTag(windowRange.fromMs, windowRange.toMs),
      ]);
      setRangeItems(rangeList);
      setTimeByTag(dur);
    })();
  }, [windowRange, items.length]);

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl * 2 }}>
        <View style={styles.header}>
          <ThemedText type="title">统计</ThemedText>
          <ThemedText type="muted">精力都花在哪里了。</ThemedText>
        </View>

        <View style={styles.section}>
          <RangeSelector value={range} onChange={setRange} />
        </View>

        <TrendChart
          items={rangeItems}
          fromMs={windowRange.fromMs}
          toMs={windowRange.toMs}
        />
        <TimePieChart data={timeByTag} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
