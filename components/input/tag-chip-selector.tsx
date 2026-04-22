import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { Tag } from '@/db/types';

type Props = {
  tags: Tag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  compact?: boolean;
};

export function TagChipSelector({ tags, selectedIds, onToggle, compact }: Props) {
  const { colors } = useAppTheme();
  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        { paddingHorizontal: Spacing.lg, paddingVertical: compact ? 4 : Spacing.sm },
      ]}>
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        const baseColor = tag.color ?? colors.primary;
        return (
          <Pressable
            key={tag.id}
            onPress={() => onToggle(tag.id)}
            style={[
              styles.chip,
              {
                borderColor: baseColor,
                backgroundColor: selected ? baseColor : 'transparent',
              },
            ]}>
            <ThemedText
              style={{
                color: selected ? colors.surface : colors.text,
                fontSize: 13,
              }}>
              #{tag.name}
            </ThemedText>
          </Pressable>
        );
      })}
      <View style={{ width: Spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
