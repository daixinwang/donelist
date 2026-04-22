import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import { formatDuration, formatFullDateTime, formatTime } from '@/utils/date';

type Props = {
  startedAt: number;
  completedAt: number;
  onChange: (v: { startedAt: number; completedAt: number }) => void;
  /** Compact mode: single-row display without section labels. */
  compact?: boolean;
  /** Custom chip durations in minutes. Default: 15, 30, 60, 120. */
  chipDurationsMin?: number[];
  /** Show full date for each endpoint (used in edit modal). */
  showFullDate?: boolean;
  /**
   * Time-only mode: picker shows a wheel for HH:mm, date portion of
   * the underlying value is preserved. Use when the task is known to
   * belong to a single fixed day (e.g. "record what I just finished").
   */
  timeOnly?: boolean;
};

const DEFAULT_CHIPS = [15, 30, 60, 120];

export function DurationPicker({
  startedAt,
  completedAt,
  onChange,
  compact,
  chipDurationsMin = DEFAULT_CHIPS,
  showFullDate,
  timeOnly,
}: Props) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const [picker, setPicker] = useState<
    null | { target: 'start' | 'end'; mode: 'date' | 'time' }
  >(null);

  const durationMs = Math.max(0, completedAt - startedAt);
  const currentDurationMin = Math.round(durationMs / 60_000);

  const applyChip = (minutes: number) => {
    haptics.selection();
    onChange({
      startedAt: completedAt - minutes * 60_000,
      completedAt,
    });
  };

  const openPicker = (target: 'start' | 'end') => {
    haptics.light();
    setPicker({
      target,
      mode: timeOnly ? 'time' : 'date',
    });
  };

  const applyChange = (target: 'start' | 'end', next: number) => {
    if (target === 'start') {
      const clamped = Math.min(next, completedAt);
      onChange({ startedAt: clamped, completedAt });
    } else {
      const clamped = Math.max(next, startedAt);
      onChange({ startedAt, completedAt: clamped });
    }
  };

  /** Merge HH:mm from `picked` into the existing value (preserving date). */
  const mergeTime = (target: 'start' | 'end', picked: Date) => {
    const prev = target === 'start' ? startedAt : completedAt;
    const merged = new Date(prev);
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    applyChange(target, merged.getTime());
  };

  const handlePicked = (_e: DateTimePickerEvent, date?: Date) => {
    if (!picker) return;

    if (timeOnly) {
      // Single time picker on both platforms. Android dismisses after
      // the callback; iOS inline spinner keeps firing until picker closes.
      if (Platform.OS === 'android') setPicker(null);
      if (date) mergeTime(picker.target, date);
      return;
    }

    if (Platform.OS === 'android' && picker.mode === 'date') {
      if (!date) {
        setPicker(null);
        return;
      }
      const prev = picker.target === 'start' ? startedAt : completedAt;
      const merged = new Date(prev);
      merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      applyChange(picker.target, merged.getTime());
      setPicker({ target: picker.target, mode: 'time' });
      return;
    }
    if (Platform.OS === 'android' && picker.mode === 'time') {
      setPicker(null);
      if (date) mergeTime(picker.target, date);
      return;
    }
    // iOS inline datetime
    if (date) applyChange(picker.target, date.getTime());
  };

  return (
    <View style={styles.wrapper}>
      {!compact && (
        <ThemedText type="muted" style={styles.sectionLabel}>
          持续时长
        </ThemedText>
      )}
      <View style={styles.chipsRow}>
        {chipDurationsMin.map((m) => {
          const selected = m === currentDurationMin;
          return (
            <Pressable
              key={m}
              onPress={() => applyChip(m)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : 'transparent',
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <ThemedText
                style={{
                  color: selected ? colors.surface : colors.text,
                  fontSize: 13,
                }}>
                {formatDurationLabel(m)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.rangeRow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <Pressable
          onPress={() => openPicker('start')}
          style={styles.rangeHalf}>
          <ThemedText type="caption">开始</ThemedText>
          <ThemedText style={{ fontVariant: ['tabular-nums'] }}>
            {showFullDate
              ? formatFullDateTime(startedAt)
              : formatTime(startedAt)}
          </ThemedText>
        </Pressable>
        <View style={[styles.arrowCell]}>
          <ThemedText
            type="caption"
            style={{ color: colors.textSubtle }}>
            →
          </ThemedText>
          <ThemedText
            type="caption"
            style={{ color: colors.accent, fontWeight: '600' }}>
            {formatDuration(durationMs)}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => openPicker('end')}
          style={[styles.rangeHalf, { alignItems: 'flex-end' }]}>
          <ThemedText type="caption">结束</ThemedText>
          <ThemedText style={{ fontVariant: ['tabular-nums'] }}>
            {showFullDate
              ? formatFullDateTime(completedAt)
              : formatTime(completedAt)}
          </ThemedText>
        </Pressable>
      </View>

      {picker && timeOnly && (
        <DateTimePicker
          value={new Date(picker.target === 'start' ? startedAt : completedAt)}
          mode="time"
          display="spinner"
          is24Hour
          onChange={handlePicked}
          themeVariant={colors.background === '#1C211E' ? 'dark' : 'light'}
        />
      )}
      {picker && !timeOnly && Platform.OS === 'ios' && (
        <DateTimePicker
          value={new Date(picker.target === 'start' ? startedAt : completedAt)}
          mode="datetime"
          display="inline"
          onChange={handlePicked}
          themeVariant={colors.background === '#1C211E' ? 'dark' : 'light'}
        />
      )}
      {picker && !timeOnly && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={new Date(picker.target === 'start' ? startedAt : completedAt)}
          mode={picker.mode}
          is24Hour
          onChange={handlePicked}
        />
      )}
    </View>
  );
}

function formatDurationLabel(min: number): string {
  if (min < 60) return `${min}分`;
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  rangeRow: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rangeHalf: {
    flex: 1,
    gap: 2,
  },
  arrowCell: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
  },
});
