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
import { QuickInputBar } from '@/components/input/quick-input-bar';
import { QuickSaveDialog } from '@/components/input/quick-save-dialog';
import { ThemedText } from '@/components/themed-text';
import { TimelineList } from '@/components/timeline/timeline-list';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { useTagStore } from '@/store/use-tag-store';

const DEFAULT_DURATION_MIN = 30;

type PendingEntry = {
  content: string;
  range: { startedAt: number; completedAt: number };
};

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const addItem = useDoneStore((s) => s.add);
  const items = useDoneStore((s) => s.items);
  const tags = useTagStore((s) => s.tags);

  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingEntry | null>(null);
  const [lastDurationMin, setLastDurationMin] = useState(DEFAULT_DURATION_MIN);
  const [lastTagIds, setLastTagIds] = useState<number[]>([]);
  const [confettiTick, setConfettiTick] = useState(0);

  const handleInputSubmit = (submitted: string) => {
    const end = Date.now();
    setPending({
      content: submitted,
      range: {
        startedAt: end - lastDurationMin * 60_000,
        completedAt: end,
      },
    });
  };

  const handleConfirm = async ({
    startedAt,
    completedAt,
    tagIds,
  }: {
    startedAt: number;
    completedAt: number;
    tagIds: number[];
  }) => {
    if (!pending) return;
    await addItem({
      content: pending.content,
      startedAt,
      completedAt,
      tagIds,
    });
    setLastDurationMin(
      Math.max(1, Math.round((completedAt - startedAt) / 60_000))
    );
    setLastTagIds(tagIds);
    setPending(null);
    setText('');
    setConfettiTick((n) => n + 1);
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
        <QuickInputBar
          value={text}
          onChangeText={setText}
          onSubmit={handleInputSubmit}
        />
        <TimelineList items={items} />
      </KeyboardAvoidingView>

      <QuickSaveDialog
        visible={pending !== null}
        content={pending?.content ?? ''}
        tags={tags}
        defaultRange={
          pending?.range ?? {
            startedAt: Date.now() - lastDurationMin * 60_000,
            completedAt: Date.now(),
          }
        }
        defaultTagIds={lastTagIds}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />

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
