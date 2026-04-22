import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { DurationPicker } from '@/components/input/duration-picker';
import { TagChipSelector } from '@/components/input/tag-chip-selector';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { getDoneItem } from '@/db/queries/done-items';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { useTagStore } from '@/store/use-tag-store';

export default function ItemEditScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const tags = useTagStore((s) => s.tags);
  const update = useDoneStore((s) => s.update);
  const remove = useDoneStore((s) => s.remove);

  const [content, setContent] = useState('');
  const [range, setRange] = useState<{ startedAt: number; completedAt: number }>(
    { startedAt: Date.now() - 30 * 60_000, completedAt: Date.now() }
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    (async () => {
      const item = await getDoneItem(id);
      if (item) {
        setContent(item.content);
        setRange({ startedAt: item.startedAt, completedAt: item.completedAt });
        setSelectedTagIds(item.tags.map((t) => t.id));
      }
      setLoading(false);
    })();
  }, [id]);

  const toggleTag = (tid: number) =>
    setSelectedTagIds((prev) =>
      prev.includes(tid) ? prev.filter((i) => i !== tid) : [...prev, tid]
    );

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('内容不能为空');
      return;
    }
    haptics.success();
    await update(id, {
      content: content.trim(),
      startedAt: range.startedAt,
      completedAt: range.completedAt,
      tagIds: selectedTagIds,
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('删除这条已办？', '删除后不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          haptics.medium();
          await remove(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText type="muted">载入中…</ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: '编辑已办',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <Pressable onPress={handleSave} style={{ paddingHorizontal: 12 }}>
              <ThemedText style={{ color: colors.accent, fontWeight: '600' }}>
                保存
              </ThemedText>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        <SectionLabel>内容</SectionLabel>
        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          placeholder="完成了什么？"
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        <View style={{ paddingTop: Spacing.lg }}>
          <DurationPicker
            startedAt={range.startedAt}
            completedAt={range.completedAt}
            onChange={setRange}
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="muted">标签</ThemedText>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.manageTagsBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityLabel="管理标签">
            <ThemedText
              type="caption"
              style={{ color: colors.textMuted }}>
              管理标签
            </ThemedText>
            <IconSymbol
              name="chevron.right"
              size={14}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
        <TagChipSelector
          tags={tags}
          selectedIds={selectedTagIds}
          onToggle={toggleTag}
        />

        <View style={{ padding: Spacing.lg, marginTop: Spacing.xl }}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                borderColor: colors.danger,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <IconSymbol name="trash" size={18} color={colors.danger} />
            <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>
              删除
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      }}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textArea: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  deleteButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  manageTagsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
