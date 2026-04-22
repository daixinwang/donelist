import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfettiOverlay } from '@/components/common/confetti-overlay';
import { DurationPicker } from '@/components/input/duration-picker';
import { QuickInputBar } from '@/components/input/quick-input-bar';
import { TagChipSelector } from '@/components/input/tag-chip-selector';
import { ThemedText } from '@/components/themed-text';
import { TimelineList } from '@/components/timeline/timeline-list';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { useTagStore } from '@/store/use-tag-store';

const DEFAULT_DURATION_MIN = 30;

function freshRange(durationMin: number) {
  const completedAt = Date.now();
  return {
    startedAt: completedAt - durationMin * 60_000,
    completedAt,
  };
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const addItem = useDoneStore((s) => s.add);
  const items = useDoneStore((s) => s.items);
  const tags = useTagStore((s) => s.tags);

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [range, setRange] = useState(() => freshRange(DEFAULT_DURATION_MIN));
  const [confettiTick, setConfettiTick] = useState(0);

  const currentDurationMin = Math.max(
    1,
    Math.round((range.completedAt - range.startedAt) / 60_000)
  );

  const toggleTag = (id: number) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleSubmit = async (text: string) => {
    await addItem({
      content: text,
      startedAt: range.startedAt,
      completedAt: range.completedAt,
      tagIds: selectedTagIds,
    });
    setConfettiTick((n) => n + 1);
    // refresh end=now for next entry, keep duration choice
    setRange(freshRange(currentDurationMin));
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText type="title">已办</ThemedText>
          <ThemedText type="muted">记录已完成，积累治愈感。</ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={({ pressed }) => [
            styles.settingsButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel="设置">
          <IconSymbol name="gearshape.fill" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={{ flex: 1 }}>
        <QuickInputBar onSubmit={handleSubmit} />
        <TagChipSelector
          tags={tags}
          selectedIds={selectedTagIds}
          onToggle={toggleTag}
        />
        <View style={{ paddingTop: 4, paddingBottom: Spacing.sm }}>
          <DurationPicker
            compact
            startedAt={range.startedAt}
            completedAt={range.completedAt}
            onChange={setRange}
          />
        </View>
        <TimelineList items={items} />
      </KeyboardAvoidingView>

      <ConfettiOverlay trigger={confettiTick} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.md,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
