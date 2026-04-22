import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeekCalendar } from '@/components/week/week-calendar';
import { Radius, Spacing } from '@/constants/theme';
import { listDoneItemsInRange } from '@/db/queries/done-items';
import type { DoneItem } from '@/db/types';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { startOfWeek } from '@/utils/date';

export default function WeekScreen() {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const items = useDoneStore((s) => s.items); // refresh trigger

  const [weekStartMs, setWeekStartMs] = useState<number>(() =>
    startOfWeek(Date.now())
  );
  const [weekItems, setWeekItems] = useState<DoneItem[]>([]);

  const weekEndMs = useMemo(
    () => dayjs(weekStartMs).add(7, 'day').valueOf(),
    [weekStartMs]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listDoneItemsInRange(weekStartMs, weekEndMs);
      if (!cancelled) setWeekItems(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [weekStartMs, weekEndMs, items.length]);

  const start = dayjs(weekStartMs);
  const end = dayjs(weekStartMs).add(6, 'day');
  const sameMonth = start.month() === end.month();
  const rangeLabel = sameMonth
    ? `${start.format('M月D日')} – ${end.format('D日')}`
    : `${start.format('M月D日')} – ${end.format('M月D日')}`;

  const shiftWeek = (delta: number) => {
    haptics.selection();
    setWeekStartMs(dayjs(weekStartMs).add(delta * 7, 'day').valueOf());
  };

  const jumpToday = () => {
    haptics.selection();
    setWeekStartMs(startOfWeek(Date.now()));
  };

  const isCurrentWeek = weekStartMs === startOfWeek(Date.now());

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText type="title">周视图</ThemedText>
          <ThemedText type="muted">
            {isCurrentWeek ? '本周 · ' : ''}
            {rangeLabel}
          </ThemedText>
        </View>
        <View style={styles.navGroup}>
          <NavButton
            onPress={() => shiftWeek(-1)}
            icon="chevron.left"
            colors={colors}
          />
          <Pressable
            onPress={jumpToday}
            style={({ pressed }) => [
              styles.todayPill,
              {
                backgroundColor: isCurrentWeek ? colors.primary : colors.surface,
                borderColor: isCurrentWeek ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <ThemedText
              style={{
                color: isCurrentWeek ? colors.surface : colors.text,
                fontWeight: '600',
                fontSize: 13,
              }}>
              今天
            </ThemedText>
          </Pressable>
          <NavButton
            onPress={() => shiftWeek(1)}
            icon="chevron.right"
            colors={colors}
          />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
        <WeekCalendar weekStartMs={weekStartMs} items={weekItems} />
      </View>
    </SafeAreaView>
  );
}

function NavButton({
  onPress,
  icon,
  colors,
}: {
  onPress: () => void;
  icon: 'chevron.left' | 'chevron.right';
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.navButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <IconSymbol name={icon} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
