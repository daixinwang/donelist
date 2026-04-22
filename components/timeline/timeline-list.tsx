import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { DayHeader } from '@/components/timeline/day-header';
import { DoneItemCard } from '@/components/timeline/done-item-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { DoneItem } from '@/db/types';
import { formatDayKey } from '@/utils/date';

type Section = { dayKey: string; data: DoneItem[] };

function groupByDay(items: DoneItem[]): Section[] {
  const map = new Map<string, DoneItem[]>();
  for (const it of items) {
    const key = formatDayKey(it.completedAt);
    const arr = map.get(key) ?? [];
    arr.push(it);
    map.set(key, arr);
  }
  const keys = Array.from(map.keys()).sort().reverse();
  return keys.map((k) => ({
    dayKey: k,
    data: map.get(k)!.sort((a, b) => b.completedAt - a.completedAt),
  }));
}

export function TimelineList({
  items,
  ListHeaderComponent,
}: {
  items: DoneItem[];
  ListHeaderComponent?: React.ReactElement;
}) {
  const { colors } = useAppTheme();
  const sections = useMemo(() => groupByDay(items), [items]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <DoneItemCard item={item} />}
      renderSectionHeader={({ section }) => (
        <DayHeader dayKey={section.dayKey} count={section.data.length} />
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <ThemedText type="title" style={{ color: colors.primarySoft }}>
            ✓
          </ThemedText>
          <ThemedText type="muted" style={{ textAlign: 'center' }}>
            打个头阵——{'\n'}把刚刚做成的事，记在这里。
          </ThemedText>
        </View>
      }
      contentContainerStyle={{ paddingBottom: Spacing.xxl * 2 }}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
});
