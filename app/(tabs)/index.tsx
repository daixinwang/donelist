import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfettiOverlay } from '@/components/common/confetti-overlay';
import { QuickInputBar } from '@/components/input/quick-input-bar';
import { TagChipSelector } from '@/components/input/tag-chip-selector';
import { ThemedText } from '@/components/themed-text';
import { TimelineList } from '@/components/timeline/timeline-list';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { useTagStore } from '@/store/use-tag-store';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const items = useDoneStore((s) => s.items);
  const addItem = useDoneStore((s) => s.add);
  const tags = useTagStore((s) => s.tags);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [confettiTick, setConfettiTick] = useState(0);

  const toggleTag = (id: number) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleSubmit = async (text: string) => {
    await addItem(text, selectedTagIds);
    setConfettiTick((n) => n + 1);
    // keep tag selection sticky so rapid-fire entries share tags
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">已办</ThemedText>
        <ThemedText type="muted">记录已完成，积累治愈感。</ThemedText>
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
        <TimelineList items={items} />
      </KeyboardAvoidingView>

      <ConfettiOverlay trigger={confettiTick} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: 4,
  },
});
