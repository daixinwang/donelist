import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, tagColorPalette } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { Tag } from '@/db/types';
import { useTagStore } from '@/store/use-tag-store';

export function TagManager() {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const tags = useTagStore((s) => s.tags);
  const addTag = useTagStore((s) => s.add);
  const updateTag = useTagStore((s) => s.update);
  const removeTag = useTagStore((s) => s.remove);

  const [draftName, setDraftName] = useState('');

  const handleAdd = async () => {
    const name = draftName.trim();
    if (!name) return;
    const color = tagColorPalette[tags.length % tagColorPalette.length];
    try {
      await addTag(name, color);
      haptics.success();
      setDraftName('');
    } catch {
      Alert.alert('标签名重复');
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert(`删除 #${tag.name}？`, '不会删除已关联的条目，只解除关联。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          haptics.medium();
          await removeTag(tag.id);
        },
      },
    ]);
  };

  const cycleColor = async (tag: Tag) => {
    const idx = tagColorPalette.findIndex((c) => c === tag.color);
    const next =
      tagColorPalette[(idx + 1 + tagColorPalette.length) % tagColorPalette.length];
    await updateTag(tag.id, { color: next });
    haptics.selection();
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.addRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="新标签名"
          placeholderTextColor={colors.textSubtle}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: colors.accent }]}>
          <IconSymbol name="plus" size={20} color={colors.surface} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {tags.map((t) => (
          <View
            key={t.id}
            style={[
              styles.row,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Pressable
              onPress={() => cycleColor(t)}
              style={[
                styles.swatch,
                { backgroundColor: t.color ?? colors.tagDefault },
              ]}
            />
            <ThemedText style={{ flex: 1 }}>#{t.name}</ThemedText>
            <Pressable onPress={() => handleDelete(t)} hitSlop={10}>
              <IconSymbol name="trash" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
        {tags.length === 0 && (
          <ThemedText type="muted" style={{ paddingVertical: Spacing.md }}>
            还没有标签。
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
  },
});
