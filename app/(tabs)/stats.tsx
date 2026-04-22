import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RangeSelector,
  type RangeKey,
} from '@/components/dashboard/range-selector';
import { TagPieChart } from '@/components/dashboard/tag-pie-chart';
import { TimePieChart } from '@/components/dashboard/time-pie-chart';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  countByDay,
  countByTag,
  durationByTag,
  getEarliestCompletedAt,
  type DailyCount,
  type TagCount,
  type TagDuration,
} from '@/db/queries/stats';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { startOfWeek } from '@/utils/date';

type Range = { fromMs: number; toMs: number };

const rangeFor = (key: RangeKey, earliestMs: number | null): Range => {
  const now = dayjs();
  const endMs = now.endOf('day').add(1, 'millisecond').valueOf();
  if (key === 'week') {
    return { fromMs: startOfWeek(now.valueOf()), toMs: endMs };
  }
  if (key === 'month') {
    return { fromMs: now.startOf('month').valueOf(), toMs: endMs };
  }
  // 'all' — from the first recorded item, or just today if none yet
  return {
    fromMs: earliestMs ?? now.startOf('day').valueOf(),
    toMs: endMs,
  };
};

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const items = useDoneStore((s) => s.items);

  const [range, setRange] = useState<RangeKey>('week');
  const [daily, setDaily] = useState<DailyCount[]>([]);
  const [byTag, setByTag] = useState<TagCount[]>([]);
  const [timeByTag, setTimeByTag] = useState<TagDuration[]>([]);
  const [earliestMs, setEarliestMs] = useState<number | null>(null);

  useEffect(() => {
    getEarliestCompletedAt().then(setEarliestMs);
  }, [items.length]);

  const windowRange = useMemo(
    () => rangeFor(range, earliestMs),
    [range, earliestMs]
  );

  useEffect(() => {
    (async () => {
      const [d, t, dur] = await Promise.all([
        countByDay(windowRange.fromMs, windowRange.toMs),
        countByTag(windowRange.fromMs, windowRange.toMs),
        durationByTag(windowRange.fromMs, windowRange.toMs),
      ]);
      setDaily(d);
      setByTag(t);
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
          data={daily}
          fromMs={windowRange.fromMs}
          toMs={windowRange.toMs}
        />
        <TagPieChart data={byTag} />
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
