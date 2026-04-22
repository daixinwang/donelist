import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { DurationPicker } from '@/components/input/duration-picker';
import { TagChipSelector } from '@/components/input/tag-chip-selector';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Tag } from '@/db/types';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';

type Range = { startedAt: number; completedAt: number };

type Props = {
  visible: boolean;
  content: string;
  tags: Tag[];
  defaultRange: Range;
  defaultTagIds: number[];
  onCancel: () => void;
  onConfirm: (params: Range & { tagIds: number[] }) => void;
};

export function QuickSaveDialog({
  visible,
  content,
  tags,
  defaultRange,
  defaultTagIds,
  onCancel,
  onConfirm,
}: Props) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();

  const [range, setRange] = useState<Range>(defaultRange);
  const [tagIds, setTagIds] = useState<number[]>(defaultTagIds);

  useEffect(() => {
    if (visible) {
      setRange(defaultRange);
      setTagIds(defaultTagIds);
    }
  }, [visible, defaultRange, defaultTagIds]);

  const toggleTag = (id: number) =>
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleConfirm = () => {
    haptics.success();
    onConfirm({ ...range, tagIds });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onCancel} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}>
          <View
            style={[styles.handle, { backgroundColor: colors.border }]}
          />

          <View style={styles.previewBlock}>
            <ThemedText type="caption">完成了</ThemedText>
            <ThemedText
              style={styles.preview}
              numberOfLines={3}>
              {content}
            </ThemedText>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Spacing.lg }}>
            <SectionLabel>标签（可选）</SectionLabel>
            <TagChipSelector
              tags={tags}
              selectedIds={tagIds}
              onToggle={toggleTag}
              compact
            />

            <SectionLabel>时间段</SectionLabel>
            <DurationPicker
              compact
              timeOnly
              startedAt={range.startedAt}
              completedAt={range.completedAt}
              onChange={setRange}
            />
          </ScrollView>

          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border },
            ]}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText style={{ color: colors.textMuted }}>取消</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText style={{ color: colors.surface, fontWeight: '600' }}>
                完成
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText
      type="muted"
      style={{
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    paddingBottom: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  previewBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  preview: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primaryButton: {
    flex: 1.4,
  },
});
