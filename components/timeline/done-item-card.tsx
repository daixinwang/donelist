import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import type { DoneItem } from '@/db/types';
import { formatDuration, formatTimeRange } from '@/utils/date';

export function DoneItemCard({ item }: { item: DoneItem }) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const durationMs = item.completedAt - item.startedAt;
  const isInstant = durationMs <= 60_000;

  const openEdit = () => {
    haptics.light();
    router.push(`/item/${item.id}`);
  };

  return (
    <Animated.View
      layout={Layout.duration(200)}
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}>
      <Pressable
        onPress={openEdit}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <View style={[styles.check, { backgroundColor: colors.primarySoft }]}>
          <IconSymbol name="checkmark" size={16} color={colors.accent} />
        </View>
        <View style={styles.body}>
          <ThemedText style={styles.content}>{item.content}</ThemedText>
          <View style={styles.meta}>
            <ThemedText type="caption">
              {formatTimeRange(item.startedAt, item.completedAt)}
            </ThemedText>
            {!isInstant && (
              <View
                style={[
                  styles.durationBadge,
                  { backgroundColor: colors.surfaceAlt },
                ]}>
                <ThemedText
                  style={{ color: colors.textMuted, fontSize: 11 }}>
                  {formatDuration(durationMs)}
                </ThemedText>
              </View>
            )}
            {item.tags.map((t) => (
              <View
                key={t.id}
                style={[
                  styles.tagDot,
                  { backgroundColor: t.color ?? colors.tagDefault },
                ]}>
                <ThemedText
                  style={{ color: colors.surface, fontSize: 11 }}>
                  #{t.name}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: Spacing.sm,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  tagDot: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
});
