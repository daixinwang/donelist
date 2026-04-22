import dayjs from 'dayjs';
import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { DoneItem } from '@/db/types';

type Props = {
  items: DoneItem[];
  fromMs: number;
  toMs: number;
};

const WEEKDAY_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

type StackBucket = {
  key: string;
  name: string;
  color: string;
};

export function TrendChart({ items, fromMs, toMs }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const { stackData, buckets, total, maxVal } = useMemo(() => {
    const start = dayjs(fromMs).startOf('day');
    const endExclusive = dayjs(toMs).startOf('day');
    const dayCount = Math.max(1, endExclusive.diff(start, 'day'));

    // bucketKey → metadata (stable insertion order drives stack layering)
    const bucketMeta = new Map<string, StackBucket>();
    // dayKey → bucketKey → count
    const byDay = new Map<string, Map<string, number>>();

    for (let i = 0; i < dayCount; i++) {
      byDay.set(start.add(i, 'day').format('YYYY-MM-DD'), new Map());
    }

    let totalCount = 0;
    for (const it of items) {
      if (it.completedAt < fromMs || it.completedAt >= toMs) continue;
      const dayKey = dayjs(it.completedAt).format('YYYY-MM-DD');
      const dayMap = byDay.get(dayKey);
      if (!dayMap) continue;
      totalCount += 1;

      // Primary tag = first tag by sort_order, falling back to "no tag".
      const primary = it.tags[0];
      const bucketKey = primary ? `t${primary.id}` : '__untagged';
      if (!bucketMeta.has(bucketKey)) {
        bucketMeta.set(bucketKey, {
          key: bucketKey,
          name: primary?.name ?? '无标签',
          color: primary?.color ?? colors.textSubtle,
        });
      }
      dayMap.set(bucketKey, (dayMap.get(bucketKey) ?? 0) + 1);
    }

    // Stable bucket order: tagged first (in first-seen order), untagged last
    const bucketList = Array.from(bucketMeta.values()).sort((a, b) => {
      if (a.key === '__untagged') return 1;
      if (b.key === '__untagged') return -1;
      return 0;
    });

    let highestColumn = 1;
    const rows: {
      stacks: { value: number; color: string }[];
      label: string;
    }[] = [];

    for (let i = 0; i < dayCount; i++) {
      const d = start.add(i, 'day');
      const dayKey = d.format('YYYY-MM-DD');
      const dayMap = byDay.get(dayKey) ?? new Map();

      const stacks = bucketList
        .map((bucket) => ({
          value: dayMap.get(bucket.key) ?? 0,
          color: bucket.color,
        }))
        .filter((seg) => seg.value > 0);
      const column = stacks.reduce((s, seg) => s + seg.value, 0);
      if (column > highestColumn) highestColumn = column;

      let label = '';
      if (dayCount <= 7) {
        label = WEEKDAY_SHORT[(d.day() + 6) % 7];
      } else if (dayCount <= 35) {
        if (i === 0 || d.date() === 1 || d.date() % 5 === 0) {
          label = String(d.date());
        }
      } else {
        if (i === 0 || d.date() === 1) label = d.format('M月');
      }

      rows.push({
        stacks:
          stacks.length > 0
            ? stacks
            : [{ value: 0, color: 'transparent' }],
        label,
      });
    }

    return {
      stackData: rows,
      buckets: bucketList,
      total: totalCount,
      maxVal: highestColumn,
    };
  }, [items, fromMs, toMs, colors.textSubtle]);

  const count = stackData.length;
  const scrollable = count > 35;
  const spacing = count <= 7 ? 10 : 3;
  const availWidth = width - Spacing.lg * 2 - 40;
  const fitWidth = (availWidth - (count - 1) * spacing) / count;
  const barWidth = scrollable
    ? 14
    : count <= 7
    ? Math.min(36, Math.floor(fitWidth))
    : Math.max(6, Math.floor(fitWidth));
  const labelWidth = Math.max(barWidth + spacing, count <= 7 ? 36 : 22);

  // gifted-charts 对每个柱子都渲染一个 labelWidth+spacing 宽的 label 容器，
  // 柱子密集时相邻容器严重重叠，2 位数 label 会被 RN 的 Text 截断成 "…"。
  // 改用 labelComponent 画一个比容器更宽的 View，让文字溢出容器但居中对齐柱子。
  const LABEL_BOX = 40;
  const labelMarginLeft = (barWidth + spacing) / 2 - LABEL_BOX / 2;
  const chartStackData = useMemo(
    () =>
      stackData.map((row) => {
        if (!row.label) {
          return { stacks: row.stacks, label: '' };
        }
        return {
          stacks: row.stacks,
          label: '',
          labelComponent: () => (
            <View
              style={{
                width: LABEL_BOX,
                marginLeft: labelMarginLeft,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 10,
                }}
                numberOfLines={1}>
                {row.label}
              </Text>
            </View>
          ),
        };
      }),
    [stackData, labelMarginLeft, colors.textSubtle]
  );

  return (
    <View style={styles.wrapper}>
      <ThemedText type="subtitle">完成趋势</ThemedText>
      <ThemedText type="caption">共 {total} 条</ThemedText>
      <View style={{ marginTop: Spacing.sm }}>
        <BarChart
          // gifted-charts 的 RenderStackBars 动画 useEffect 依赖为空，
          // 数据后到时柱子高度会卡在 0；用 key 强制在数据变化时 remount。
          key={`${fromMs}-${toMs}-${total}-${maxVal}`}
          stackData={chartStackData}
          barWidth={barWidth}
          spacing={spacing}
          labelWidth={labelWidth}
          noOfSections={Math.min(4, Math.max(2, maxVal))}
          maxValue={Math.max(2, maxVal)}
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
      {buckets.length > 0 && (
        <View style={styles.legend}>
          {buckets.map((b) => (
            <View key={b.key} style={styles.legendItem}>
              <View
                style={[styles.dot, { backgroundColor: b.color }]}
              />
              <ThemedText
                type="caption"
                style={{ color: colors.textMuted }}>
                {b.name}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  legend: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
});
