import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DailyCount } from '@/db/queries/stats';

type Props = {
  data: DailyCount[];
  /** inclusive end date; defaults to today */
  endDate?: Date;
  onCellPress?: (dayKey: string, count: number) => void;
};

const WEEKS = 53;
const DAYS = 7;
const CELL = 12;
const GAP = 2;
const PADDING_TOP = 18;
const PADDING_LEFT = 22;

const levelFor = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
};

export function ContributionHeatmap({ data, endDate, onCellPress }: Props) {
  const { colors } = useAppTheme();
  const scheme = useColorScheme() ?? 'light';
  const { width: winWidth } = useWindowDimensions();
  const [tooltip, setTooltip] = useState<{
    day: string;
    count: number;
  } | null>(null);

  const palette = [
    Colors[scheme].heatmapEmpty,
    Colors[scheme].heatmap1,
    Colors[scheme].heatmap2,
    Colors[scheme].heatmap3,
    Colors[scheme].heatmap4,
  ];

  const end = dayjs(endDate ?? new Date()).startOf('day');
  // Align right-most column to the week that contains endDate.
  // Week starts on Monday (0=Mon..6=Sun).
  const endWeekday = (end.day() + 6) % 7;
  const start = end
    .subtract((WEEKS - 1) * 7 + endWeekday, 'day')
    .startOf('day');

  const grid = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d.count]));
    const cells: { day: string; count: number; x: number; y: number }[] = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const cur = start.add(w * 7 + d, 'day');
        if (cur.isAfter(end, 'day')) continue;
        const key = cur.format('YYYY-MM-DD');
        cells.push({
          day: key,
          count: map.get(key) ?? 0,
          x: PADDING_LEFT + w * (CELL + GAP),
          y: PADDING_TOP + d * (CELL + GAP),
        });
      }
    }
    return cells;
  }, [data, start, end]);

  const totalWidth = PADDING_LEFT + WEEKS * (CELL + GAP);
  const totalHeight = PADDING_TOP + DAYS * (CELL + GAP) + 6;
  const contentWidth = Math.max(totalWidth, winWidth - Spacing.lg * 2);

  const handlePress = (cell: { day: string; count: number }) => {
    setTooltip({ day: cell.day, count: cell.count });
    onCellPress?.(cell.day, cell.count);
  };

  const monthMarkers = useMemo(() => {
    const markers: { x: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const firstOfWeek = start.add(w * 7, 'day');
      const m = firstOfWeek.month();
      if (m !== lastMonth) {
        markers.push({
          x: PADDING_LEFT + w * (CELL + GAP),
          label: firstOfWeek.format('M月'),
        });
        lastMonth = m;
      }
    }
    return markers;
  }, [start]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <ThemedText type="subtitle">一年热力</ThemedText>
        <Legend palette={palette} textColor={colors.textSubtle} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={contentWidth} height={totalHeight}>
          <G>
            {monthMarkers.map((mk, i) => (
              <SvgText
                key={i}
                x={mk.x}
                y={12}
                fontSize={9}
                fill={colors.textSubtle}>
                {mk.label}
              </SvgText>
            ))}
            {['一', '三', '五'].map((d, i) => (
              <SvgText
                key={d}
                x={2}
                y={PADDING_TOP + (i * 2 + 1) * (CELL + GAP) - 2}
                fontSize={9}
                fill={colors.textSubtle}>
                {d}
              </SvgText>
            ))}
            {grid.map((cell) => (
              <Rect
                key={cell.day}
                x={cell.x}
                y={cell.y}
                width={CELL}
                height={CELL}
                rx={2}
                ry={2}
                fill={palette[levelFor(cell.count)]}
                onPress={() => handlePress(cell)}
              />
            ))}
          </G>
        </Svg>
      </ScrollView>
      {tooltip && (
        <Pressable onPress={() => setTooltip(null)}>
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}>
            <ThemedText>
              {tooltip.day} · {tooltip.count} 条
            </ThemedText>
          </View>
        </Pressable>
      )}
    </View>
  );
}

function Legend({
  palette,
  textColor,
}: {
  palette: string[];
  textColor: string;
}) {
  return (
    <View style={legendStyles.row}>
      <ThemedText type="caption" style={{ color: textColor }}>
        少
      </ThemedText>
      {palette.map((c, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: c,
          }}
        />
      ))}
      <ThemedText type="caption" style={{ color: textColor }}>
        多
      </ThemedText>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
