import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { DoneItem } from '@/db/types';

const HOUR_HEIGHT = 40;
const AXIS_WIDTH = 36;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_BLOCK_HEIGHT = 14;
/** Hour placed at the top of the viewport when the screen first opens. */
const INITIAL_SCROLL_HOUR = 9;

type Props = {
  /** UTC ms for 00:00 of the Monday (week start). */
  weekStartMs: number;
  items: DoneItem[];
};

type PositionedBlock = {
  id: number;
  dayIndex: number;
  top: number;
  height: number;
  color: string;
  content: string;
};

export function WeekCalendar({ weekStartMs, items }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const dayColumnWidth = (width - AXIS_WIDTH - Spacing.lg * 2) / 7;
  const start = useMemo(() => dayjs(weekStartMs).startOf('day'), [weekStartMs]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => start.add(i, 'day')),
    [start]
  );

  const blocks = useMemo<PositionedBlock[]>(() => {
    const list: PositionedBlock[] = [];
    for (const it of items) {
      // Clip the item to each day it intersects within the week
      for (let i = 0; i < 7; i++) {
        const dayStart = start.add(i, 'day').valueOf();
        const dayEnd = start.add(i + 1, 'day').valueOf();
        const segStart = Math.max(it.startedAt, dayStart);
        const segEnd = Math.max(Math.min(it.completedAt, dayEnd), segStart);
        if (segEnd <= dayStart || segStart >= dayEnd) continue;

        const minutesFromMidnight =
          (segStart - dayStart) / 60_000;
        const durationMin = Math.max(1, (segEnd - segStart) / 60_000);
        const top = (minutesFromMidnight / 60) * HOUR_HEIGHT;
        const height = Math.max(
          MIN_BLOCK_HEIGHT,
          (durationMin / 60) * HOUR_HEIGHT
        );
        const color = it.tags[0]?.color ?? colors.primary;
        list.push({
          id: it.id,
          dayIndex: i,
          top,
          height,
          color,
          content: it.content,
        });
      }
    }
    return list;
  }, [items, start, colors.primary]);

  // Anchor 09:00 at the top whenever the week changes; leave earlier
  // hours a swipe away instead of dictating where to look.
  useEffect(() => {
    const y = INITIAL_SCROLL_HOUR * HOUR_HEIGHT;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 60);
    return () => clearTimeout(t);
  }, [weekStartMs]);

  // Tick the now indicator every minute
  useEffect(() => {
    const int = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(int);
  }, []);

  const weekEnd = start.add(7, 'day').valueOf();
  const showNowLine = nowMs >= start.valueOf() && nowMs < weekEnd;
  const nowDayIndex = showNowLine
    ? Math.floor((nowMs - start.valueOf()) / (24 * 60 * 60_000))
    : -1;
  const nowTop = showNowLine
    ? ((nowMs - start.add(nowDayIndex, 'day').valueOf()) / 60_000 / 60) *
      HOUR_HEIGHT
    : 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Day header row */}
      <View
        style={[
          styles.dayHeaderRow,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}>
        <View style={{ width: AXIS_WIDTH }} />
        {days.map((d, i) => {
          const isToday = d.isSame(dayjs(), 'day');
          return (
            <View
              key={i}
              style={[
                styles.dayHeaderCell,
                { width: dayColumnWidth },
              ]}>
              <ThemedText
                type="caption"
                style={{ color: colors.textMuted }}>
                {['一', '二', '三', '四', '五', '六', '日'][i]}
              </ThemedText>
              <View
                style={[
                  styles.dayDateBadge,
                  isToday && { backgroundColor: colors.accent },
                ]}>
                <ThemedText
                  style={{
                    color: isToday ? colors.surface : colors.text,
                    fontWeight: isToday ? '700' : '500',
                    fontSize: 14,
                  }}>
                  {d.date()}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      {/* Scrollable grid */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        <View style={{ height: 24 * HOUR_HEIGHT, flexDirection: 'row' }}>
          {/* Left time axis */}
          <View style={{ width: AXIS_WIDTH }}>
            {HOURS.map((h) => (
              <View
                key={h}
                style={{
                  height: HOUR_HEIGHT,
                  justifyContent: 'flex-start',
                  paddingTop: 2,
                  alignItems: 'flex-end',
                  paddingRight: 6,
                }}>
                <ThemedText
                  type="caption"
                  style={{
                    color: colors.textSubtle,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {String(h).padStart(2, '0')}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Day columns with grid lines & blocks */}
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Horizontal hour grid lines */}
            {HOURS.map((h) => (
              <View
                key={h}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: h * HOUR_HEIGHT,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
            ))}
            {/* Task blocks */}
            {blocks.map((b, idx) => (
              <Pressable
                key={`${b.id}-${b.dayIndex}-${idx}`}
                onPress={() => router.push(`/item/${b.id}`)}
                style={({ pressed }) => [
                  styles.block,
                  {
                    left: b.dayIndex * dayColumnWidth + 2,
                    top: b.top,
                    width: dayColumnWidth - 4,
                    height: b.height - 2,
                    backgroundColor: b.color,
                    opacity: pressed ? 0.8 : 0.9,
                  },
                ]}>
                <ThemedText
                  numberOfLines={b.height > 28 ? 2 : 1}
                  style={{
                    color: colors.surface,
                    fontSize: 11,
                    lineHeight: 14,
                    fontWeight: '500',
                  }}>
                  {b.content}
                </ThemedText>
              </Pressable>
            ))}
            {/* Now indicator */}
            {showNowLine && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: nowDayIndex * dayColumnWidth,
                  width: dayColumnWidth,
                  top: nowTop,
                  height: 2,
                  backgroundColor: colors.danger,
                }}>
                <View
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: -3,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.danger,
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 6,
    paddingTop: 4,
  },
  dayHeaderCell: {
    alignItems: 'center',
    gap: 4,
  },
  dayDateBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  block: {
    position: 'absolute',
    borderRadius: Radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
});
