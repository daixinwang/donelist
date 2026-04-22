import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import {
  MAX_DURATION_CHIPS,
  MIN_DURATION_CHIPS,
  useSettingsStore,
} from '@/store/use-settings-store';
import { formatDuration, formatTime } from '@/utils/date';

type Props = {
  startedAt: number;
  completedAt: number;
  onChange: (v: { startedAt: number; completedAt: number }) => void;
  /** Compact mode: single-row display without section labels. */
  compact?: boolean;
  /**
   * Time-only mode: picker is a wheel for HH:mm, the date portion
   * of the underlying value is preserved. Use when the task is
   * known to belong to a single fixed day (e.g. "record what I
   * just finished"). When false, date and time are separate
   * tappable targets.
   */
  timeOnly?: boolean;
};

type PickerState =
  | null
  | { target: 'start' | 'end'; mode: 'date' | 'time' };

type Unit = 'min' | 'h';

export function DurationPicker({
  startedAt,
  completedAt,
  onChange,
  compact,
  timeOnly,
}: Props) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const chipDurationsMin = useSettingsStore((s) => s.durationChipsMin);
  const addDurationChip = useSettingsStore((s) => s.addDurationChip);
  const removeDurationChip = useSettingsStore((s) => s.removeDurationChip);

  const [picker, setPicker] = useState<PickerState>(null);
  const [addDialog, setAddDialog] = useState<null | {
    value: string;
    unit: Unit;
  }>(null);

  const durationMs = Math.max(0, completedAt - startedAt);
  const currentDurationMin = Math.round(durationMs / 60_000);

  const applyChip = (minutes: number) => {
    haptics.selection();
    onChange({
      startedAt: completedAt - minutes * 60_000,
      completedAt,
    });
  };

  const confirmRemoveChip = (minutes: number) => {
    if (chipDurationsMin.length <= MIN_DURATION_CHIPS) {
      Alert.alert('至少保留 2 个常用时长');
      return;
    }
    Alert.alert(
      '删除这个时长？',
      `${formatChipLabel(minutes)} 将从常用列表移除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            removeDurationChip(minutes);
          },
        },
      ]
    );
  };

  const openPicker = (
    target: 'start' | 'end',
    mode: 'date' | 'time'
  ) => {
    haptics.light();
    setPicker({ target, mode });
  };

  const applyChange = (target: 'start' | 'end', next: number) => {
    if (target === 'start') {
      onChange({
        startedAt: Math.min(next, completedAt),
        completedAt,
      });
    } else {
      onChange({
        startedAt,
        completedAt: Math.max(next, startedAt),
      });
    }
  };

  const handlePicked = (_e: DateTimePickerEvent, picked?: Date) => {
    if (!picker) return;
    const isAndroid = Platform.OS === 'android';
    if (isAndroid) setPicker(null);
    if (!picked) return;

    const prev =
      picker.target === 'start' ? startedAt : completedAt;
    const merged = new Date(prev);
    if (picker.mode === 'date') {
      merged.setFullYear(
        picked.getFullYear(),
        picked.getMonth(),
        picked.getDate()
      );
    } else {
      merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    }
    applyChange(picker.target, merged.getTime());
  };

  const commitAddChip = () => {
    if (!addDialog) return;
    const n = parseFloat(addDialog.value);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('请输入正数');
      return;
    }
    const minutes = Math.round(
      addDialog.unit === 'h' ? n * 60 : n
    );
    if (chipDurationsMin.includes(minutes)) {
      Alert.alert('已存在', `${formatChipLabel(minutes)} 已经在列表中。`);
      return;
    }
    if (minutes > 60 * 24) {
      Alert.alert('时长过长', '最多支持 24 小时。');
      return;
    }
    addDurationChip(minutes);
    haptics.success();
    setAddDialog(null);
  };

  const pickerValueMs =
    picker?.target === 'start' ? startedAt : completedAt;
  const atChipCap = chipDurationsMin.length >= MAX_DURATION_CHIPS;

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
              onLongPress={() => confirmRemoveChip(m)}
              delayLongPress={400}
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
                {formatChipLabel(m)}
              </ThemedText>
            </Pressable>
          );
        })}
        {!atChipCap && (
          <Pressable
            onPress={() => setAddDialog({ value: '', unit: 'min' })}
            style={[
              styles.chip,
              styles.addChip,
              { borderColor: colors.border },
            ]}
            accessibilityLabel="添加常用时长">
            <IconSymbol name="plus" size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {timeOnly ? (
        <View
          style={[
            styles.rangeRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <Pressable
            style={styles.endpointTimeOnly}
            onPress={() => openPicker('start', 'time')}>
            <ThemedText type="caption">开始</ThemedText>
            <ThemedText style={styles.timeText}>
              {formatTime(startedAt)}
            </ThemedText>
          </Pressable>
          <View style={styles.arrowCell}>
            <ThemedText type="caption" style={{ color: colors.textSubtle }}>
              →
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: colors.accent, fontWeight: '600' }}>
              {formatDuration(durationMs)}
            </ThemedText>
          </View>
          <Pressable
            style={[styles.endpointTimeOnly, { alignItems: 'flex-end' }]}
            onPress={() => openPicker('end', 'time')}>
            <ThemedText type="caption">结束</ThemedText>
            <ThemedText style={styles.timeText}>
              {formatTime(completedAt)}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.rangeRow,
            styles.rangeRowFull,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <EndpointColumn
            label="开始"
            valueMs={startedAt}
            onTapDate={() => openPicker('start', 'date')}
            onTapTime={() => openPicker('start', 'time')}
          />
          <View style={styles.arrowCell}>
            <ThemedText type="caption" style={{ color: colors.textSubtle }}>
              →
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: colors.accent, fontWeight: '600' }}>
              {formatDuration(durationMs)}
            </ThemedText>
          </View>
          <EndpointColumn
            label="结束"
            valueMs={completedAt}
            onTapDate={() => openPicker('end', 'date')}
            onTapTime={() => openPicker('end', 'time')}
            alignEnd
          />
        </View>
      )}

      {/* iOS inline picker */}
      {picker && Platform.OS === 'ios' && (
        <View
          style={[
            styles.iosPickerCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <DateTimePicker
            value={new Date(pickerValueMs)}
            mode={picker.mode}
            display={picker.mode === 'time' ? 'spinner' : 'inline'}
            is24Hour
            onChange={handlePicked}
            themeVariant={
              colors.background === '#1C211E' ? 'dark' : 'light'
            }
          />
          <Pressable
            onPress={() => setPicker(null)}
            style={[styles.iosDoneButton, { backgroundColor: colors.accent }]}>
            <ThemedText style={{ color: colors.surface, fontWeight: '600' }}>
              完成
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Android native dialog */}
      {picker && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={new Date(pickerValueMs)}
          mode={picker.mode}
          display={picker.mode === 'time' ? 'spinner' : 'default'}
          is24Hour
          onChange={handlePicked}
        />
      )}

      {/* Add-chip modal */}
      <Modal
        visible={addDialog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAddDialog(null)}>
        <Pressable
          style={styles.addBackdrop}
          onPress={() => setAddDialog(null)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.addSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <ThemedText type="subtitle">添加常用时长</ThemedText>
            <ThemedText type="muted" style={{ marginTop: 4 }}>
              最多 {MAX_DURATION_CHIPS} 个，长按已有 chip 可删除
            </ThemedText>

            <View style={styles.addInputRow}>
              <TextInput
                value={addDialog?.value ?? ''}
                onChangeText={(v) =>
                  setAddDialog((prev) => (prev ? { ...prev, value: v } : prev))
                }
                keyboardType="number-pad"
                placeholder="数字"
                placeholderTextColor={colors.textSubtle}
                autoFocus
                style={[
                  styles.addInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              />
              <View
                style={[
                  styles.unitToggle,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                {(['min', 'h'] as const).map((u) => {
                  const active = addDialog?.unit === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() =>
                        setAddDialog((prev) =>
                          prev ? { ...prev, unit: u } : prev
                        )
                      }
                      style={[
                        styles.unitOption,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : 'transparent',
                        },
                      ]}>
                      <ThemedText
                        style={{
                          color: active ? colors.surface : colors.textMuted,
                          fontWeight: active ? '600' : '400',
                          fontSize: 13,
                        }}>
                        {u}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.addActions}>
              <Pressable
                onPress={() => setAddDialog(null)}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: colors.surfaceAlt,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <ThemedText style={{ color: colors.textMuted }}>
                  取消
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={commitAddChip}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <ThemedText style={{ color: colors.surface, fontWeight: '600' }}>
                  添加
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function EndpointColumn({
  label,
  valueMs,
  onTapDate,
  onTapTime,
  alignEnd,
}: {
  label: string;
  valueMs: number;
  onTapDate: () => void;
  onTapTime: () => void;
  alignEnd?: boolean;
}) {
  const { colors } = useAppTheme();
  const d = new Date(valueMs);
  const dateText = `${d.getMonth() + 1}月${d.getDate()}日`;
  return (
    <View style={[styles.endpointCol, alignEnd && { alignItems: 'flex-end' }]}>
      <ThemedText type="caption">{label}</ThemedText>
      <Pressable
        onPress={onTapDate}
        style={[
          styles.endpointButton,
          { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
        ]}>
        <ThemedText style={styles.endpointText}>{dateText}</ThemedText>
      </Pressable>
      <Pressable
        onPress={onTapTime}
        style={[
          styles.endpointButton,
          { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
        ]}>
        <ThemedText style={[styles.endpointText, styles.timeText]}>
          {formatTime(valueMs)}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function formatChipLabel(min: number): string {
  if (min < 60 || min % 60 !== 0) return `${min}min`;
  const h = min / 60;
  return `${h}h`;
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
  addChip: {
    width: 34,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
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
  rangeRowFull: {
    paddingVertical: Spacing.md,
  },
  endpointTimeOnly: {
    flex: 1,
    gap: 2,
  },
  endpointCol: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-start',
  },
  endpointButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  endpointText: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  timeText: {
    fontVariant: ['tabular-nums'],
  },
  arrowCell: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
  },
  iosPickerCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  iosDoneButton: {
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  // Add-chip modal
  addBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  addSheet: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    gap: Spacing.sm,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  unitOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
