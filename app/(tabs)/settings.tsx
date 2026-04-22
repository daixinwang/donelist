import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagManager } from '@/components/settings/tag-manager';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { exportAll, importAll, wipeAll, type BackupPayload } from '@/db/queries/backup';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useDoneStore } from '@/store/use-done-store';
import { useSettingsStore } from '@/store/use-settings-store';
import { useTagStore } from '@/store/use-tag-store';

type ThemeOption = 'system' | 'light' | 'dark';
const THEME_OPTIONS: { key: ThemeOption; label: string }[] = [
  { key: 'system', label: '跟随系统' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
];

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const haptics = useHaptics();

  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const themeOverride = useSettingsStore((s) => s.themeOverride);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setAnimationsEnabled = useSettingsStore((s) => s.setAnimationsEnabled);
  const setThemeOverride = useSettingsStore((s) => s.setThemeOverride);

  const refreshDone = useDoneStore((s) => s.refresh);
  const refreshTags = useTagStore((s) => s.refresh);

  const [busy, setBusy] = useState<null | 'export' | 'import' | 'wipe'>(null);

  const handleExport = async () => {
    try {
      setBusy('export');
      const payload = await exportAll();
      const json = JSON.stringify(payload, null, 2);
      const filename = `donelist-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const path = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(path, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: '导出已办备份',
        });
      } else {
        Alert.alert('备份已写入', path);
      }
    } catch (e) {
      Alert.alert('导出失败', String((e as Error).message));
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (pick.canceled) return;
      const uri = pick.assets[0].uri;
      setBusy('import');
      const raw = await FileSystem.readAsStringAsync(uri);
      const payload = JSON.parse(raw) as BackupPayload;

      Alert.alert(
        '导入备份？',
        `将替换现有全部数据：${payload.items?.length ?? 0} 条记录 / ${payload.tags?.length ?? 0} 个标签。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '导入',
            style: 'destructive',
            onPress: async () => {
              try {
                await importAll(payload);
                await refreshTags();
                await refreshDone();
                Alert.alert('导入完成');
              } catch (e) {
                Alert.alert('导入失败', String((e as Error).message));
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('导入失败', String((e as Error).message));
    } finally {
      setBusy(null);
    }
  };

  const handleWipe = () => {
    Alert.alert('清空全部数据？', '此操作不可恢复，标签也会一并清空。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          haptics.medium();
          setBusy('wipe');
          await wipeAll();
          await refreshTags();
          await refreshDone();
          setBusy(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl * 2 }}>
        <View style={styles.header}>
          <ThemedText type="title">设置</ThemedText>
          <ThemedText type="muted">按你的节奏来。</ThemedText>
        </View>

        <Section title="外观">
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <ThemedText type="muted" style={{ marginBottom: 8 }}>
              主题
            </ThemedText>
            <View style={styles.segment}>
              {THEME_OPTIONS.map((o) => {
                const active = themeOverride === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => {
                      haptics.selection();
                      setThemeOverride(o.key);
                    }}
                    style={[
                      styles.segmentOption,
                      {
                        backgroundColor: active
                          ? colors.primarySoft
                          : colors.surfaceAlt,
                        borderColor: active ? colors.accent : 'transparent',
                      },
                    ]}>
                    <ThemedText
                      style={{
                        color: active ? colors.accent : colors.textMuted,
                        fontWeight: active ? '600' : '400',
                      }}>
                      {o.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ToggleRow
            label="记录时撒花/勾号动画"
            value={animationsEnabled}
            onChange={setAnimationsEnabled}
          />
          <ToggleRow
            label="触感反馈（震动）"
            value={hapticsEnabled}
            onChange={setHapticsEnabled}
          />
        </Section>

        <Section title="标签管理">
          <TagManager />
        </Section>

        <Section title="数据">
          <ActionRow
            label={busy === 'export' ? '导出中…' : '导出备份（JSON）'}
            onPress={handleExport}
            disabled={busy !== null}
          />
          <ActionRow
            label={busy === 'import' ? '导入中…' : '从备份恢复'}
            onPress={handleImport}
            disabled={busy !== null}
          />
          <ActionRow
            label="清空全部数据"
            onPress={handleWipe}
            disabled={busy !== null}
            destructive
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="muted" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={{ gap: Spacing.sm }}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <ThemedText style={{ flex: 1 }}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? colors.accent : colors.surfaceAlt}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
      />
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  disabled,
  destructive,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: destructive ? colors.danger : colors.border,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText
        style={{
          color: destructive ? colors.danger : colors.text,
          fontWeight: destructive ? '600' : '400',
        }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  row: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
