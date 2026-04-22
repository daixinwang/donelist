import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContributionHeatmap } from '@/components/dashboard/contribution-heatmap';
import {
  RangeSelector,
  type RangeKey,
} from '@/components/dashboard/range-selector';
import { StatCard } from '@/components/dashboard/stat-card';
import { TagPieChart } from '@/components/dashboard/tag-pie-chart';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  countByDay,
  countByTag,
  currentStreak,
  type DailyCount,
  type TagCount,
} from '@/db/queries/stats';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';

type Range = { fromMs: number; toMs: number };

const rangeFor = (key: RangeKey): Range => {
  const now = dayjs();
  const endMs = now.endOf('day').add(1, 'millisecond').valueOf();
  if (key === 'week') {
    return {
      fromMs: now.startOf('week').add(1, 'day').startOf('day').valueOf(), // Mon
      toMs: endMs,
    };
  }
  if (key === 'month') {
    return {
      fromMs: now.startOf('month').valueOf(),
      toMs: endMs,
    };
  }
  return {
    fromMs: now.subtract(89, 'day').startOf('day').valueOf(),
    toMs: endMs,
  };
};

const yearRange = (): Range => {
  const now = dayjs();
  return {
    fromMs: now.subtract(1, 'year').startOf('day').valueOf(),
    toMs: now.endOf('day').add(1, 'millisecond').valueOf(),
  };
};

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const items = useDoneStore((s) => s.items); // used as refresh trigger

  const [range, setRange] = useState<RangeKey>('week');
  const [daily, setDaily] = useState<DailyCount[]>([]);
  const [byTag, setByTag] = useState<TagCount[]>([]);
  const [yearDaily, setYearDaily] = useState<DailyCount[]>([]);
  const [streak, setStreak] = useState(0);

  const windowRange = useMemo(() => rangeFor(range), [range]);

  useEffect(() => {
    (async () => {
      const [d, t] = await Promise.all([
        countByDay(windowRange.fromMs, windowRange.toMs),
        countByTag(windowRange.fromMs, windowRange.toMs),
      ]);
      setDaily(d);
      setByTag(t);
    })();
  }, [windowRange, items.length]);

  useEffect(() => {
    (async () => {
      const yr = yearRange();
      const [y, s] = await Promise.all([
        countByDay(yr.fromMs, yr.toMs),
        currentStreak(),
      ]);
      setYearDaily(y);
      setStreak(s);
    })();
  }, [items.length]);

  const total = useMemo(
    () => daily.reduce((s, d) => s + d.count, 0),
    [daily]
  );
  const topTag = useMemo(
    () => byTag.find((b) => b.tagId !== null) ?? null,
    [byTag]
  );

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

        <View style={[styles.section, styles.cardRow]}>
          <StatCard label="累计" value={total} hint={rangeLabel(range)} />
          <StatCard
            label="连续天数"
            value={streak}
            hint={streak > 0 ? '继续保持 ✓' : '从今天开始'}
          />
          <StatCard
            label="常用标签"
            value={topTag ? `#${topTag.name}` : '—'}
            hint={topTag ? `${topTag.count} 条` : '没有标签记录'}
          />
        </View>

        <TrendChart
          data={daily}
          fromMs={windowRange.fromMs}
          toMs={windowRange.toMs}
        />
        <TagPieChart data={byTag} />
        <ContributionHeatmap data={yearDaily} />
      </ScrollView>
    </SafeAreaView>
  );
}

const rangeLabel = (r: RangeKey) =>
  r === 'week' ? '本周' : r === 'month' ? '本月' : '90 天';

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
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
